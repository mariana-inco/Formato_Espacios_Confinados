"use client";

import React from "react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, type SaludValue } from "./hse-f001.schema";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { compactObject, calcularDuracion, defaultValues, sections, stepFields, summarizeSignatureLink, type FormValues, type StepNumber } from "./utilidades-formulario";
import { ExtraWorkerCard, Field, SectionGroup, SelectField, SignatureField, TextareaField, getErrorByPath } from "./componentes-formulario";

export default function Home() {
  // Estado del wizard: paso actual, validación mostrada y botón flotante.
  const [activeStep, setActiveStep] = useState<StepNumber>(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const sectionContentRef = useRef<HTMLDivElement | null>(null);

  // React Hook Form centraliza todos los campos del formulario.
  const {
    register,
    control,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onTouched",
  });

  const { fields: extraWorkerFields, append, remove } = useFieldArray({
    control,
    name: "extraWorkers",
  });

  // `useWatch` nos deja reaccionar a cambios sin duplicar estado manual.
  const generalInfo = useWatch({ control, name: "generalInfo" }) ?? defaultValues.generalInfo;
  const workerForm = useWatch({ control, name: "workerForm" }) ?? defaultValues.workerForm;
  const declarationAccepted = useWatch({ control, name: "declarationAccepted" }) ?? false;
  const workerSignature = useWatch({ control, name: "signatures.trabajador" }) ?? "";
  const hseSignature = useWatch({ control, name: "signatures.hse" }) ?? "";
  const responsibleSignature = useWatch({ control, name: "signatures.responsable" }) ?? "";

  const durationValue = useMemo(
    () => calcularDuracion(generalInfo.horaInicio, generalInfo.horaFin) || generalInfo.duracion,
    [generalInfo.duracion, generalInfo.horaFin, generalInfo.horaInicio]
  );

  // Mantiene sincronizada la duración calculada con el formulario.
  useEffect(() => {
    setValue("generalInfo.duracion", durationValue, { shouldValidate: validationAttempted });
  }, [durationValue, setValue, validationAttempted]);

  // Cuando cambiamos de paso, enfocamos la sección activa para no perder contexto.
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

  // Al enviar, armamos un JSON limpio y organizado por secciones.
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const nextStep = async () => {
    // Antes de avanzar, validamos solo los campos del paso actual.
    setValidationAttempted(true);
    const ok = await trigger(stepFields[activeStep] as never, { shouldFocus: true });
    if (!ok) return;
    setActiveStep((value) => (Math.min(value + 1, 4) as StepNumber));
  };

  const prevStep = () => setActiveStep((value) => (Math.max(value - 1, 1) as StepNumber));

  const onSubmit = handleSubmit(() => {
    // Construimos la salida final con los datos capturados por secciones.
    const values = getValues();
    const consolePayload = {
      generalInfo: compactObject({
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
      workerForm: compactObject({
        identificacion: values.workerForm.identificacion,
        nombre: values.workerForm.nombre,
        cargo: values.workerForm.cargo,
        salud: values.workerForm.salud,
        dificultad: values.workerForm.dificultad,
      }),
      extraWorkers: values.extraWorkers.map((worker) =>
        compactObject({
          id: worker.id,
          identificacion: worker.identificacion,
          salud: worker.salud,
          dificultad: worker.dificultad,
          signature: summarizeSignatureLink(`extra-${worker.id}`, worker.signature),
        })
      ),
      signatures: compactObject({
        trabajador: summarizeSignatureLink("trabajador", values.signatures.trabajador),
        hse: summarizeSignatureLink("hse", values.signatures.hse),
        responsable: summarizeSignatureLink("responsable", values.signatures.responsable),
      }),
      declarationAccepted: values.declarationAccepted,
    };
    console.log("Formulario enviado");
    console.log(JSON.stringify(consolePayload, null, 2));
    window.alert("Formulario enviado correctamente");
  });

  const addWorkerEntry = () => {
    append({
      id: extraWorkerFields.length > 0 ? extraWorkerFields[extraWorkerFields.length - 1].id + 1 : 2,
      identificacion: "",
      salud: "Seleccione una opcion" as SaludValue,
      dificultad: "",
      signature: "",
    });
  };

  const stepTitle = sections.find((section) => section.step === activeStep)?.title ?? sections[0].title;
  const progress = (activeStep / sections.length) * 100;
  const hasCurrentErrors = stepFields[activeStep].some((path) => Boolean(getErrorByPath(errors, path)));

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
                <SectionGroup title="Ubicación y fechas" description="Completa primero el lugar y la fecha del permiso.">
                  <div className="info-grid info-grid--two">
                    <Field label="LUGAR" error={getErrorByPath(errors, "generalInfo.lugar")?.message} {...register("generalInfo.lugar")} placeholder="Ej. Mosquera" />
                    <Field label="FECHA" type="date" error={getErrorByPath(errors, "generalInfo.fecha")?.message} {...register("generalInfo.fecha")} />
                  </div>
                </SectionGroup>

                <SectionGroup title="Persona y operación" description="Identifica a quién se concede el permiso y dónde se ejecutará.">
                  <div className="info-grid info-grid--two">
                    <Field label="SE CONCEDE EL PERMISO A" error={getErrorByPath(errors, "generalInfo.responsable")?.message} {...register("generalInfo.responsable")} placeholder="Nombre completo" />
                    <SelectField label="ÁREA" error={getErrorByPath(errors, "generalInfo.area")?.message} {...register("generalInfo.area")}>
                      <option value="">Selecciona una opción</option>
                      <option value="Producción">Producción</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Operaciones">Operaciones</option>
                      <option value="Calidad">Calidad</option>
                      <option value="Otro">Otro</option>
                    </SelectField>
                    <Field label="CENTRO DE OPERACIÓN" error={getErrorByPath(errors, "generalInfo.centroOperacion")?.message} {...register("generalInfo.centroOperacion")} placeholder="Ej. Ammann" />
                    <Field label="TIEMPO SOLICITADO (HORAS)" type="number" error={getErrorByPath(errors, "generalInfo.tiempoSolicitado")?.message} {...register("generalInfo.tiempoSolicitado")} placeholder="Ej. 96" />
                  </div>
                </SectionGroup>

                <SectionGroup title="Horario y duración" description="Si completas hora de inicio y fin, la duración se actualiza automáticamente.">
                  <div className="info-grid info-grid--three">
                    <Field label="DE LAS" type="time" center error={getErrorByPath(errors, "generalInfo.horaInicio")?.message} {...register("generalInfo.horaInicio")} />
                    <Field label="A LAS" type="time" center error={getErrorByPath(errors, "generalInfo.horaFin")?.message} {...register("generalInfo.horaFin")} />
                    <Field label="DURACIÓN ESTIMADA" value={durationValue} readOnly helper="Calculada automáticamente" error={getErrorByPath(errors, "generalInfo.duracion")?.message} />
                  </div>
                </SectionGroup>

                <SectionGroup title="Detalles del trabajo" description="Describe la actividad y las herramientas necesarias.">
                  <div className="space-y-4">
                    <TextareaField label="DESCRIPCIÓN DE LA ACTIVIDAD A REALIZAR" full error={getErrorByPath(errors, "generalInfo.descripcion")?.message} {...register("generalInfo.descripcion")} placeholder="Ej. Mantenimiento de tolvas y silos" />
                    <TextareaField label="HERRAMIENTAS A UTILIZAR DURANTE LA TAREA" full error={getErrorByPath(errors, "generalInfo.herramientas")?.message} {...register("generalInfo.herramientas")} placeholder="Ej. Herramientas manuales, eléctricas, etc." helper="Puedes separar elementos con comas." />
                  </div>
                </SectionGroup>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="space-y-8">
                <SectionGroup title="CUADRO DE RESPONSABLES QUE REALIZARÁN LA ACTIVIDAD EN ESPACIOS CONFINADOS" description="Marque sí o no según corresponda.">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Field label="NÚMERO DE IDENTIFICACIÓN" error={getErrorByPath(errors, "workerForm.identificacion")?.message} {...register("workerForm.identificacion")} placeholder="Ej. 1073241989" />
                    <Field label="NOMBRE COMPLETO" error={getErrorByPath(errors, "workerForm.nombre")?.message} {...register("workerForm.nombre")} placeholder="Ej. Juan David Beltran Rodriguez" />
                    <Field label="CARGO" error={getErrorByPath(errors, "workerForm.cargo")?.message} {...register("workerForm.cargo")} placeholder="Ej. Operador planta de asfalto I" />
                    <SelectField label="¿SE ENCUENTRA EN BUEN ESTADO DE SALUD?" error={getErrorByPath(errors, "workerForm.salud")?.message} {...register("workerForm.salud")}>
                      <option value="Seleccione una opcion">Seleccione una opcion</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </SelectField>
                    {workerForm.salud === "No" ? (
                      <TextareaField label="¿Qué dificultad presenta?" full error={getErrorByPath(errors, "workerForm.dificultad")?.message} {...register("workerForm.dificultad")} placeholder="Describe brevemente la condición o dificultad" />
                    ) : null}
                  </div>

                  {/* Si marca "No", mostramos una alerta clara y bloqueante para el trabajador principal. */}
                  {workerForm.salud === "No" ? (
                    <div className="worker-warning" role="alert">
                      <strong>Alerta:</strong> el trabajador no puede realizar la actividad en espacios confinados.
                    </div>
                  ) : null}

                  <div className="signature-slot">
                    <div className="mini-title">FIRMA DEL TRABAJADOR</div>
                    <SignatureField
                      value={workerSignature}
                      error={getErrorByPath(errors, "signatures.trabajador")?.message}
                      onChange={(value) => setValue("signatures.trabajador", value, { shouldValidate: validationAttempted })}
                      onClear={() => setValue("signatures.trabajador", "", { shouldValidate: validationAttempted })}
                    />
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
                      <ExtraWorkerCard
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
                </SectionGroup>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <div className="space-y-8">
                <div className="mini-block mini-block--header">
                  <div className="mini-title mini-title--bar">RELACIONE LOS EPP A UTILIZAR Y EL EQUIPO DE RESCATE DISPONIBLE</div>
                </div>
                <div className="mini-block">
                  <div className="flex justify-center">
                    <Image src="/EPP.png" alt="Equipos de Protección Personal" width={1200} height={700} className="max-h-72 w-full max-w-3xl rounded-2xl object-contain" />
                  </div>
                </div>
                <TextareaField label="EQUIPOS DE PROTECCIÓN PERSONAL" full error={getErrorByPath(errors, "generalInfo.epp")?.message} {...register("generalInfo.epp")} placeholder="Describe los equipos de protección personal a utilizar" />
                <div className="mini-block">
                  <div className="flex justify-center">
                    <Image src="/kit-de-rescate.png" alt="Equipos de rescate" width={1200} height={700} className="max-h-72 w-full max-w-3xl rounded-2xl object-contain" />
                  </div>
                </div>
                <TextareaField label="EQUIPOS DE RESCATE" full error={getErrorByPath(errors, "generalInfo.rescate")?.message} {...register("generalInfo.rescate")} placeholder="Describe los equipos de rescate disponibles" />
                <TextareaField label="OTROS" full error={getErrorByPath(errors, "generalInfo.otros")?.message} {...register("generalInfo.otros")} placeholder="Información adicional" />
              </div>
            ) : null}

            {activeStep === 4 ? (
              <div className="space-y-8">
                <section className="declaration-card">
                  <div className="declaration-card__head">
                    <span className="declaration-card__icon">⚠</span>
                    <h3 className="declaration-card__title">TÉRMINO DE RESPONSABILIDADES Y AUTORIZACIÓN PARA EJECUCIÓN DE TRABAJOS</h3>
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
                        <div className="mini-title">
                          DECLARO QUE HE REVISADO EL ÁREA Y CERTIFICO QUE SE HAN TOMADO LAS PRECAUCIONES INDICADAS PARA DAR INICIO AL TRABAJO
                        </div>
                      </div>
                      <label className="declaration-check">
                        <Checkbox
                          checked={declarationAccepted}
                          onCheckedChange={(checked) => setValue("declarationAccepted", checked, { shouldValidate: validationAttempted })}
                        />
                        <span>Acepto y entiendo la declaración de responsabilidad</span>
                      </label>
                      {validationAttempted && errors.declarationAccepted ? <p className="field-helper field-helper--error">{errors.declarationAccepted.message}</p> : null}
                    </div>
                  </div>
                </section>

                <div className="grid gap-6">
                  <div className="soft-card compact-card">
                    <Field label="CÉDULA DEL PERSONAL HSE" error={getErrorByPath(errors, "generalInfo.personal")?.message} {...register("generalInfo.personal")} placeholder="Ej. 321233" />
                  </div>
                  <div className="soft-card compact-card">
                    <Field label="NOMBRE DEL PERSONAL HSE QUE REVISA Y CERTIFICA ESTE PERMISO" error={getErrorByPath(errors, "generalInfo.personalhse")?.message} {...register("generalInfo.personalhse")} placeholder="Ej. Pepito Pérez" />
                    <div className="signature-slot">
                      <div className="mini-title">FIRMA</div>
                      <SignatureField
                        value={hseSignature}
                        error={getErrorByPath(errors, "signatures.hse")?.message}
                        onChange={(value) => setValue("signatures.hse", value, { shouldValidate: validationAttempted })}
                        onClear={() => setValue("signatures.hse", "", { shouldValidate: validationAttempted })}
                      />
                    </div>
                  </div>

                  <div className="soft-card compact-card">
                    <Field label="CÉDULA DE CIUDADANÍA DEL RESPONSABLE DE LA EJECUCIÓN DEL TRABAJO" error={getErrorByPath(errors, "generalInfo.ciudadania")?.message} {...register("generalInfo.ciudadania")} placeholder="Ej. 32323" />
                  </div>
                  <div className="soft-card compact-card">
                    <Field label="NOMBRE RESPONSABLE EJECUCIÓN DEL TRABAJO" error={getErrorByPath(errors, "generalInfo.trabajador")?.message} {...register("generalInfo.trabajador")} placeholder="Ej. Pepito Pérez" />
                    <div className="signature-slot">
                      <div className="mini-title">FIRMA</div>
                      <SignatureField
                        value={responsibleSignature}
                        error={getErrorByPath(errors, "signatures.responsable")?.message}
                        onChange={(value) => setValue("signatures.responsable", value, { shouldValidate: validationAttempted })}
                        onClear={() => setValue("signatures.responsable", "", { shouldValidate: validationAttempted })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-4 border-t border-slate-200 pt-6">
            <Button type="button" variant="secondary" onClick={prevStep} disabled={activeStep === 1}>
              Anterior
            </Button>
            {activeStep < sections.length ? (
              <Button type="button" onClick={nextStep} variant="primary" disabled={activeStep === 2 && hasCurrentErrors}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" variant="primary" disabled={Object.keys(errors).length > 0}>
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
