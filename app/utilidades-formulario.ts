import { z } from "zod";
import { esquemaFormulario, type ValoresFilaMonitoreo, type ValoresTomaMonitoreo, type ValorSalud, type ValorTriEstado } from "./hse-f001.schema";
import { rolesAprobacion, definicionesMonitoreo, gruposMedidasSeguridad } from "./formulario-config";

export type ValoresFormulario = z.input<typeof esquemaFormulario>;

export const sections = [
  { step: 1, title: "Datos generales" },
  { step: 2, title: "Trabajadores responsables" },
  { step: 3, title: "Medidas de seguridad" },
  { step: 4, title: "Procedimiento seguro y monitoreo ambiental" },
  { step: 5, title: "EPP, rescate y herramientas" },
  { step: 6, title: "Responsabilidades y autorizaciones" },
] as const;

export type NumeroPaso = (typeof sections)[number]["step"];

const valorHoy = new Date().toISOString().slice(0, 10);

function crearDefectosTomaMonitoreo(): ValoresTomaMonitoreo {
  return {
    fecha: valorHoy,
    hora: "",
    resultado: "",
    signature: "",
  };
}

export function crearDefectosFilasMonitoreo(): ValoresFormulario["monitoring"]["rows"] {
  return definicionesMonitoreo.map(() => ({
    takes: [crearDefectosTomaMonitoreo(), crearDefectosTomaMonitoreo()] as ValoresFilaMonitoreo["takes"],
  }));
}

export const valoresDefecto: ValoresFormulario = {
  generalInfo: {
    lugar: "",
    fecha: valorHoy,
    area: "",
    responsable: "",
    centroOperacion: "",
    tiempoSolicitado: "",
    horaInicio: "",
    horaFin: "",
    duracion: "",
    descripcion: "",
    herramientas: "",
    epp: "",
    rescate: "",
    otros: "Ninguno",
    personal: "",
    personalhse: "",
    ciudadania: "",
    trabajador: "",
  },
  workerForm: {
    identificacion: "",
    nombre: "",
    cargo: "",
    salud: "Seleccione una opción" as ValorSalud,
    observacion: "",
  },
  extraWorkers: [],
  safetyChecks: Object.fromEntries(
    gruposMedidasSeguridad.flatMap((group) => group.items.map((item) => [item.key, "Seleccione una opción" as ValorTriEstado]))
  ) as ValoresFormulario["safetyChecks"],
  monitoring: {
    rows: crearDefectosFilasMonitoreo(),
    equipoMedicion: "",
  },
  approvalPeople: rolesAprobacion.map((role) => ({
    role,
    nombre: "",
    identificacion: "",
    signature: "",
  })) as ValoresFormulario["approvalPeople"],
  signatures: {
    trabajador: "",
    hse: "",
    responsable: "",
  },
  observaciones: "",
  cierreCancelacion: "",
  declarationAccepted: false,
};

export function obtenerCamposPorPaso(step: NumeroPaso, values: ValoresFormulario): string[] {
  if (step === 1) {
    return [
      "generalInfo.lugar",
      "generalInfo.fecha",
      "generalInfo.area",
      "generalInfo.responsable",
      "generalInfo.centroOperacion",
      "generalInfo.tiempoSolicitado",
      "generalInfo.horaInicio",
      "generalInfo.horaFin",
      "generalInfo.duracion",
      "generalInfo.descripcion",
      "generalInfo.herramientas",
    ];
  }

  if (step === 2) {
    const extraWorkerPaths = values.extraWorkers.flatMap((_, index) => [
      `extraWorkers.${index}.identificacion`,
      `extraWorkers.${index}.nombre`,
      `extraWorkers.${index}.cargo`,
      `extraWorkers.${index}.salud`,
      `extraWorkers.${index}.observacion`,
      `extraWorkers.${index}.signature`,
    ]);

    return [
      "workerForm.identificacion",
      "workerForm.nombre",
      "workerForm.cargo",
      "workerForm.salud",
      "workerForm.observacion",
      "signatures.trabajador",
      ...extraWorkerPaths,
    ];
  }

  if (step === 3) {
    return Object.keys(values.safetyChecks).map((field) => `safetyChecks.${field}`);
  }

  if (step === 4) {
    // La sección 4 es totalmente opcional: no bloquea la navegación si el usuario no completa ningún campo.
    return [];
  }

  if (step === 5) {
    return ["generalInfo.epp", "generalInfo.rescate"];
  }

  if (step === 6) {
    return [
      "generalInfo.personal",
      "generalInfo.personalhse",
      "generalInfo.ciudadania",
      "generalInfo.trabajador",
      "signatures.hse",
      "signatures.responsable",
      "declarationAccepted",
      ...values.approvalPeople.flatMap((_, index) => [
        `approvalPeople.${index}.nombre`,
        `approvalPeople.${index}.identificacion`,
        `approvalPeople.${index}.signature`,
      ]),
    ];
  }

  return [];
}

export function crearDefectosVerificacionSeguridad() {
  return Object.fromEntries(
    gruposMedidasSeguridad.flatMap((group) => group.items.map((item) => [item.key, "Seleccione una opción" as ValorTriEstado]))
  );
}

export function crearDefectosPersonasAprobacion() {
  return rolesAprobacion.map((role) => ({
    role,
    nombre: "",
    identificacion: "",
    signature: "",
  }));
}

export function calcularDuracion(inicio: string, fin: string) {
  if (!inicio || !fin) return "";
  const [inicioHoras, inicioMinutos] = inicio.split(":").map(Number);
  const [finHoras, finMinutos] = fin.split(":").map(Number);
  if ([inicioHoras, inicioMinutos, finHoras, finMinutos].some(Number.isNaN)) return "";
  let minutos = finHoras * 60 + finMinutos - (inicioHoras * 60 + inicioMinutos);
  if (minutos < 0) minutos += 24 * 60;
  const horas = minutos / 60;
  const valorFormateado = Number.isInteger(horas) ? horas.toFixed(0) : horas.toFixed(1);
  return `${valorFormateado} horas`;
}

export function compactarObjeto<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, current]) => {
      if (current === "" || current === null || current === undefined) return false;
      if (typeof current === "object" && current !== null && !Array.isArray(current)) return Object.keys(current).length > 0;
      return true;
    })
  ) as Partial<T>;
}

export function compactarObjetoSeleccion<T extends Record<string, string>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, current]) => current !== "" && current !== "Seleccione una opción")
  ) as Partial<T>;
}

export function resumirEnlaceFirma(label: string, signature?: string) {
  const normalizedSignature = signature ?? "";
  return {
    registrado: Boolean(normalizedSignature),
    enlace: normalizedSignature ? `firma://${label}` : "",
    puntos: normalizedSignature ? normalizedSignature.length : 0,
  };
}

export { rolesAprobacion, definicionesMonitoreo, gruposMedidasSeguridad };
