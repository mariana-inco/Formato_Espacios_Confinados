export const opcionesSiNo = [
  { value: "Seleccione una opción", label: "Seleccione una opción" },
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
] as const;

export const opcionesTriEstado = [
  { value: "Seleccione una opción", label: "Seleccione una opción" },
  { value: "NA", label: "NA" },
  { value: "SI", label: "SI" },
  { value: "NO", label: "NO" },
] as const;

export const rolesAprobacion = [
  "Supervisor espacios confinados",
  "Vigia responsable de la actividad",
  "Trabajador entrante espacio confinado",
  "Jefe del área / Líder de proceso",
] as const;

export const gruposMedidasSeguridad = [
  {
    title: "Medidas de Seguridad a tomar para realizar el servicio",
    items: [
      { key: "permisoPrevio", label: "Se diligencia el permiso de manera previa a la actividad" },
      { key: "procedimientoSocializado", label: "Se cuenta con un procedimiento de trabajo y se ha socializado al personal" },
      {
        key: "senalizacionArea",
        label: "Acordonar el área y ubicar señalización informativa como obreros trabajando, no pase, peligro, barricadas, avisos iluminados. que informen sobre el personal autorizado que esté operando",
      },
      { key: "instruccionActualizada", label: "Leído y entendida la instrucción de trabajo actualizada por parte del personal sobre espacios confinados" },
      { key: "verificacionRedes", label: "Verificación de las redes existentes en la zona: acueducto y alcantarillado mediante planos y recorrido de campo." },
      { key: "estadoSaludTrabajadores", label: "Verificación sobre el estado de salud de los trabajadores (claustrofobia, asma, entre otros)" },
      { key: "brigadaEmergencias", label: "Personal de la brigada de emergencias en la zona de trabajo o cercana a ella" },
      { key: "eppAdecuados", label: "Personal con los EPP adecuados para la labor" },
    ],
  },
  {
    title: "ASPECTOS LIGADOS AL TRABAJADOR",
    items: [
      { key: "seguridadSocial", label: "Los trabajadores cuentan con seguridad social vigente" },
      { key: "conceptoMedico", label: "El personal cuenta con concepto médico ocupacional apto para la ejecución de la labor" },
      { key: "formacionEspecifica", label: "El personal cuenta con formación específica en espacios confinados ( Entrante, vigía, supervisor) " },
      { key: "guantesCaucho", label: "El personal cuenta con guantes  de caucho" },
      { key: "revisionCondiciones", label: "Revisión de las condiciones de seguridad del área" },
      { key: "escalerasAdecuadas", label: "Escaleras de acceso en estado adecuado para el ingreso y salida del personal" },
      { key: "demarcacionArea", label: "Demarcación del área de trabajo" },
      { key: "planEmergencias", label: "Instrucciones al personal sobre el plan de emergencias mientras realizan las actividades." },
      { key: "areaLibrePersonal", label: "Qué el área este libre de personal ajeno a las labores" },
      { key: "ventilacionPrevia", label: "¿El espacio confinado se ha dejado ventilar previamente?" },
      { key: "inspeccionEquipos", label: "Inspección preoperacional de equipos y herramientas a utilizar para la actividad" },
      { key: "botiquinExtintorCamilla", label: "Botiquín de primeros auxilios en la zona, Extintor y camilla de emergencias." },
      { key: "salidasEvacuacion", label: "Se encuentran sin obstáculos las salidas previstas para evacuación" },
      {
        key: "vigiaExclusivo",
        label: "Se ha asignado una persona de manera permanente y exclusiva para garantizar ayuda oportuna al personal que labora en el interior del espacio confinado (Vigía del espacio confinado)",
      },
    ],
  },
] as const;

export const definicionesMonitoreo = [
  { key: "oxigeno", label: "OXIGENO", helper: "19.5 a 23.5 %" },
  { key: "co", label: "CO", helper: "< 25 PPM" },
  { key: "so2", label: "SO2", helper: "< 2 PPM" },
  { key: "h2s", label: "H2S", helper: "< 10 PPM" },
  { key: "inflamabilidad", label: "INFLAMABILIDAD", helper: "< 5 % del LII" },
  { key: "temperatura", label: "TEMPERATURA", helper: "17 y 23 oC WGBT" },
] as const;
