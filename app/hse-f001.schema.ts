import { z } from "zod";

// Esquema de validación para el formulario utilizando Zod
const dateSchema = z
  .string()
  .min(1, "La fecha es obligatoria")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: "La fecha no es válida",
  });

// Esquema de validación para la hora en formato HH:MM
const timeSchema = z
  .string()
  .min(1, "El campo es obligatorio")
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM");

// Función para crear esquemas de texto no vacío con longitud mínima
const nonEmptyText = (label: string, min = 3) =>
  z.string().trim().min(1, `${label} es obligatorio`).min(min, `${label} debe tener al menos ${min} caracteres`);


// Función para crear esquemas de texto numérico con longitud mínima
const numericText = (label: string, minLength = 3) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .regex(/^\d+$/, `${label} solo puede contener números`)
    .min(minLength, `${label} debe tener al menos ${minLength} dígitos`);


// Esquema principal del formulario, organizando los campos en secciones lógicas
export const formSchema = z.object({
  generalInfo: z.object({
    lugar: nonEmptyText("El lugar"),
    fecha: dateSchema,
    area: nonEmptyText("El área"),
    responsable: nonEmptyText("El responsable"),
    centroOperacion: nonEmptyText("El centro de operación"),
    tiempoSolicitado: numericText("El tiempo solicitado", 1),
    horaInicio: timeSchema,
    horaFin: timeSchema,
    duracion: z.string().trim().min(1, "La duración es obligatoria"),
    descripcion: nonEmptyText("La descripción de la actividad", 10),
    herramientas: nonEmptyText("Las herramientas", 5),
    epp: nonEmptyText("Los EPP", 5),
    rescate: nonEmptyText("El equipo de rescate", 5),
    otros: z.string().trim().min(1, "El campo otros es obligatorio"),
    personal: numericText("La cédula del personal HSE", 3),
    personalhse: nonEmptyText("El nombre del personal HSE", 3),
    ciudadania: numericText("La cédula de ciudadanía", 3),
    trabajador: nonEmptyText("El nombre del responsable", 3),
  }),

  // Esquema para la sección de trabajadores, con validación condicional basada en el estado de salud
  workerForm: z.object({
    identificacion: numericText("La identificación", 3),
    nombre: nonEmptyText("El nombre completo", 3),
    cargo: nonEmptyText("El cargo", 3),
    salud: z
      .enum(["Seleccione una opcion", "Sí", "No"])
      .refine((value) => value !== "Seleccione una opcion", {
        message: "Selecciona si está en buen estado de salud",
      }),
    observacion: z.string().trim().optional(),
  }).superRefine((value, ctx) => {
    if (value.salud === "No" && !value.observacion?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["observacion"],
        message: "Debes registrar la observación del estado de salud",
      });
    }
  }),

  // Esquema para trabajadores adicionales, permitiendo un array de objetos con validación similar a la del trabajador principal
  extraWorkers: z.array(
    z.object({
      id: z.number(),
      identificacion: numericText("La identificación del trabajador adicional", 3),
      salud: z
        .enum(["Seleccione una opcion", "Sí", "No"])
        .refine((value) => value !== "Seleccione una opcion", {
          message: "Selecciona Sí o No",
        }),
      observacion: z.string().trim().optional(),
      signature: z.string().trim().optional(),
    }).superRefine((value, ctx) => {
      if (value.salud === "No" && !value.observacion?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["observacion"],
          message: "Debes registrar la observación del estado de salud",
        });
      }
      if (value.salud !== "No" && !value.signature?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["signature"],
          message: "La firma del trabajador adicional es obligatoria",
        });
      }
    })
  ),

  // Esquema para las firmas, asegurando que todas las firmas requeridas estén presentes
  signatures: z.object({
    trabajador: z.string().trim().optional(),
    hse: z.string().trim().min(1, "La firma del personal HSE es obligatoria"),
    responsable: z.string().trim().min(1, "La firma del responsable es obligatoria"),
  }),
  declarationAccepted: z.boolean().refine((value) => value, {
    message: "Debes aceptar la declaración de responsabilidad",
  }),
}).superRefine((value, ctx) => {
  if (value.workerForm.salud !== "No" && !value.signatures.trabajador?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["signatures", "trabajador"],
      message: "La firma del trabajador es obligatoria",
    });
  }
});

export type SaludValue = z.infer<typeof formSchema.shape.workerForm.shape.salud>;
export type WorkerFormValues = {
  identificacion: string;
  nombre: string;
  cargo: string;
  salud: SaludValue;
  observacion?: string;
};

export type ExtraWorkerValues = {
  id: number;
  identificacion: string;
  salud: SaludValue;
  observacion?: string;
  signature: string;
};
export type HseF001Payload = z.infer<typeof formSchema>;
