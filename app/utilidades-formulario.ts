import { z } from "zod";
import { formSchema, type SaludValue } from "./hse-f001.schema";

export type FormValues = z.input<typeof formSchema>;
export type StepNumber = 1 | 2 | 3 | 4;

export const sections = [
  { step: 1, title: "Información general del Trabajo" },
  { step: 2, title: "Personal Autorizado y Responsables" },
  { step: 3, title: "Condiciones de seguridad y verificación" },
  { step: 4, title: "Autorización y declaración de responsabilidad" },
] as const;

export const defaultValues: FormValues = {
  generalInfo: {
    lugar: "",
    fecha: new Date().toISOString().slice(0, 10),
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
    otros: "",
    personal: "",
    personalhse: "",
    ciudadania: "",
    trabajador: "",
  },
  workerForm: {
    identificacion: "",
    nombre: "",
    cargo: "",
    salud: "Seleccione una opcion" as SaludValue,
    dificultad: "",
  },
  extraWorkers: [],
  signatures: {
    trabajador: "",
    hse: "",
    responsable: "",
  },
  declarationAccepted: false,
};

export const stepFields: Record<StepNumber, string[]> = {
  1: [
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
  ],
  2: ["workerForm.identificacion", "workerForm.nombre", "workerForm.cargo", "workerForm.salud", "workerForm.dificultad", "signatures.trabajador"],
  3: ["generalInfo.epp", "generalInfo.rescate", "generalInfo.otros"],
  4: [
    "generalInfo.personal",
    "generalInfo.personalhse",
    "generalInfo.ciudadania",
    "generalInfo.trabajador",
    "signatures.hse",
    "signatures.responsable",
    "declarationAccepted",
  ],
};

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

export function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, current]) => {
      if (current === "" || current === null || current === undefined) return false;
      if (typeof current === "object" && current !== null && !Array.isArray(current)) return Object.keys(current).length > 0;
      return true;
    })
  ) as Partial<T>;
}

export function summarizeSignatureLink(label: string, signature: string) {
  return {
    registrado: Boolean(signature),
    enlace: signature ? `firma://${label}` : "",
    puntos: signature ? signature.length : 0,
  };
}
