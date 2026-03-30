"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const sections = [
  { step: 1, title: "Información general" },
  { step: 2, title: "Trabajadores responsables" },
  { step: 3, title: "Verificación diaria" },
  { step: 4, title: "Información adicional" },
  { step: 5, title: "Término de responsabilidades" },
  { step: 6, title: "Monitoreo" },
  { step: 7, title: "Equipos y autorización" },
  { step: 8, title: "Aprobación final" },
] as const;

type StepNumber = (typeof sections)[number]["step"];

function calcularDuracion(inicio: string, fin: string) {
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

const monitoringItems = [
  "Oxígeno (19.5 a 23.5 %)",
  "CO (< 25 PPM)",
  "SO2 (< 2 PPM)",
  "H2S (< 10 PPM)",
  "Inflamabilidad (< 5 % del LII)",
  "Temperatura (17 a 23 °C WGBT)",
];

export default function Home() {
  const [activeStep, setActiveStep] = useState<StepNumber>(1);
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
  });
  const [workerForm, setWorkerForm] = useState({
    identificacion: "",
    nombre: "",
    cargo: "",
    salud: "Seleccione una opcion",
  });
  const [workerSignature, setWorkerSignature] = useState("");
  const [workerSignatureError, setWorkerSignatureError] = useState("");
  const workerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerIsDrawingRef = useRef(false);
  const workerHasStrokeRef = useRef(false);
  const totalSteps = 8;
  const progress = (activeStep / totalSteps) * 100;
  const currentSection = sections.find((section) => section.step === activeStep) ?? sections[0];
  const durationValue = calcularDuracion(generalInfo.horaInicio, generalInfo.horaFin) || generalInfo.duracion;

  const getCanvasContext = useCallback(() => workerCanvasRef.current?.getContext("2d") ?? null, []);

  const restoreSignature = useCallback(
    (firmaBase64: string) => {
      const canvas = workerCanvasRef.current;
      if (!canvas || !firmaBase64) return;

      const ctx = getCanvasContext();
      if (!ctx) return;

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

  const resizeWorkerCanvas = useCallback(() => {
    const canvas = workerCanvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = 280;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";

    if (workerSignature) {
      restoreSignature(workerSignature);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [getCanvasContext, restoreSignature, workerSignature]);

  useEffect(() => {
    resizeWorkerCanvas();
    window.addEventListener("resize", resizeWorkerCanvas);
    return () => window.removeEventListener("resize", resizeWorkerCanvas);
  }, [resizeWorkerCanvas]);

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

  const drawWorkerSignature = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!workerIsDrawingRef.current) return;
    const canvas = workerCanvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    workerHasStrokeRef.current = true;
  };

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

  const clearWorkerSignature = () => {
    const canvas = workerCanvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setWorkerSignature("");
    setWorkerSignatureError("");
    workerHasStrokeRef.current = false;
  };

  const nextStep = () => {
    if (activeStep < totalSteps) {
      setActiveStep((value) => (value + 1) as StepNumber);
    }
  };
  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep((value) => (value - 1) as StepNumber);
    }
  };
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
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, lugar: value }))}
                />
                <Field
                  label="FECHA"
                  value={generalInfo.fecha}
                  type="date"
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
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, responsable: value }))}
                />
                <Field
                  label="ÁREA"
                  value={generalInfo.area}
                  as="select"
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, area: value }))}
                  options={["Producción", "Mantenimiento", "Operaciones", "Calidad", "Otro"]}
                  helper="Selecciona el área más cercana al trabajo."
                />
                <Field
                  label="CENTRO DE OPERACIÓN"
                  value={generalInfo.centroOperacion}
                  placeholder="Ej. Ammann"
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, centroOperacion: value }))}
                />
                <Field
                  label="TIEMPO SOLICITADO"
                  value={generalInfo.tiempoSolicitado}
                  type="number"
                  placeholder="Ej. 96"
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
                  onChange={(value) => setGeneralInfo((prev) => ({ ...prev, descripcion: value }))}
                />
                <Field
                  label="HERRAMIENTAS A UTILIZAR DURANTE LA TAREA"
                  value={generalInfo.herramientas}
                  as="textarea"
                  placeholder="Ej. Herramientas manuales, eléctricas, etc."
                  full
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
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, identificacion: value }))}
                />
                <Field
                  label="NOMBRE COMPLETO"
                  value={workerForm.nombre}
                  placeholder="Ej. Juan David Beltran Rodriguez"
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, nombre: value }))}
                />
                <Field
                  label="CARGO"
                  value={workerForm.cargo}
                  placeholder="Ej. Operador planta de asfalto I"
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, cargo: value }))}
                />
                <Field
                  label="¿SE ENCUENTRA EN BUEN ESTADO DE SALUD PARA REALIZAR LA ACTIVIDAD?"
                  value={workerForm.salud}
                  as="select"
                  options={["Seleccione una opcion", "Sí", "No"]}
                  onChange={(value) => setWorkerForm((prev) => ({ ...prev, salud: value }))}
                />
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
                  <button type="button" className="btn btn-primary btn-sm btn-primary--accent">
                    AGREGAR TRABAJADOR
                  </button>
                </div>
              </div>
            </SectionGroup>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
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
              onChange={(value) => setGeneralInfo((prev) => ({ ...prev, rescate: value }))}
            />

            <Field
              label="OTROS"
              value={generalInfo.otros}
              as="textarea"
              placeholder="Información adicional"
              full
              onChange={(value) => setGeneralInfo((prev) => ({ ...prev, otros: value }))}
            />
          </div>
        );
      case 4:
        return (
          <div className="two-col">
            {[
              ["SUPERVISOR ESPACIOS CONFINADOS", "Johnatan Umaña"],
              ["VIGÍA RESPONSABLE DE LA ACTIVIDAD", "Julio muñoz"],
              ["TRABAJADOR ENTRANTE ESPACIO CONFINADO", "N/A"],
              ["JEFE DEL ÁREA / LÍDER DE PROCESO", "Jorge Cuervo"],
            ].map(([title, value]) => (
              <div className="soft-card compact-card" key={title}>
                <h3 className="mini-title">{title}</h3>
                <div className="mini-value">{value}</div>
              </div>
            ))}
            {["FIRMA SUPERVISOR", "FIRMA VIGÍA", "FIRMA TRABAJADOR", "FIRMA JEFE"].map((title) => (
              <div className="soft-card signature-card" key={title}>
                <h3 className="mini-title">{title}</h3>
                <div className="signature-box signature-box--large">
                  <span className="signature-mark" />
                </div>
              </div>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="legal-block">
            <p className="legal-text">
              &quot;Declaro que soy (somos) consciente(s) de la responsabilidad y, después de haber evaluado los peligros
              inherentes al trabajo a realizar, autorizo su ejecución, siempre que se sigan las precauciones y
              definiciones acordadas en conjunto con el (los) trabajador(es) que ejecuta(n) la tarea. Constato que he
              verificado que todas las recomendaciones de seguridad aquí contempladas cumplen con los requisitos
              establecidos.&quot;
            </p>
            <div className="auth-grid">
              <div className="auth-card">
                <p>YO, JOHNATAN JAVIER UMAÑA HE REVISADO EL ÁREA Y CERTIFICO QUE SE HAN TOMADO LAS PRECAUCIONES INDICADAS PARA DAR INICIO AL TRABAJO</p>
                <div className="auth-signature">
                  <span>JOHNATAN JAVIER UMAÑA - C.C. 1070324673</span>
                  <div className="signature-box signature-box--auth">
                    <span className="signature-mark" />
                  </div>
                </div>
              </div>
              <div className="auth-card">
                <p>ACATAREMOS LAS NORMAS, PROCEDIMIENTOS Y RECOMENDACIONES MENCIONADOS POR EL PERSONAL HSE, PARA EL SEGURO DESARROLLO DE LA LABOR</p>
                <div className="auth-signature">
                  <span>JORGE IVAN CUERVO CAMARGO - C.C. 1101177475</span>
                  <div className="signature-box signature-box--auth">
                    <span className="signature-mark" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="monitor-list">
            {monitoringItems.map((item) => (
              <div className="monitor-row" key={item}>
                <div className="monitor-name">{item}</div>
                <div className="monitor-result">RESULTADO: N/A TOMADO EL: N/A</div>
                <div className="check-pill check-pill--na">N/A</div>
              </div>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="info-stack">
            <div className="mini-block">
              <h3 className="mini-title">EQUIPO DE MEDICIÓN</h3>
              <div className="mini-value">N/A</div>
            </div>
            <div className="mini-block">
              <h3 className="mini-title">FIRMA MONITOR</h3>
              <div className="signature-box signature-box--wide">
                <span className="signature-mark" />
              </div>
            </div>
            <div className="two-col two-col--fields">
              <div className="mini-block">
                <h3 className="mini-title">EQUIPOS DE PROTECCIÓN PERSONAL</h3>
                <div className="field-outline" />
              </div>
              <div className="mini-block">
                <h3 className="mini-title">EQUIPOS DE RESCATE</h3>
                <div className="field-outline field-outline--filled">Cuerdas</div>
              </div>
            </div>
            <div className="mini-block">
              <h3 className="mini-title">OTROS</h3>
              <div className="field-outline field-outline--tall" />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="approval-area">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th>Aprobado</th>
                  <th>Observacion</th>
                  <th>Firma</th>
                  <th>Adjunto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>JOHNATAN UMAÑA<br />PROFESIONAL SISOMA</td>
                  <td>2026-02-09<br />06:14</td>
                  <td>Si</td>
                  <td />
                  <td>
                    <div className="approval-signature" />
                  </td>
                  <td>No se adjuntó archivo</td>
                </tr>
              </tbody>
            </table>
            <div className="qr-wrap">
              <div className="qr-box" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };
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
          <div className="section-card__body">{renderSection(activeStep)}</div>
          <div className="flex gap-4 border-t border-slate-200 pt-6">
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
              <button type="button" className="rounded-lg bg-blue-600 px-8 py-4 text-2xl text-white shadow-sm transition-colors hover:bg-blue-700">
                Enviar formulario
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

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
  onChange?: (value: string) => void;
}) 

{
  return (
    <div className={`field-shell ${full ? "field-shell--full" : ""}`}>
      <div className="field-shell__label">{label}</div>
      {as === "textarea" ? (
        <textarea
          className="field-shell__value field-shell__input field-shell__textarea"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      ) : as === "select" ? (
        <select
          className="field-shell__value field-shell__input"
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
          className={`field-shell__value field-shell__input ${center ? "field-shell__value--center" : ""}`}
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
    </div>
  );
}

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
