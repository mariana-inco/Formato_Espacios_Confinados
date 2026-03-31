"use client";
import Image from "next/image";
//useCallback para funciones que se pasan a componentes hijos y podrían causar renders innecesarios
//useEffect para manejar efectos secundarios como eventos de scroll o resize
//useRef para mantener referencias a elementos del DOM, como el canvas de firma
//useState para manejar el estado de la aplicación, como el paso activo, la información del formulario y las firmas
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formSchema,
  type ExtraWorkerValues,
  type HseF001Payload,
  type SaludValue,
  type WorkerFormValues,
} from "./hse-f001.schema";

const sections = [
  { step: 1, title: "Información general del Trabajo" },
  { step: 2, title: "Personal Autorizado y Responsables" },
  { step: 3, title: "Condiciones de seguridad y verificación" },
  { step: 4, title: "Autorización y declaración de responsabilidad" },
] as const;

type StepNumber = (typeof sections)[number]["step"];

// Función para calcular la duración entre dos horas en formato "HH:MM"
function calcularDuracion(inicio: string, fin: string) {
  if (!inicio || !fin) return "";
  // Convertir horas y minutos a números
  const [inicioHoras, inicioMinutos] = inicio.split(":").map(Number);
  // Validar que las horas y minutos sean números válidos
  const [finHoras, finMinutos] = fin.split(":").map(Number);
  // Si alguna de las partes no es un número válido, retornar cadena vacía
  if ([inicioHoras, inicioMinutos, finHoras, finMinutos].some(Number.isNaN)) return "";

  // Calcular la duración en minutos, considerando el caso de cruce de medianoche
  let minutos = finHoras * 60 + finMinutos - (inicioHoras * 60 + inicioMinutos);
  // Si el resultado es negativo, significa que se cruzó la medianoche, por lo que se suma un día (24 horas)
  if (minutos < 0) minutos += 24 * 60;
  // Convertir minutos a horas con un decimal
  const horas = minutos / 60;
  const valorFormateado = Number.isInteger(horas) ? horas.toFixed(0) : horas.toFixed(1);

  return `${valorFormateado} horas`;
}

