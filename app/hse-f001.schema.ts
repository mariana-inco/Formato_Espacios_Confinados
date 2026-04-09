import { z } from "zod";
import { definicionesMonitoreo } from "./formulario-config";

const esquemaFecha = z
  .string()
  .min(1, "La fecha es obligatoria")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: "La fecha no es válida",
  });

const esquemaHora = z
  .string()
  .min(1, "El campo es obligatorio")
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM");

const textoNoVacio = (label: string, min = 3) =>
  z.string().trim().min(1, `${label} es obligatorio`).min(min, `${label} debe tener al menos ${min} caracteres`);

const textoNumerico = (label: string, minLength = 3) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .regex(/^\d+$/, `${label} solo puede contener números`)
    .min(minLength, `${label} debe tener al menos ${minLength} dígitos`);

const esquemaSeleccionSimple = z.enum(["Seleccione una opción", "Sí", "No"]);
const esquemaSeleccionTriEstado = z.enum(["Seleccione una opción", "Sí", "No", "NA"]);

const esquemaObjetoTrabajador = z.object({
  identificacion: textoNumerico("La identificación", 3),
  nombre: textoNoVacio("El nombre completo", 3),
  cargo: textoNoVacio("El cargo", 3),
  salud: esquemaSeleccionSimple.refine((value) => value !== "Seleccione una opción", {
    message: "Selecciona si está en buen estado de salud",
  }),
  observacion: z.string().trim().optional(),
});

const esquemaBaseTrabajador = esquemaObjetoTrabajador
  .superRefine((value, ctx) => {
    if (value.salud === "No" && !value.observacion?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["observacion"],
        message: "Debes registrar la observación del estado de salud",
      });
    }
  });

const esquemaPersonaAprobacion = z.object({
  role: z.string().trim().min(1, "El rol es obligatorio"),
  nombre: textoNoVacio("El nombre", 3),
  identificacion: textoNumerico("La identificación", 3),
  signature: z.string().trim().min(1, "La firma es obligatoria"),
});

const esquemaTomaMonitoreo = z.object({
  fecha: esquemaFecha,
  hora: esquemaHora,
  resultado: z.string().trim().min(1, "El resultado es obligatorio"),
  signature: z.string().trim().min(1, "La firma es obligatoria"),
});

const esquemaFilaMonitoreo = z.object({
  takes: z.tuple([esquemaTomaMonitoreo, esquemaTomaMonitoreo]),
});

export const esquemaFormulario = z
  .object({
    generalInfo: z.object({
      lugar: textoNoVacio("El lugar"),
      fecha: esquemaFecha,
      area: textoNoVacio("El área"),
      responsable: textoNoVacio("El responsable", 3),
      centroOperacion: textoNoVacio("El centro de operación", 3),
      tiempoSolicitado: textoNumerico("El tiempo solicitado", 1),
      horaInicio: esquemaHora,
      horaFin: esquemaHora,
      duracion: z.string().trim().min(1, "La duración es obligatoria"),
      descripcion: textoNoVacio("La descripción de la actividad", 10),
      herramientas: textoNoVacio("Las herramientas", 5),
      epp: textoNoVacio("Los EPP", 5),
      rescate: textoNoVacio("El equipo de rescate", 5),
      otros: z.string().trim().min(1, "El campo otros es obligatorio"),
      personal: textoNumerico("La cédula del personal HSE", 3),
      personalhse: textoNoVacio("El nombre del personal HSE", 3),
      ciudadania: textoNumerico("La cédula de ciudadanía", 3),
      trabajador: textoNoVacio("El nombre del responsable", 3),
    }),
    workerForm: esquemaBaseTrabajador,
    extraWorkers: z.array(
      esquemaObjetoTrabajador.extend({
        id: z.number(),
        signature: z.string().trim().optional(),
      }).superRefine((value, ctx) => {
        if (value.salud !== "No" && !value.signature?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["signature"],
            message: "La firma del trabajador adicional es obligatoria",
          });
        }
      })
    ),
    safetyChecks: z.record(z.string(), esquemaSeleccionTriEstado),
    monitoring: z.object({
      rows: z
        .array(esquemaFilaMonitoreo)
        .length(definicionesMonitoreo.length, "Debes completar las dos tomas de monitoreo"),
      equipoMedicion: textoNoVacio("El equipo de medición a utilizar", 3),
    }),
    approvalPeople: z.array(esquemaPersonaAprobacion).length(4, "Debes registrar los cuatro roles de autorización"),
    signatures: z.object({
      trabajador: z.string().trim().optional(),
      hse: z.string().trim().min(1, "La firma del personal HSE es obligatoria"),
      responsable: z.string().trim().min(1, "La firma del responsable es obligatoria"),
    }),
    observaciones: z.string().trim().optional(),
    cierreCancelacion: z.string().trim().optional(),
    declarationAccepted: z.boolean().refine((value) => value, {
      message: "Debes aceptar la declaración de responsabilidad",
    }),
  })
  .superRefine((value, ctx) => {
    if (value.workerForm.salud !== "No" && !value.signatures.trabajador?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["signatures", "trabajador"],
        message: "La firma del trabajador es obligatoria",
      });
    }

    // Validación para safetyChecks: todos los campos deben estar seleccionados
    for (const [key, val] of Object.entries(value.safetyChecks)) {
      if (val === "Seleccione una opción") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["safetyChecks", key],
          message: "Debes seleccionar una opción para todas las medidas de seguridad",
        });
      }
    }
  });

export type ValorSalud = z.infer<typeof esquemaSeleccionSimple>;
export type ValorTriEstado = z.infer<typeof esquemaSeleccionTriEstado>;
export type ValoresFormularioTrabajador = {
  identificacion: string;
  nombre: string;
  cargo: string;
  salud: ValorSalud;
  observacion?: string;
};

export type ValoresTrabajadorExtra = {
  id: number;
  identificacion: string;
  nombre: string;
  cargo: string;
  salud: ValorSalud;
  observacion?: string;
  signature: string;
};

export type ValoresPersonaAprobacion = {
  role: string;
  nombre: string;
  identificacion: string;
  signature: string;
};

export type ValoresTomaMonitoreo = z.infer<typeof esquemaTomaMonitoreo>;
export type ValoresFilaMonitoreo = z.infer<typeof esquemaFilaMonitoreo>;

export type CargaFormularioHseF001 = z.infer<typeof esquemaFormulario>;
