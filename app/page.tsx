"use client";

/**
 * Página principal del formulario HSE F001
 * Esta página implementa un formulario multi-paso para permisos de trabajo seguro,
 * utilizando React Hook Form con validación Zod para asegurar la integridad de los datos.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFieldArray, useForm, useWatch, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { esquemaFormulario, type ValorSalud } from "./hse-f001.schema";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  compactarObjeto,
  compactarObjetoSeleccion,
  calcularDuracion,
  valoresDefecto,
  obtenerCamposPorPaso,
  definicionesMonitoreo,
  gruposMedidasSeguridad,
  sections,
  resumirEnlaceFirma,
  type ValoresFormulario,
  type NumeroPaso,
} from "./utilidades-formulario";
import { TarjetaRolAprobacion, TarjetaTrabajadorExtra, CampoSimple, GrupoSecciones, CampoSeleccion, CampoFirma, CampoArea, obtenerErrorPorRuta } from "./componentes-formulario";
import { SeccionMonitoreoAmbiental } from "./seccion-monitoreo-ambiental";

function SafetyMeasureRow({
  name,
  label,
  register,
}: {
  name: string;
  label: string;
  register: UseFormRegister<ValoresFormulario>;
}) {
  const opciones = [
    { value: "NA", label: "NA" },
    { value: "SI", label: "SI" },
    { value: "NO", label: "NO" },
  ] as const;

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(72px,auto))] md:items-center">
      <div className="text-sm font-medium leading-6 text-slate-700">{label}</div>
      {opciones.map((opcion) => (
        <label
          key={opcion.value}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
        >
          <input type="radio" value={opcion.value} {...register(name as never)} className="h-4 w-4 accent-sky-600" />
          <span>{opcion.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Componente principal de la página del formulario HSE F001
 * Gestiona el estado del formulario multi-paso, validación y navegación entre secciones
 */