export default function Home() {
  //Estado para manejar el paso activo del formulario, la visibilidad del botón de scroll,
  const [activeStep, setActiveStep] = useState<StepNumber>(1);

  //Estado para manejar la información general del trabajo, el formulario del trabajador, los trabajadores adicionales y las firmas
  const [showScrollTop, setShowScrollTop] = useState(false);

  //Información general del trabajo
  const [generalInfo, setGeneralInfo] = useState({
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
  });

  //Formulario del trabajador principal
  const [workerForm, setWorkerForm] = useState<WorkerFormValues>({
    identificacion: "",
    nombre: "",
    cargo: "",
    salud: "Seleccione una opcion" as SaludValue,
    dificultad: "",
  });
  //Trabajadores adicionales
  const [extraWorkers, setExtraWorkers] = useState<ExtraWorkerValues[]>([]);
  //Firmas
  const [workerSignature, setWorkerSignature] = useState("");

  //Firmas de personal HSE y responsable de ejecución
  const [hseSignature, setHseSignature] = useState("");

  //Errores de validación de firma
  const [leaderSignature, setLeaderSignature] = useState("");

  //Estado para manejar errores de validación de la firma del trabajador
  const [workerSignatureError, setWorkerSignatureError] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(true);

  //Referencias para el canvas de firma del trabajador y flags para controlar el estado de dibujo
  const workerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionContentRef = useRef<HTMLDivElement | null>(null);

  //useRef para controlar si el trabajador está dibujando en el canvas y si ha realizado algún trazo
  const workerIsDrawingRef = useRef(false);

  //useRef para controlar si el trabajador ha realizado algún trazo en el canvas
  const workerHasStrokeRef = useRef(false);

  //Calcular el progreso del formulario, obtener la sección actual
  const totalSteps = 4;

  //Calcular el progreso del formulario como porcentaje
  const progress = (activeStep / totalSteps) * 100;

  //Encontrar la sección actual basada en el paso activo, o usar la primera sección como fallback
  const currentSection = sections.find((section) => section.step === activeStep) ?? sections[0];

  //Calcular la duración entre hora de inicio y fin, o usar el valor manual si no se pueden calcular
  const durationValue = calcularDuracion(generalInfo.horaInicio, generalInfo.horaFin) || generalInfo.duracion;
  const payload: HseF001Payload = {
    generalInfo: {
      ...generalInfo,
      duracion: durationValue,
    },
    workerForm,
    extraWorkers: extraWorkers.map((worker) => ({
      id: worker.id,
      identificacion: worker.identificacion,
      salud: worker.salud,
      dificultad: worker.dificultad,
      signature: worker.signature,
    })),
    signatures: {
      trabajador: workerSignature,
      hse: hseSignature,
      responsable: leaderSignature,
    },
    declarationAccepted,
  };
  const consolePayload = {
    ...payload,
    signatures: {
      trabajador: summarizeSignatureLink("trabajador", workerSignature),
      hse: summarizeSignatureLink("hse", hseSignature),
      responsable: summarizeSignatureLink("responsable", leaderSignature),
    },
  };
  const validationResult = formSchema.safeParse(payload);
  const isFormValid = validationResult.success;
  const fieldErrors = validationResult.success
    ? {}
    : validationResult.error.issues.reduce<Record<string, string>>((acc, issue) => {
        const key = issue.path.join(".");
        if (!acc[key]) acc[key] = issue.message;
        return acc;
      }, {});
  const getError = (path: string) => fieldErrors[path];

  //Funciones para manejar la firma del trabajador, redimensionar el canvas, restaurar la firma desde base64
  const getCanvasContext = useCallback(() => workerCanvasRef.current?.getContext("2d") ?? null, []);

  //Función para hacer scroll suave al inicio de la página
   const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  //Función para restaurar la firma del trabajador desde una imagen en base64, dibujándola en el canvas
  const restoreSignature = useCallback(
    (firmaBase64: string) => {
      const canvas = workerCanvasRef.current;
      if (!canvas || !firmaBase64) return;

      // Crear una nueva imagen y dibujarla en el canvas cuando se cargue
      const ctx = getCanvasContext();
      if (!ctx) return;

      // Limpiar el canvas antes de dibujar la firma restaurada
      const image = new window.Image();
      image.onload = () => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      };
      image.src = firmaBase64;
    },
    [getCanvasContext]
  );

  //Función para redimensionar el canvas de firma del trabajador, ajustando su tamaño al contenedor y restaurando la firma si existe
  const resizeWorkerCanvas = useCallback(() => {
    const canvas = workerCanvasRef.current;
    if (!canvas) return;

    // Ajustar el tamaño del canvas al tamaño de su contenedor padre
    const parent = canvas.parentElement;
    if (!parent) return;

  // Obtener el ancho del contenedor y establecer una altura fija para el canvas
    const width = parent.clientWidth;
    const height = 280;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Configurar el contexto del canvas con estilos de dibujo y restaurar la firma si existe, o limpiar el canvas si no hay firma
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";

    // Restaurar la firma del trabajador si existe, o limpiar el canvas si no hay firma
    if (workerSignature) {
      restoreSignature(workerSignature);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [getCanvasContext, restoreSignature, workerSignature]);

  //useEffect para redimensionar el canvas de firma del trabajador al cargar la página 
  useEffect(() => {
    resizeWorkerCanvas();
    window.addEventListener("resize", resizeWorkerCanvas);
    return () => window.removeEventListener("resize", resizeWorkerCanvas);
  }, [resizeWorkerCanvas]);

  useEffect(() => {
    if (!sectionContentRef.current) return;
    window.requestAnimationFrame(() => {
      sectionContentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [activeStep]);
  
  //useEffect para mostrar u ocultar el botón de scroll al inicio dependiendo de la posición de scroll del usuario
    useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  //useEffect para redimensionar el canvas de firma del trabajador cada vez que se cambia al paso 2, asegurando que el canvas se ajuste correctamente al contenedor
  useEffect(() => {
    if (activeStep === 2) {
      window.requestAnimationFrame(() => resizeWorkerCanvas());
    }
  }, [activeStep, resizeWorkerCanvas]);

  //Funciones para manejar el dibujo de la firma del trabajador
  const startWorkerDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = workerCanvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    workerIsDrawingRef.current = true;
    workerHasStrokeRef.current = false;
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  };

  //Función para manejar el dibujo de la firma del trabajador, dibujando líneas en el canvas a medida que el usuario mueve el puntero mientras está dibujando
  const drawWorkerSignature = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!workerIsDrawingRef.current) return;
    const canvas = workerCanvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    // Dibujar una línea desde la última posición hasta la nueva posición del puntero, ajustando las coordenadas para tener en cuenta la posición del canvas en la página
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    workerHasStrokeRef.current = true;
  };

  //Función para manejar el fin del dibujo de la firma del trabajador, liberando el puntero y guardando la firma como una imagen en base64 si se ha dibujado algo en el canvas, o mostrando un error si no se ha dibujado nada
  const stopDrawing = () => {
    const canvas = workerCanvasRef.current;
    if (!canvas) return;

    workerIsDrawingRef.current = false;
    if (workerHasStrokeRef.current) {
      const signature = canvas.toDataURL("image/png");
      setWorkerSignature(signature);
      setWorkerSignatureError("");
    }
  };

  //Función para limpiar la firma del trabajador, borrando el canvas y reseteando el estado de la firma y los errores
  const clearWorkerSignature = () => {
    const canvas = workerCanvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setWorkerSignature("");
    setWorkerSignatureError("");
    workerHasStrokeRef.current = false;
  };

  //Funciones para manejar la navegación entre pasos del formulario, asegurando que el usuario no pueda avanzar más allá del último paso ni retroceder antes del primer paso
  const nextStep = () => {
    if (activeStep < totalSteps) {
      setActiveStep((value) => (value + 1) as StepNumber);
    }
  };

  // Función para manejar el paso anterior del formulario, asegurando que el usuario no pueda retroceder antes del primer paso
  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep((value) => (value - 1) as StepNumber);
    }
  };