export default function Home() {
  // Estados para controlar el paso activo, scroll y validación
  const [activeStep, setActiveStep] = useState<NumeroPaso>(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Referencia para el contenido de la sección actual
  const sectionContentRef = useRef<HTMLDivElement | null>(null);

  // Configuración del formulario con React Hook Form y validación Zod
  const {
    register,
    control,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: valoresDefecto,
    mode: "onTouched",
  });

  // Campo de array para trabajadores extra
  const { fields: extraWorkerFields, append, remove } = useFieldArray({
    control,
    name: "extraWorkers",
  });

  const generalInfo = useWatch({ control, name: "generalInfo" }) ?? valoresDefecto.generalInfo;
  const workerForm = useWatch({ control, name: "workerForm" }) ?? valoresDefecto.workerForm;
  const workerObservacion = useWatch({ control, name: "workerForm.observacion" as const }) ?? "";
  const declarationAccepted = useWatch({ control, name: "declarationAccepted" }) ?? false;
  const workerSignature = useWatch({ control, name: "signatures.trabajador" }) ?? "";
  const hseSignature = useWatch({ control, name: "signatures.hse" }) ?? "";
  const responsibleSignature = useWatch({ control, name: "signatures.responsable" }) ?? "";

  const durationValue = useMemo(
    () => calcularDuracion(generalInfo.horaInicio, generalInfo.horaFin) || generalInfo.duracion,
    [generalInfo.duracion, generalInfo.horaFin, generalInfo.horaInicio]
  );

  useEffect(() => {
    setValue("generalInfo.duracion", durationValue, { shouldValidate: validationAttempted });
  }, [durationValue, setValue, validationAttempted]);

  useEffect(() => {
    if (workerForm.salud === "No") {
      setValue("signatures.trabajador", "", { shouldValidate: false });
    }
  }, [setValue, workerForm.salud]);

  useEffect(() => {
    if (!sectionContentRef.current) return;
    window.requestAnimationFrame(() => {
      sectionContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeStep]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /**
   * Avanza al siguiente paso del formulario, validando los campos del paso actual
   */
  const nextStep = async () => {
    setValidationAttempted(true);
    const values = getValues();
    const fields = obtenerCamposPorPaso(activeStep, values);
    if (fields.length > 0) {
      const ok = await trigger(fields as never, { shouldFocus: true });
      if (!ok) return;
    }
    setActiveStep((value) => (Math.min(value + 1, sections.length) as NumeroPaso));
  };

  /**
   * Retrocede al paso anterior del formulario
   */
  const prevStep = () => setActiveStep((value) => (Math.max(value - 1, 1) as NumeroPaso));

  const setWorkerObservation = (value: string) => {
    setValue("workerForm.observacion" as never, value as never, { shouldValidate: validationAttempted });
  };

  const onSubmit = handleSubmit(() => {
    const values = getValues();
    const consolePayload = {
      generalInfo: compactarObjeto({
        lugar: values.generalInfo.lugar,
        fecha: values.generalInfo.fecha,
        area: values.generalInfo.area,
        responsable: values.generalInfo.responsable,
        centroOperacion: values.generalInfo.centroOperacion,
        tiempoSolicitado: values.generalInfo.tiempoSolicitado,
        horaInicio: values.generalInfo.horaInicio,
        horaFin: values.generalInfo.horaFin,
        duracion: durationValue,
        descripcion: values.generalInfo.descripcion,
        herramientas: values.generalInfo.herramientas,
        epp: values.generalInfo.epp,
        rescate: values.generalInfo.rescate,
        otros: values.generalInfo.otros,
        personal: values.generalInfo.personal,
        personalhse: values.generalInfo.personalhse,
        ciudadania: values.generalInfo.ciudadania,
        trabajador: values.generalInfo.trabajador,
      }),
      workerForm: compactarObjeto({
        identificacion: values.workerForm.identificacion,
        nombre: values.workerForm.nombre,
        cargo: values.workerForm.cargo,
        salud: values.workerForm.salud,
        observacion: values.workerForm.observacion,
      }),
      extraWorkers: values.extraWorkers.map((worker) =>
        compactarObjeto({
          id: worker.id,
          identificacion: worker.identificacion,
          nombre: worker.nombre,
          cargo: worker.cargo,
          salud: worker.salud,
          observacion: worker.observacion,
          signature: resumirEnlaceFirma(`extra-${worker.id}`, worker.signature),
        })
      ),
      safetyChecks: compactarObjetoSeleccion(values.safetyChecks as Record<string, string>),
      monitoring: compactarObjeto({
        rows: values.monitoring.rows.map((row, rowIndex) =>
          compactarObjeto({
            gas: definicionesMonitoreo[rowIndex]?.label ?? `Fila ${rowIndex + 1}`,
            condiciones: definicionesMonitoreo[rowIndex]?.helper ?? "",
            takes: row.takes.map((take, takeIndex) =>
              compactarObjeto({
                fecha: take.fecha,
                hora: take.hora,
                resultado: take.resultado,
                signature: resumirEnlaceFirma(`monitoring-${rowIndex + 1}-${takeIndex + 1}`, take.signature),
              })
            ),
          })
        ),
        equipoMedicion: values.monitoring.equipoMedicion,
      }),
      approvalPeople: values.approvalPeople.map((person) =>
        compactarObjeto({
          role: person.role,
          nombre: person.nombre,
          identificacion: person.identificacion,
          signature: resumirEnlaceFirma(person.role, person.signature),
        })
      ),
      signatures: compactarObjeto({
        trabajador: resumirEnlaceFirma("trabajador", values.signatures.trabajador),
        hse: resumirEnlaceFirma("hse", values.signatures.hse),
        responsable: resumirEnlaceFirma("responsable", values.signatures.responsable),
      }),
      observaciones: compactarObjeto({
        observaciones: values.observaciones,
        cierreCancelacion: values.cierreCancelacion,
      }),
      declarationAccepted: values.declarationAccepted,
    };
    console.log("Formulario enviado");
    console.log(JSON.stringify(consolePayload, null, 2));
    window.alert("Formulario enviado correctamente");
  });

  const addWorkerEntry = () => {
    const nextId = extraWorkerFields.length + 2;
    append({
      id: nextId,
      identificacion: "",
      nombre: "",
      cargo: "",
      salud: "Seleccione una opción" as ValorSalud,
      observacion: "",
      signature: "",
    });
  };

  const stepTitle = sections.find((section) => section.step === activeStep)?.title ?? sections[0].title;
  const progress = (activeStep / sections.length) * 100;
  const currentStepFields = obtenerCamposPorPaso(activeStep, getValues());
  const hasCurrentErrors = currentStepFields.some((path) => Boolean(obtenerErrorPorRuta(errors, path)));

  return (
    // Estructura principal de la página con header, formulario y navegación
    <main className="page-shell">
      <div className="page-frame">
        {/* Header del documento con logo y metadatos */}
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
              <div>
                <strong>Codigo:</strong> HSE-F001
              </div>
              <div>
                <strong>Fecha:</strong> 2026-03-26
              </div>
              <div>
                <strong>Version:</strong> 08
              </div>
            </div>
          </div>
        </section>

        {/* Formulario principal con navegación por pasos */}
        <form className="section-card" onSubmit={onSubmit}>
          <div className="border-b border-slate-300 bg-slate-50 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-slate-700">{stepTitle}</h3>
              <span className="text-xl text-slate-600">
                Paso {activeStep} de {sections.length}
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
            {activeStep === 1 ? (
              <div className="space-y-6">
                <GrupoSecciones title="LUGAR Y FECHA" description="Completa la ubicación principal del trabajo y su fecha de emisión.">
                  <div className="info-grid info-grid--two">
                    <CampoSimple label="LUGAR" error={obtenerErrorPorRuta(errors, "generalInfo.lugar")?.message} {...register("generalInfo.lugar")} placeholder="Ej. Mosquera" />
                    <CampoSimple label="FECHA" type="date" error={obtenerErrorPorRuta(errors, "generalInfo.fecha")?.message} {...register("generalInfo.fecha")} />
                  </div>
                </GrupoSecciones>

                <GrupoSecciones title="ÁREA Y PERMISO" description="Identifica a quién se concede el permiso y dónde se ejecutará.">
                  <div className="info-grid info-grid--two">
                    <CampoSeleccion label="ÁREA" error={obtenerErrorPorRuta(errors, "generalInfo.area")?.message} {...register("generalInfo.area")}>
                      <option value="">Selecciona una opción</option>
                      <option value="Producción">Producción</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Operaciones">Operaciones</option>
                      <option value="Calidad">Calidad</option>
                      <option value="Otro">Otro</option>
                    </CampoSeleccion>
                    <CampoSimple label="SE CONCEDE EL PERMISO A" error={obtenerErrorPorRuta(errors, "generalInfo.responsable")?.message} {...register("generalInfo.responsable")} placeholder="Nombre completo" />
                    <CampoSimple label="CENTRO DE OPERACIÓN" error={obtenerErrorPorRuta(errors, "generalInfo.centroOperacion")?.message} {...register("generalInfo.centroOperacion")} placeholder="Ej. Planta principal" />
                    <CampoSimple label="DURACIÓN ESTIMADA DEL TRABAJO (HORAS)" type="number" error={obtenerErrorPorRuta(errors, "generalInfo.tiempoSolicitado")?.message} {...register("generalInfo.tiempoSolicitado")} placeholder="Ej. 8" />
                  </div>
                </GrupoSecciones>

                <GrupoSecciones title="HORARIO Y DESCRIPCIÓN" description="Registra el tiempo de ejecución, la actividad y las herramientas necesarias.">
                  <div className="info-grid info-grid--three">
                    <CampoSimple label="DE LAS" type="time" center error={obtenerErrorPorRuta(errors, "generalInfo.horaInicio")?.message} {...register("generalInfo.horaInicio")} />
                    <CampoSimple label="A LAS" type="time" center error={obtenerErrorPorRuta(errors, "generalInfo.horaFin")?.message} {...register("generalInfo.horaFin")} />
                    <CampoSimple label="DURACIÓN CALCULADA" value={durationValue} readOnly helper="Se actualiza automáticamente" error={obtenerErrorPorRuta(errors, "generalInfo.duracion")?.message} />
                  </div>
                  <div className="space-y-4 pt-4">
                    <CampoArea label="DESCRIPCION DE LA ACTIVIDAD A REALIZAR" full error={obtenerErrorPorRuta(errors, "generalInfo.descripcion")?.message} {...register("generalInfo.descripcion")} placeholder="Describe la actividad a ejecutar" />
                    <CampoArea label="HERRAMIENTAS A UTILIZAR DURANTE LA TAREA" full error={obtenerErrorPorRuta(errors, "generalInfo.herramientas")?.message} {...register("generalInfo.herramientas")} placeholder="Lista las herramientas y equipos" helper="Puedes separar elementos con comas." />
                  </div>
                </GrupoSecciones>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="space-y-8">
                <GrupoSecciones title="CUADRO DE TRABAJADORES RESPONSABLES QUE REALIZARAN LA ACTIVIDAD EN ESPACIOS CONFINADOS" description="Marque SI o NO según corresponda y agregue cada responsable.">
                  <div className="soft-card compact-card">
                    <div className="declaration-card__head worker-extra__head">
                      <h3 className="declaration-card__title">ÍTEM 1</h3>
                    </div>
                    <div className="grid gap-6">
                      <CampoSimple label="NOMBRE COMPLETO" error={obtenerErrorPorRuta(errors, "workerForm.nombre")?.message} {...register("workerForm.nombre")} placeholder="Nombre completo" />
                      <CampoSimple label="NÚMERO DE IDENTIFICACIÓN" error={obtenerErrorPorRuta(errors, "workerForm.identificacion")?.message} {...register("workerForm.identificacion")} placeholder="Solo números" />
                      <CampoSimple label="CARGO" error={obtenerErrorPorRuta(errors, "workerForm.cargo")?.message} {...register("workerForm.cargo")} placeholder="Cargo o función" />
                      <CampoSeleccion label="¿SE ENCUENTRA EN BUEN ESTADO DE SALUD PARA REALIZAR LA ACTIVIDAD?" error={obtenerErrorPorRuta(errors, "workerForm.salud")?.message} {...register("workerForm.salud")}>
                        <option value="Seleccione una opción">Seleccione una opción</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </CampoSeleccion>
                      {workerForm.salud === "No" ? (
                        <CampoArea
                          label="OBSERVACIÓN DEL ESTADO DE SALUD"
                          full
                          error={obtenerErrorPorRuta(errors, "workerForm.observacion")?.message}
                          value={workerObservacion}
                          onChange={(event) => setWorkerObservation(event.target.value)}
                          placeholder="Describe la observación o trazabilidad"
                        />
                      ) : null}
                    </div>

                    {workerForm.salud === "No" ? (
                      <div className="worker-warning" role="alert">
                        <strong>Observación requerida:</strong> registra el motivo por el cual el trabajador no está en buen estado de salud.
                      </div>
                    ) : null}

                    {workerForm.salud !== "No" ? (
                      <div className="signature-slot">
                        <div className="mini-title">FIRMA</div>
                        <CampoFirma
                          value={workerSignature}
                          error={obtenerErrorPorRuta(errors, "signatures.trabajador")?.message}
                          onChange={(value) => setValue("signatures.trabajador", value, { shouldValidate: validationAttempted })}
                          onClear={() => setValue("signatures.trabajador", "", { shouldValidate: validationAttempted })}
                        />
                      </div>
                    ) : (
                      <div className="worker-warning" role="alert">
                        <strong>Firma no disponible:</strong> el trabajador no puede firmar porque no se encuentra en buen estado de salud.
                      </div>
                    )}
                  </div>

                  <div className="worker-actions">
                    <div className="worker-actions__row worker-actions__row--full">
                      <Button type="button" variant="accent" onClick={addWorkerEntry} className="btn-xl">
                        AGREGAR TRABAJADOR
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    {extraWorkerFields.map((worker, index) => (
                      <TarjetaTrabajadorExtra
                        key={worker.id}
                        index={index}
                        control={control}
                        errors={errors}
                        register={register}
                        remove={remove}
                        setValue={setValue}
                        validationAttempted={validationAttempted}
                      />
                    ))}
                  </div>
                </GrupoSecciones>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <div className="space-y-8">
                {gruposMedidasSeguridad.map((group) => (
                  <GrupoSecciones
                    key={group.title}
                    title={group.title}
                    description="Marca SI, NO o NA según corresponda para cada condición de control."
                  >
                    <div className="space-y-3">
                      <div className="grid gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 md:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(72px,auto))]">
                        <div>Condición</div>
                        <div className="text-center">NA</div>
                        <div className="text-center">SI</div>
                        <div className="text-center">NO</div>
                      </div>
                      {group.items.map((item) => (
                        <SafetyMeasureRow key={item.key} name={`safetyChecks.${item.key}`} label={item.label} register={register} />
                      ))}
                    </div>
                  </GrupoSecciones>
                ))}
              </div>
            ) : null}

            {activeStep === 4 ? (
              <SeccionMonitoreoAmbiental
                control={control}
                register={register}
                errors={errors}
                setValue={setValue}
                validationAttempted={validationAttempted}
              />
            ) : null}

            {activeStep === 5 ? (
              <div className="space-y-8">
                <GrupoSecciones title="RELACIONE LOS EPP A UTILIZAR Y EQUIPO DE RESCATE DISPOPNIBLE" description="Registra los elementos de protección y rescate aplicables para la tarea.">
                  <div className="space-y-4">
                    <div className="soft-card compact-card">
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
                    <CampoArea
                      label="EQUIPOS DE PROTECCIÓN PERSONAL"
                      full
                      error={obtenerErrorPorRuta(errors, "generalInfo.epp")?.message}
                      {...register("generalInfo.epp")}
                      placeholder="Describe los EPP que se utilizarán"
                    />
                    <div className="soft-card compact-card">
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
                    <CampoArea
                      label="EQUIPOS DE RESCATE"
                      full
                      error={obtenerErrorPorRuta(errors, "generalInfo.rescate")?.message}
                      {...register("generalInfo.rescate")}
                      placeholder="Describe los equipos de rescate disponibles"
                    />
                    <CampoArea
                      label="OTROS"
                      full
                      error={obtenerErrorPorRuta(errors, "generalInfo.otros")?.message}
                      {...register("generalInfo.otros")}
                      placeholder="Información adicional"
                    />
                  </div>
                </GrupoSecciones>
              </div>
            ) : null}

            {activeStep === 6 ? (
              <div className="space-y-8">
                <section className="declaration-card">
                  <div className="declaration-card__head">
                    <span className="declaration-card__icon">⚠</span>
                    <h3 className="declaration-card__title">TERMINO DE RESPONSABILIDADES Y AUTORIZACION PARA EJECUCION DE TRABAJOS</h3>
                  </div>
                  <div className="declaration-card__body">
                    <p className="declaration-card__lead">DECLARO</p>
                    <p className="declaration-card__text">
                      Que soy(mos) conscientes de la responsabilidad y después de tener evaluados los peligros inherentes al trabajo a ser realizado autorizo su ejecución siempre seguido de las precauciones y definiciones acordadas en conjunto con el trabajador(es) que ejecutan la tarea.
                    </p>
                    <p className="declaration-card__foot">
                      (Constato que he verificado que todas las recomendaciones de seguridad aquí contempladas cumplen con los requisitos establecidos).
                    </p>
                    <div className="declaration-card__acceptance">
                      <div className="mini-block">
                        <div className="mini-title">DECLARO QUE HE REVISADO EL ÁREA Y CERTIFICO QUE SE HAN TOMADO LAS PRECAUCIONES INDICADAS PARA DAR INICIO AL TRABAJO</div>
                      </div>
                      <label className="declaration-check">
                        <Checkbox
                          checked={declarationAccepted}
                          onCheckedChange={(checked) => setValue("declarationAccepted", checked, { shouldValidate: validationAttempted })}
                        />
                        <span>Acepto y entiendo la declaración de responsabilidad</span>
                      </label>
                      <div className="declaration-card__closure-grid" aria-label="Cierre de declaración">
                       
                      </div>
                      {validationAttempted && errors.declarationAccepted ? <p className="field-helper field-helper--error">{errors.declarationAccepted.message}</p> : null}
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="soft-card compact-card">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                        PERSONAL HSE QUE REVISA Y CERTIFICA ESTE PERMISO
                      </h3>
                    </div>
                    <div className="info-grid info-grid--two">
                      <CampoSimple
                        label="CÉDULA DEL PERSONAL HSE"
                        error={obtenerErrorPorRuta(errors, "generalInfo.personal")?.message}
                        {...register("generalInfo.personal")}
                        placeholder="Ej. 321233"
                      />
                      <CampoSimple
                        label="NOMBRE DEL PERSONAL HSE"
                        error={obtenerErrorPorRuta(errors, "generalInfo.personalhse")?.message}
                        {...register("generalInfo.personalhse")}
                        placeholder="Ej. Pepito Pérez"
                      />
                    </div>
                    <div className="signature-slot">
                      <div className="mini-title">FIRMA</div>
                      <CampoFirma
                        value={hseSignature}
                        error={obtenerErrorPorRuta(errors, "signatures.hse")?.message}
                        onChange={(value) => setValue("signatures.hse", value, { shouldValidate: validationAttempted })}
                        onClear={() => setValue("signatures.hse", "", { shouldValidate: validationAttempted })}
                      />
                    </div>
                  </div>

                  <div className="soft-card compact-card">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                        RESPONSABLE DE LA EJECUCIÓN DEL TRABAJO
                      </h3>
                    </div>
                    <div className="info-grid info-grid--two">
                      <CampoSimple
                        label="CÉDULA DE CIUDADANÍA"
                        error={obtenerErrorPorRuta(errors, "generalInfo.ciudadania")?.message}
                        {...register("generalInfo.ciudadania")}
                        placeholder="Ej. 32323"
                      />
                      <CampoSimple
                        label="NOMBRE DEL RESPONSABLE"
                        error={obtenerErrorPorRuta(errors, "generalInfo.trabajador")?.message}
                        {...register("generalInfo.trabajador")}
                        placeholder="Ej. Pepito Pérez"
                      />
                    </div>
                    <div className="signature-slot">
                      <div className="mini-title">FIRMA</div>
                      <CampoFirma
                        value={responsibleSignature}
                        error={obtenerErrorPorRuta(errors, "signatures.responsable")?.message}
                        onChange={(value) => setValue("signatures.responsable", value, { shouldValidate: validationAttempted })}
                        onClear={() => setValue("signatures.responsable", "", { shouldValidate: validationAttempted })}
                      />
                    </div>
                  </div>
                </div>

                <GrupoSecciones title="RESPONSABLES DE LA ACTIVIDAD" description="Registra los roles de supervisión, vigía, entrante y jefe del área.">
                  <div className="grid gap-6 xl:grid-cols-2">
                    {valoresDefecto.approvalPeople.map((_, index) => (
                      <TarjetaRolAprobacion
                        key={index}
                        index={index}
                        control={control}
                        errors={errors}
                        register={register}
                        setValue={setValue}
                        validationAttempted={validationAttempted}
                      />
                    ))}
                  </div>
                </GrupoSecciones>

                <GrupoSecciones title="OBSERVACIONES Y CIERRE" description="Registra observaciones finales y el concepto de cierre o cancelación del permiso.">
                  <CampoArea
                    label="OBSERVACIONES"
                    full
                    error={obtenerErrorPorRuta(errors, "observaciones")?.message}
                    {...register("observaciones")}
                    placeholder="Escribe observaciones adicionales"
                  />
                  <CampoArea
                    label="CONCEPTO DEL CIERRE O CANCELACION DEL PERMISO"
                    full
                    error={obtenerErrorPorRuta(errors, "cierreCancelacion")?.message}
                    {...register("cierreCancelacion")}
                    placeholder="Escribe el concepto del cierre o cancelación"
                  />
                </GrupoSecciones>
              </div>
            ) : null}
          </div>

          <div className="flex gap-4 border-t border-slate-200 pt-6">
            <Button type="button" variant="secondary" onClick={prevStep} disabled={activeStep === 1}>
              Anterior
            </Button>
            {activeStep < sections.length ? (
              <Button type="button" onClick={nextStep} variant="primary" disabled={hasCurrentErrors}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" variant="primary">
                Enviar formulario
              </Button>
            )}
          </div>
        </form>
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
          <path d="M12 19V5m0 0 6 6m-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </main>
  );
}