//Función para manejar el envío del formulario, recopilando toda la información y las firmas en un objeto payload, mostrando el resultado en la consola y alertando al usuario que el formulario se ha enviado correctamente
  const handleSubmitForm = () => {
    setValidationAttempted(true);
    if (!isFormValid) return;

    console.log("Formulario enviado");
    console.log(JSON.stringify(consolePayload, null, 2));
    window.alert("Formulario enviado correctamente");
  };

  // Función para resumir una firma en base64 a una cadena más corta para facilitar su visualización en la consola, tomando los primeros 30 caracteres y los últimos 30 caracteres de la cadena original
  const addWorkerEntry = () => {
    setExtraWorkers((prev) => {
      const nextId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 2;
      return [
        ...prev,
        {
          id: nextId,
          identificacion: "",
          salud: "Seleccione una opcion" as SaludValue,
          dificultad: "",
          signature: "",
        },
      ];
    });
  };

  // Función para eliminar un trabajador adicional del formulario, filtrando el estado de trabajadores adicionales para remover el trabajador con el id especificado
  const removeWorkerEntry = (id: number) => {
    setExtraWorkers((prev) => prev.filter((worker) => worker.id !== id));
  };

  // Función para actualizar un campo específico de un trabajador adicional, mapeando el estado de trabajadores adicionales para actualizar el campo especificado del trabajador con el id dado
  const updateWorkerEntry = (
    id: number,
    field: "identificacion" | "salud" | "dificultad" | "signature",
    value: string | SaludValue
  ) => {
    setExtraWorkers((prev) =>
      prev.map((worker) =>
        worker.id === id ? { ...worker, [field]: value as string } : worker
      )
    );
  };

  // Función para resumir una firma en base64 a una cadena más corta para facilitar su visualización en la consola, tomando los primeros 30 caracteres y los últimos 30 caracteres de la cadena original
  const renderSection = (step: StepNumber) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <SectionGroup title="Ubicación y fechas" description="Completa primero el lugar y la fecha del permiso.">
              <div className="info-grid info-grid--two">
                <Field
                  label="LUGAR"
                  value={generalInfo.lugar}
                  placeholder="Ej. Mosquera"
                  error={validationAttempted ? getError("generalInfo.lugar") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, lugar: value }))}
                />
                <Field
                  label="FECHA"
                  value={generalInfo.fecha}
                  type="date"
                  error={validationAttempted ? getError("generalInfo.fecha") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, fecha: value }))}
                  helper="Formato AAAA-MM-DD"
                />
              </div>
            </SectionGroup>
            <SectionGroup title="Persona y operación" description="Identifica a quién se concede el permiso y dónde se ejecutará.">
              <div className="info-grid info-grid--two">
                <Field
                  label="SE CONCEDE EL PERMISO A"
                  value={generalInfo.responsable}
                  placeholder="Nombre completo"
                  error={validationAttempted ? getError("generalInfo.responsable") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, responsable: value }))}
                />
                <Field
                  label="ÁREA"
                  value={generalInfo.area}
                  as="select"
                  error={validationAttempted ? getError("generalInfo.area") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, area: value }))}
                  options={["Producción", "Mantenimiento", "Operaciones", "Calidad", "Otro"]}
                  helper="Selecciona el área más cercana al trabajo."
                />
                <Field
                  label="CENTRO DE OPERACIÓN"
                  value={generalInfo.centroOperacion}
                  placeholder="Ej. Ammann"
                  error={validationAttempted ? getError("generalInfo.centroOperacion") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, centroOperacion: value }))}
                />
                <Field
                  label="TIEMPO SOLICITADO"
                  value={generalInfo.tiempoSolicitado}
                  type="number"
                  placeholder="Ej. 96"
                  error={validationAttempted ? getError("generalInfo.tiempoSolicitado") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, tiempoSolicitado: value }))}
                />
              </div>
            </SectionGroup>
            <SectionGroup title="Horario y duración" description="Si completas hora de inicio y fin, la duración se actualiza automáticamente.">
              <div className="info-grid info-grid--three">
                <Field
                  label="DE LAS"
                  value={generalInfo.horaInicio}
                  type="time"
                  center
                  error={validationAttempted ? getError("generalInfo.horaInicio") : undefined}
                  onChange={(value) =>
                    setGeneralInfo((prev) => ({
                      ...prev,
                      horaInicio: value,
                      duracion: calcularDuracion(value, prev.horaFin) || prev.duracion,
                    }))
                  }
                />
                <Field
                  label="A LAS"
                  value={generalInfo.horaFin}
                  type="time"
                  center
                  error={validationAttempted ? getError("generalInfo.horaFin") : undefined}
                  onChange={(value) =>
                    setGeneralInfo((prev) => ({
                      ...prev,
                      horaFin: value,
                      duracion: calcularDuracion(prev.horaInicio, value) || prev.duracion,
                    }))
                  }
                />
                <Field
                  label="DURACIÓN ESTIMADA"
                  value={durationValue}
                  readOnly
                  helper="Calculada automáticamente"
                  error={validationAttempted ? getError("generalInfo.duracion") : undefined}
                />
              </div>
            </SectionGroup>
            <SectionGroup title="Detalles del trabajo" description="Describe la actividad y las herramientas necesarias.">
              <div className="space-y-4">
                <Field
                  label="DESCRIPCIÓN DE LA ACTIVIDAD A REALIZAR"
                  value={generalInfo.descripcion}
                  as="textarea"
                  placeholder="Ej. Mantenimiento de tolvas y silos"
                  full
                  error={validationAttempted ? getError("generalInfo.descripcion") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, descripcion: value }))}
                />
                <Field
                  label="HERRAMIENTAS A UTILIZAR DURANTE LA TAREA"
                  value={generalInfo.herramientas}
                  as="textarea"
                  placeholder="Ej. Herramientas manuales, eléctricas, etc."
                  full
                  error={validationAttempted ? getError("generalInfo.herramientas") : undefined}
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, herramientas: value }))}
                  helper="Puedes separar elementos con comas."
                />
              </div>
            </SectionGroup>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <SectionGroup
              title="CUADRO DE RESPONSABLES QUE REALIZARÁN LA ACTIVIDAD EN ESPACIOS CONFINADOS (MARQUE SÍ O NO SEGÚN CORRESPONDA)"
              description=""
            >
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label="NÚMERO DE IDENTIFICACIÓN"
                  value={workerForm.identificacion}
                  placeholder="Ej. 1073241989"
                  error={validationAttempted ? getError("workerForm.identificacion") : undefined}
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, identificacion: value }))}
                />
                <Field
                  label="NOMBRE COMPLETO"
                  value={workerForm.nombre}
                  placeholder="Ej. Juan David Beltran Rodriguez"
                  error={validationAttempted ? getError("workerForm.nombre") : undefined}
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, nombre: value }))}
                />
                <Field
                  label="CARGO"
                  value={workerForm.cargo}
                  placeholder="Ej. Operador planta de asfalto I"
                  error={validationAttempted ? getError("workerForm.cargo") : undefined}
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, cargo: value }))}
                />
                <Field
                  label="¿SE ENCUENTRA EN BUEN ESTADO DE SALUD PARA REALIZAR LA ACTIVIDAD?"
                  value={workerForm.salud}
                  as="select"
                  options={["Seleccione una opcion", "Sí", "No"]}
                  error={validationAttempted ? getError("workerForm.salud") : undefined}
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, salud: value as SaludValue }))}
                />
                {workerForm.salud === "No" ? (
                  <Field
                    label="¿Qué dificultad presenta?"
                    value={workerForm.dificultad}
                    placeholder="Describe brevemente la condición o dificultad"
                    full
                    error={validationAttempted ? getError("workerForm.dificultad") : undefined}
                    onChange={(value) => setWorkerForm((prev) => ({ ...prev, dificultad: value }))}
                  />
                ) : null}
                <div className="field-shell field-shell--full">
                  <div className={`signature-status ${workerSignature ? "signature-status--success" : ""}`}>
                    {workerSignature ? "✓ Firma registrada" : "⏳ Pendiente"}
                  </div>
                  <canvas
                    ref={workerCanvasRef}
                    className="signature-canvas signature-canvas--dashed"
                    onPointerDown={startWorkerDrawing}
                    onPointerMove={drawWorkerSignature}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                  />
                  {workerSignatureError ? <p className="field-helper field-helper--error">{workerSignatureError}</p> : null}
                </div>
              </div>

              <div className="worker-actions">
                <div className="worker-actions__row">
                  <button type="button" onClick={clearWorkerSignature} className="btn btn-secondary btn-sm">
                    Limpiar
                  </button>
                </div>
                <div className="worker-actions__row worker-actions__row--full">
                  <button type="button" onClick={addWorkerEntry} className="btn btn-primary btn-sm btn-primary--accent">
                    AGREGAR TRABAJADOR
                  </button>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                {extraWorkers.map((worker, index) => (
                  <div className="soft-card compact-card" key={worker.id}>
                    <div className="declaration-card__head worker-extra__head">
                      <h3 className="declaration-card__title">TRABAJADOR {index + 2}</h3>
                      <button
                        type="button"
                        className="worker-extra__remove"
                        onClick={() => removeWorkerEntry(worker.id)}
                      >
                        ✕ Eliminar
                      </button>
                    </div>
                    <div className="grid gap-6">
                      <Field
                        label="N° de identificación"
                        value={worker.identificacion}
                        placeholder="Solo números"
                        error={validationAttempted ? getError(`extraWorkers.${index}.identificacion`) : undefined}
                        onChange={(value) => updateWorkerEntry(worker.id, "identificacion", value)}
                      />
                      <Field
                        label="¿Se encuentra en buen estado de salud para realizar la actividad?"
                        value={worker.salud}
                        as="select"
                        options={["Seleccione una opcion", "Sí", "No"]}
                        error={validationAttempted ? getError(`extraWorkers.${index}.salud`) : undefined}
                        onChange={(value) => updateWorkerEntry(worker.id, "salud", value)}
                      />
                      {worker.salud === "No" ? (
                        <Field
                          label="¿Qué dificultad presenta?"
                          value={worker.dificultad}
                          placeholder="Describe brevemente la condición o dificultad"
                          error={validationAttempted ? getError(`extraWorkers.${index}.dificultad`) : undefined}
                          onChange={(value) => updateWorkerEntry(worker.id, "dificultad", value)}
                        />
                      ) : null}
                      <div className="signature-slot">
                        <div className="mini-title">Firma del trabajador</div>
                        <div className={`signature-status ${worker.signature ? "signature-status--success" : ""}`}>
                          {worker.signature ? "✓ Firma registrada" : "⏳ Pendiente"}
                        </div>
                        <SignaturePad
                          value={worker.signature}
                          error={validationAttempted ? getError(`extraWorkers.${index}.signature`) : undefined}
                          onChange={(value) => updateWorkerEntry(worker.id, "signature", value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionGroup>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="mini-block mini-block--header">
              <div className="mini-title mini-title--bar">
                RELACIONE LOS EPP A UTILIZAR Y EL EQUIPO DE RESCATE DISPONIBLE
              </div>
            </div>

            <div className="mini-block">
              <div className="flex justify-center">
                <Image
                  src="/EPP.png"
                  alt="Equipos de Protección Personal"
                  width={1200}
                  height={700}
                  className="max-h-72 w-full max-w-3xl rounded-2xl object-contain"
                />
              </div>
            </div>

              <Field
                label="EQUIPOS DE PROTECCIÓN PERSONAL"
                value={generalInfo.epp}
                as="textarea"
                placeholder="Describe los equipos de protección personal a utilizar"
                full
                error={validationAttempted ? getError("generalInfo.epp") : undefined}
                onChange={(value) => setGeneralInfo((prev) => ({ ...prev, epp: value }))}
              />

            <div className="mini-block">
              <div className="flex justify-center">
                <Image
                  src="/kit-de-rescate.png"
                  alt="Equipos de rescate"
                  width={1200}
                  height={700}
                  className="max-h-72 w-full max-w-3xl rounded-2xl object-contain"
                />
              </div>
            </div>

              <Field
                label="EQUIPOS DE RESCATE"
                value={generalInfo.rescate}
                as="textarea"
                placeholder="Describe los equipos de rescate disponibles"
                full
                error={validationAttempted ? getError("generalInfo.rescate") : undefined}
                onChange={(value) => setGeneralInfo((prev) => ({ ...prev, rescate: value }))}
              />

              <Field
                label="OTROS"
                value={generalInfo.otros}
                as="textarea"
                placeholder="Información adicional"
                full
                error={validationAttempted ? getError("generalInfo.otros") : undefined}
                onChange={(value) => setGeneralInfo((prev) => ({ ...prev, otros: value }))}
              />
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <section className="declaration-card">
              <div className="declaration-card__head">
                <span className="declaration-card__icon">⚠</span>
                <h3 className="declaration-card__title">TÉRMINO DE RESPONSABILIDADES Y AUTORIZACIÓN PARA EJECUCIÓN DE TRABAJOS</h3>
              </div>
              <div className="declaration-card__body">
                <p className="declaration-card__lead">DECLARO</p>
                <p className="declaration-card__text">
                  Que soy(mos) conscientes de la responsabilidad y después de tener evaluados los peligros inherentes al
                  trabajo a ser realizado autorizo su ejecución siempre seguido de las precauciones y definiciones
                  acordadas en conjunto con el trabajador(es) que ejecutan la tarea.
                </p>
                <p className="declaration-card__foot">
                  (Constato que he verificado que todas las recomendaciones de seguridad aquí contempladas cumplen con los
                  requisitos establecidos).
                </p>
              </div>
            </section>

            <div className="space-y-6">
              <div className="mini-block">
                <div className="mini-title">
                  DECLARO QUE HE REVISADO EL ÁREA Y CERTIFICO QUE SE HAN TOMADO LAS PRECAUCIONES INDICADAS PARA DAR
                  INICIO AL TRABAJO
                </div>
              </div>
              <label className="declaration-check">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                />
                <span>Acepto y entiendo la declaración de responsabilidad</span>
              </label>
              {validationAttempted && fieldErrors.declarationAccepted ? (
                <p className="field-helper field-helper--error">{fieldErrors.declarationAccepted}</p>
              ) : null}

              <div className="grid gap-6">
                <div className="soft-card compact-card">
                  <Field
                    label="CÉDULA DEL PERSONAL HSE"
                    value={generalInfo.personal}
                    placeholder="Ej. 321233"
                    error={validationAttempted ? getError("generalInfo.personal") : undefined}
                    onChange={(value) => setGeneralInfo((prev) => ({ ...prev, personal: value }))}
                  />
                </div>

                <div className="soft-card compact-card">
                  <Field
                    label="NOMBRE DEL PERSONAL HSE QUE REVISA Y CERTIFICA ESTE PERMISO"
                    value={generalInfo.personalhse}
                    placeholder="Ej. Pepito Pérez"
                    error={validationAttempted ? getError("generalInfo.personalhse") : undefined}
                    onChange={(value) => setGeneralInfo((prev) => ({ ...prev, personalhse: value }))}
                  />
                  <div className="signature-slot">
                    <div className="mini-title">FIRMA</div>
                    <SignaturePad
                      value={hseSignature}
                      error={validationAttempted ? getError("signatures.hse") : undefined}
                      onChange={setHseSignature}
                    />
                  </div>
                </div>
              </div>

              <div className="mini-block">
                <div className="mini-title">
                  DECLARO QUE ACATAREMOS LAS NORMAS, PROCEDIMIENTOS Y RECOMENDACIONES MENCIONADOS POR EL PERSONAL HSE,
                  PARA EL SEGURO DESARROLLO DE LA LABOR
                </div>
              </div>

              <div className="grid gap-6">
                <div className="soft-card compact-card">
                  <Field
                    label="CÉDULA DE CIUDADANÍA DEL RESPONSABLE DE LA EJECUCIÓN DEL TRABAJO"
                    value={generalInfo.ciudadania}
                    placeholder="Ej. 32323"
                    error={validationAttempted ? getError("generalInfo.ciudadania") : undefined}
                    onChange={(value) => setGeneralInfo((prev) => ({ ...prev, ciudadania: value }))}
                  />
                </div>

                <div className="soft-card compact-card">
                  <Field
                    label="NOMBRE RESPONSABLE EJECUCIÓN DEL TRABAJO"
                    value={generalInfo.trabajador}
                    placeholder="Ej. Pepito Pérez"
                    error={validationAttempted ? getError("generalInfo.trabajador") : undefined}
                    onChange={(value) => setGeneralInfo((prev) => ({ ...prev, trabajador: value }))}
                  />
                  <div className="signature-slot">
                    <div className="mini-title">FIRMA</div>
                    <SignaturePad
                      value={leaderSignature}
                      error={validationAttempted ? getError("signatures.responsable") : undefined}
                      onChange={setLeaderSignature}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  // Renderizar la estructura principal de la página, incluyendo el encabezado del documento, la sección actual del formulario, los botones de navegación y el botón de scroll al inicio
  return (
    <main className="page-shell">
      <div className="page-frame">
        <section className="doc-top">
          <div className="doc-header-table">
            <div className="doc-header-logo">
              <div className="doc-logo-text">ROCA</div>
            </div>
            <div className="doc-header-center">
              <div className="doc-header-title-top">GESTION HSE</div>
              <div className="doc-header-title-main">PERMISO PARA TRABAJOS EN ESPACIOS CONFINADOS</div>
            </div>
            <div className="doc-header-meta">
              <div><strong>Codigo:</strong> HSE-F001</div>
              <div><strong>Fecha:</strong> 2026-03-26</div>
              <div><strong>Version:</strong> 08</div>
            </div>
          </div>
        </section>
        <section className="section-card">
          <div className="border-b border-slate-300 bg-slate-50 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-slate-700">{currentSection.title}</h3>
              <span className="text-xl text-slate-600">
                Paso {activeStep} de {totalSteps}
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 shadow-sm">
              <div
                className="h-full bg-linear-to-r from-cyan-400 to-green-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div ref={sectionContentRef} className="section-card__body">
            {renderSection(activeStep)}
          </div>
          <div className="flex gap-4 border-t border-slate-200 pt-6">
            <br /> <br />
            <button
              type="button"
              onClick={prevStep}
              disabled={activeStep === 1}
              className="rounded-lg border border-slate-300 bg-white px-8 py-4 text-2xl text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            {activeStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-blue-600 px-8 py-4 text-2xl text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={!isFormValid}
                className="rounded-lg bg-blue-600 px-8 py-4 text-2xl text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar formulario
              </button>
            )}
          </div>
        </section>
      </div>
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Subir al inicio"
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-300 hover:bg-slate-700 hover:scale-105 ${
          showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <path
            d="M12 19V5m0 0 6 6m-6-6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </main>
  );
}

// Componente reutilizable para campos de formulario, que puede renderizarse como input, textarea o select dependiendo de las props, y que muestra una etiqueta, el valor actual, un placeholder, un texto de ayuda y estilos condicionales según las props recibidas
function Field({
  label,
  value,
  full = false,
  center = false,
  type = "text",
  as = "input",
  placeholder,
  helper,
  readOnly = false,
  options,
  error,
  onChange,
}: {
  label: string;
  value: string;
  full?: boolean;
  center?: boolean;
  type?: "text" | "date" | "time" | "number";
  as?: "input" | "textarea" | "select";
  placeholder?: string;
  helper?: string;
  readOnly?: boolean;
  options?: string[];
  error?: string;
  onChange?: (value: string) => void;
}) 

{
  return (
    <div className={`field-shell ${full ? "field-shell--full" : ""}`}>
      <div className="field-shell__label">{label}</div>
      {as === "textarea" ? (
        <textarea
          aria-invalid={Boolean(error)}
          className={`field-shell__value field-shell__input field-shell__textarea ${
            error ? "field-shell__input--error" : ""
          }`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      ) : as === "select" ? (
        <select
          aria-invalid={Boolean(error)}
          className={`field-shell__value field-shell__input ${error ? "field-shell__input--error" : ""}`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {(options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : onChange ? (
        <input
          aria-invalid={Boolean(error)}
          className={`field-shell__value field-shell__input ${center ? "field-shell__value--center" : ""} ${
            error ? "field-shell__input--error" : ""
          }`}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
        />
      ) : (
        <div className={`field-shell__value ${center ? "field-shell__value--center" : ""}`}>{value}</div>
      )}
      {helper ? <p className="field-helper">{helper}</p> : null}
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
    </div>
  );
}

// Componente para agrupar secciones del formulario, mostrando un título, una descripción y el contenido de las secciones agrupadas, con estilos específicos para la estructura del grupo
function SectionGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-group">
      <div className="section-group__head">
        <h3 className="section-group__title">{title}</h3>
        <p className="section-group__description">{description}</p>
      </div>
      {children}
    </div>
  );
}

// Resumir una firma para la consola sin mostrar el base64 completo
function summarizeSignatureLink(label: string, signature: string) {
  return {
    registrado: Boolean(signature),
    enlace: signature ? `firma://${label}` : "",
  };
}

// Componente para manejar la captura de firmas en un canvas, permitiendo al usuario dibujar su firma con el mouse o el dedo, guardar la firma como una imagen en base64 y mostrar un botón para limpiar la firma, con estilos específicos para el canvas y el botón
function SignaturePad({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  // Función para obtener el contexto 2D del canvas, devolviendo null si el canvas no está disponible o si no se puede obtener el contexto
  const getContext = useCallback(() => canvasRef.current?.getContext("2d") ?? null, []);

  // Función para dibujar una firma guardada en el canvas, tomando la imagen en base64 como argumento, creando un objeto Image, cargando la imagen y dibujándola en el canvas, o limpiando el canvas si no se proporciona una imagen válida
  const drawSavedSignature = useCallback(
    (dataUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !dataUrl) return;

      const ctx = getContext();
      if (!ctx) return;

      const image = new window.Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = dataUrl;
    },
    [getContext]
  );

  // Función para redimensionar el canvas, ajustando su tamaño al contenedor padre, configurando el contexto para dibujar líneas suaves y limpias, y redibujando la firma guardada si existe, asegurando que el canvas se vea bien en diferentes tamaños de pantalla
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = 170;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Configurar el contexto para dibujar líneas suaves y limpias, y limpiar el canvas antes de redibujar la firma guardada si existe
    const ctx = getContext();
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (value) {
      drawSavedSignature(value);
    }
  }, [drawSavedSignature, getContext, value]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Función para manejar el inicio del dibujo de la firma, activando el modo de dibujo, capturando el puntero y comenzando un nuevo trazo en el canvas, ajustando las coordenadas para tener en cuenta la posición del canvas en la página
  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    isDrawingRef.current = true;
    hasStrokeRef.current = false;
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  };

  // Función para manejar el dibujo de la firma mientras el usuario mueve el puntero, dibujando líneas en el canvas si el modo de dibujo está activo, ajustando las coordenadas para tener en cuenta la posición del canvas en la página y marcando que se ha dibujado algo en el canvas
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    // Ajustar las coordenadas del puntero para tener en cuenta la posición del canvas en la página
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    hasStrokeRef.current = true;
  };

  // Función para manejar el fin del dibujo de la firma, desactivando el modo de dibujo, liberando el puntero y guardando la firma como una imagen en base64 si se ha dibujado algo en el canvas
  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = false;
    if (hasStrokeRef.current) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  // Función para limpiar la firma del canvas, borrando todo el contenido del canvas, reseteando los estados de dibujo y firma, y notificando al componente padre que la firma ha sido eliminada
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokeRef.current = false;
    isDrawingRef.current = false;
    onChange("");
  };

  // Renderizar el componente de la firma, incluyendo el canvas para dibujar la firma y un botón para limpiar la firma
  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        aria-invalid={Boolean(error)}
        className={`signature-canvas signature-canvas--dashed ${error ? "field-shell__input--error" : ""}`}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
      <button type="button" className="signature-clear-button" onClick={clearSignature}>
        Limpiar firma
      </button>
    </div>
  );
}
