"use client";

import { type InputHTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CampoFirma, CampoSimple, GrupoSecciones, obtenerErrorPorRuta } from "./componentes-formulario";
import { definicionesMonitoreo } from "./formulario-config";
import { crearDefectosTomaMonitoreo, valoresDefecto, type ValoresFormulario } from "./utilidades-formulario";

type DatosFirma = {
  ruta: string;
  titulo: string;
  valor: string;
};

function tieneTomaActiva(toma: ValoresFormulario["monitoring"]["rows"][number]["takes"][number]) {
  return Boolean(toma.hora || toma.resultado || toma.signature);
}

function tomaFirmada(toma: ValoresFormulario["monitoring"]["rows"][number]["takes"][number]) {
  return Boolean(toma.signature?.trim());
}

function CampoMonitoreo({
  label,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  className?: string;
}) {
  return (
    <label className={`monitoring-field ${className}`}>
      <span className="monitoring-field__label">{label}</span>
      <Input {...props} aria-invalid={Boolean(error)} className={`monitoring-field__input ${error ? "monitoring-field__input--error" : ""}`} />
      {error ? <p className="monitoring-field__error">{error}</p> : null}
    </label>
  );
}

function ModalFirmaMonitoreo({
  abierto,
  titulo,
  valor,
  onChange,
  onClose,
  onClear,
}: {
  abierto: boolean;
  titulo: string;
  valor: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div className="firma-modal" role="dialog" aria-modal="true" aria-labelledby="firma-modal-title">
      <button type="button" className="firma-modal__backdrop" aria-label="Cerrar modal de firma" onClick={onClose} />
      <div className="firma-modal__panel">
        <div className="firma-modal__header">
          <div>
            <p className="firma-modal__eyebrow">Firma digital</p>
            <h3 className="firma-modal__title" id="firma-modal-title">
              {titulo}
            </h3>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} className="firma-modal__close">
            Cerrar
          </Button>
        </div>
        <p className="firma-modal__helper">La firma se guarda en tiempo real. Usa el botón limpiar si necesitas reiniciarla.</p>
        <CampoFirma value={valor} error={undefined} onChange={onChange} onClear={onClear} clearLabel="Limpiar firma" />
        <div className="firma-modal__footer">
          <Button type="button" variant="secondary" onClick={onClose}>
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}

type TomaMonitoreoFormulario = ValoresFormulario["monitoring"]["rows"][number]["takes"][number];
type ControlFilaMonitoreo = {
  agregarToma: () => void;
  eliminarToma: (indiceToma: number) => void;
};

function TomaMonitoreo({
  definition,
  rowIndex,
  takeIndex,
  control,
  register,
  errors,
  onSolicitarFirma,
}: {
  definition: (typeof definicionesMonitoreo)[number];
  rowIndex: number;
  takeIndex: number;
  control: Control<ValoresFormulario>;
  register: UseFormRegister<ValoresFormulario>;
  errors: FieldErrors<ValoresFormulario>;
  onSolicitarFirma: (payload: DatosFirma) => void;
}) {
  const toma = useWatch({
    control,
    name: `monitoring.rows.${rowIndex}.takes.${takeIndex}` as never,
  }) as TomaMonitoreoFormulario;

  const firmaRegistrada = tomaFirmada(toma);
  const rutaBase = `monitoring.rows.${rowIndex}.takes.${takeIndex}` as const;
  const rutaFecha = `${rutaBase}.fecha`;
  const rutaHora = `${rutaBase}.hora`;
  const rutaResultado = `${rutaBase}.resultado`;
  const rutaFirma = `${rutaBase}.signature`;
  const errorFecha = obtenerErrorPorRuta(errors, rutaFecha)?.message;
  const errorHora = obtenerErrorPorRuta(errors, rutaHora)?.message;
  const errorResultado = obtenerErrorPorRuta(errors, rutaResultado)?.message;
  const errorFirma = obtenerErrorPorRuta(errors, rutaFirma)?.message;

  return (
    <section className="monitoring-take">
      <div className="monitoring-take__head">
        <div>
          <p className="monitoring-take__eyebrow">Toma {takeIndex + 1}</p>
          <p className="monitoring-take__title">Registro operativo</p>
        </div>
      </div>

      <div className="monitoring-take__grid">
        <CampoMonitoreo label="FECHA" type="date" error={errorFecha} {...register(rutaFecha as never)} />
        <CampoMonitoreo label="HORA" type="time" error={errorHora} {...register(rutaHora as never)} />
        <CampoMonitoreo
          label="RESULTADO"
          type="text"
          inputMode="decimal"
          placeholder="Ej. 21.0"
          error={errorResultado}
          {...register(rutaResultado as never)}
        />
      </div>
      <div className="monitoring-signature-block">
        <span className="monitoring-field__label">FIRMA DIGITAL</span>
        <Button
          type="button"
          variant={firmaRegistrada ? "secondary" : "accent"}
          onClick={() =>
            onSolicitarFirma({
              ruta: rutaFirma,
              titulo: `${definition.label} - Toma ${takeIndex + 1}`,
              valor: toma.signature ?? "",
            })
          }
          className="monitoring-signature-block__button"
        >
          {firmaRegistrada ? "Revisar firma" : "Firmar"}
        </Button>
        {firmaRegistrada ? <span className="monitoring-signature-block__status monitoring-signature-block__status--signed">Firmado</span> : null}
        {errorFirma ? <p className="monitoring-field__error">{errorFirma}</p> : null}
      </div>
    </section>
  );
}

function TarjetaGasMonitoreo({
  definition,
  rowIndex,
  control,
  register,
  errors,
  onSolicitarFirma,
  onRegistrarControles,
}: {
  definition: (typeof definicionesMonitoreo)[number];
  rowIndex: number;
  control: Control<ValoresFormulario>;
  register: UseFormRegister<ValoresFormulario>;
  errors: FieldErrors<ValoresFormulario>;
  onSolicitarFirma: (payload: DatosFirma) => void;
  onRegistrarControles: (rowIndex: number, controles?: ControlFilaMonitoreo) => void;
}) {
  const rutaTomas = `monitoring.rows.${rowIndex}.takes` as const;
  const { fields, append, remove } = useFieldArray({
    control,
    name: rutaTomas as never,
  });
  const tomas = useWatch({
    control,
    name: rutaTomas as never,
  }) as TomaMonitoreoFormulario[] | undefined;

  const tomasVisibles = tomas ?? [];
  const firmasRegistradas = tomasVisibles.filter(tomaFirmada).length;
  const tomasRegistradas = tomasVisibles.filter(tieneTomaActiva).length;
  const [visibleTakes, setVisibleTakes] = useState<number>(1);

  useEffect(() => {
    if (visibleTakes > fields.length) {
      setVisibleTakes(fields.length);
      return;
    }

    const hasVisibleExtraTake = tomasVisibles.slice(1).some((toma) =>
      String(toma.hora ?? "").trim() !== "" ||
      String(toma.resultado ?? "").trim() !== "" ||
      String(toma.signature ?? "").trim() !== ""
    );

    if (hasVisibleExtraTake) {
      setVisibleTakes(fields.length);
    }
  }, [fields, visibleTakes]);

  const agregarToma = useCallback(() => {
    append(crearDefectosTomaMonitoreo());
    setVisibleTakes((current) => Math.max(current + 1, 1));
  }, [append]);

  useEffect(() => {
    onRegistrarControles(rowIndex, {
      agregarToma,
      eliminarToma: remove,
    });

    return () => onRegistrarControles(rowIndex, undefined);
  }, [agregarToma, onRegistrarControles, remove, rowIndex]);

  const displayedFields = visibleTakes > 0 ? fields.slice(0, visibleTakes) : fields;

  return (
    <article className="monitoring-card">
      <div className="monitoring-card__head">
        <div>
          <p className="monitoring-card__gas">{definition.label}</p>
          <p className="monitoring-card__condition">{definition.helper}</p>
        </div>
      </div>

      <div className="monitoring-card__meta">
        <span>{tomasRegistradas ? `${tomasRegistradas} toma(s) registradas` : "Sin tomas registradas"}</span>
        <span>{firmasRegistradas ? `${firmasRegistradas} firma(s) registradas` : "Sin firmas registradas"}</span>
      </div>

      <div className="monitoring-card__takes">
        {displayedFields.length > 0 ? (
          displayedFields.map((field, takeIndex) => (
            <TomaMonitoreo
              key={field.id}
              definition={definition}
              rowIndex={rowIndex}
              takeIndex={takeIndex}
              control={control}
              register={register}
              errors={errors}
              onSolicitarFirma={onSolicitarFirma}
            />
          ))
        ) : (
          <div className="monitoring-card__empty">
            <p className="monitoring-card__empty-text">No hay tomas registradas para este gas.</p>
            <Button type="button" variant="accent" onClick={agregarToma} className="monitoring-card__empty-button">
              Agregar primera toma
            </Button>
          </div>
        )}

        {fields.length > 0 ? (
          <Button type="button" variant="ghost" onClick={agregarToma} className="monitoring-card__add">
            Agregar otra toma
          </Button>
        ) : null}
      </div>
    </article>
  );
}

type ResumenTomaMonitoreo = {
  rowIndex: number;
  takeIndex: number;
  gas: string;
  condicion: string;
  toma: TomaMonitoreoFormulario;
};

function tomaEstaCompleta(toma: TomaMonitoreoFormulario) {
  return Boolean(toma.fecha?.trim() && toma.hora?.trim() && toma.resultado?.trim() && toma.signature?.trim());
}

function TablaResumenTomasMonitoreo({
  filas,
  onSolicitarFirma,
}: {
  filas: ValoresFormulario["monitoring"]["rows"];
  onSolicitarFirma: (payload: DatosFirma) => void;
}) {
  const tomasResumen = useMemo<ResumenTomaMonitoreo[]>(() => {
    return (filas ?? []).flatMap((fila, rowIndex) => {
      const definicion = definicionesMonitoreo[rowIndex];
      return (fila.takes ?? [])
        .map((toma, takeIndex) => ({
          rowIndex,
          takeIndex,
          gas: definicion?.label ?? `Gas ${rowIndex + 1}`,
          condicion: definicion?.helper ?? "",
          toma,
        }))
        .filter((item) => tomaEstaCompleta(item.toma));
    });
  }, [filas]);

  return (
    <section className="monitoring-summary">
      <div className="monitoring-summary__head">
        <div>
          <p className="monitoring-summary__eyebrow">Tabla auxiliar</p>
          <h4 className="monitoring-summary__title">RESULTADOS POR TOMA</h4>
          <p className="monitoring-summary__description">
            Aquí solo aparecen las tomas completas, para evitar filas vacías y mantener la lectura limpia.
          </p>
        </div>
        <span className="monitoring-summary__count">{tomasResumen.length} registro(s)</span>
      </div>

      {tomasResumen.length > 0 ? (
        <div className="monitoring-table-shell">
          <div className="monitoring-table-scroll">
            <table className="monitoring-table">
              <thead>
                <tr>
                  <th>Gas</th>
                  <th>Toma</th>
                  <th>Hora</th>
                  <th>Resultado</th>
                  <th>Firma digital</th>
                </tr>
              </thead>
              <tbody>
                {tomasResumen.map((item) => {
                  const numeroToma = item.takeIndex + 1;
                  const rutaFirma = `monitoring.rows.${item.rowIndex}.takes.${item.takeIndex}.signature` as const;
                  const firmaRegistrada = Boolean(item.toma.signature?.trim());
                  return (
                    <tr key={`${item.rowIndex}-${item.takeIndex}`} className="monitoring-table__row">
                      <td className="monitoring-table__cell monitoring-table__cell--take">
                        <span className="monitoring-table__take-number">{item.gas}</span>
                        <span className="monitoring-table__take-title">{item.condicion}</span>
                      </td>
                      <td className="monitoring-table__cell">
                        <span className="monitoring-table__take-number">Toma {numeroToma}</span>
                        <span className="monitoring-table__take-title">Registro operativo</span>
                      </td>
                      <td className="monitoring-table__cell">
                        <span className="monitoring-table__take-title">{item.toma.hora}</span>
                      </td>
                      <td className="monitoring-table__cell">
                        <span className="monitoring-table__take-title">{item.toma.resultado}</span>
                      </td>
                      <td className="monitoring-table__cell">
                        <div className="monitoring-table__signature">
                          {firmaRegistrada ? (
                            <Image
                              src={item.toma.signature ?? ""}
                              alt={`Firma de ${item.gas} toma ${numeroToma}`}
                              width={220}
                              height={84}
                              unoptimized
                              className="monitoring-table__signature-image"
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="monitoring-summary-empty">
          <p className="monitoring-summary-empty__text">Las tomas completas aparecerán aquí cuando tengan hora, resultado y firma.</p>
        </div>
      )}
    </section>
  );
}

export function SeccionMonitoreoAmbiental({
  control,
  register,
  errors,
  setValue,
  validationAttempted,
}: {
  control: Control<ValoresFormulario>;
  register: UseFormRegister<ValoresFormulario>;
  errors: FieldErrors<ValoresFormulario>;
  setValue: UseFormSetValue<ValoresFormulario>;
  validationAttempted: boolean;
}) {
  const monitoreo = useWatch({ control, name: "monitoring" }) ?? valoresDefecto.monitoring;
  const [firmaActiva, setFirmaActiva] = useState<DatosFirma | null>(null);
  const controlesFilasRef = useRef<(ControlFilaMonitoreo | undefined)[]>([]);

  const registrarControlFila = useCallback((rowIndex: number, controles?: ControlFilaMonitoreo) => {
    controlesFilasRef.current[rowIndex] = controles;
  }, []);

  return (
    <div className="space-y-8">
      <div className="permit-warning-card" role="note" aria-label="Advertencia del permiso">
        <div className="permit-warning-card__head">Este permiso NO debe otorgarse si alguna de las anteriores condiciones no se está cumpliendo</div>
        <div className="permit-warning-card__note">
          <span>Nota:</span> En caso de tormentas, lloviznas suaves y/o vientos, se deben suspender los trabajos.
        </div>
      </div>

      <div className="pst-heading">PROCEDIMIENTO SEGURO DE TRABAJO (PST)</div>

      <GrupoSecciones
        title="RESULTADOS DE MONITOREO AMBIENTAL"
        description="Registra fecha, hora, resultado y firma para cada toma individual de monitoreo."
      >
        <div className="monitoring-dashboard">
          <div className="monitoring-card-grid">
            {definicionesMonitoreo.map((definition, rowIndex) => (
              <TarjetaGasMonitoreo
                key={definition.key}
                definition={definition}
                rowIndex={rowIndex}
                control={control}
                register={register}
                errors={errors}
                onSolicitarFirma={(payload) => setFirmaActiva(payload)}
                onRegistrarControles={registrarControlFila}
              />
            ))}
          </div>

          <TablaResumenTomasMonitoreo filas={monitoreo.rows} onSolicitarFirma={(payload) => setFirmaActiva(payload)} />

          <p className="monitoring-dashboard__note">
            P.P.M = Partículas por millón. LII = límite de inflamabilidad inferior. WGBT = Temperatura de globo; bulbo húmedo y bulbo seco.
          </p>
        </div>
      </GrupoSecciones>

      <div className="pt-4">
        <CampoSimple
          label="EQUIPO DE MEDICIÓN A UTILIZAR"
          error={obtenerErrorPorRuta(errors, "monitoring.equipoMedicion")?.message}
          {...register("monitoring.equipoMedicion")}
          placeholder="Ej. Detector multigás"
        />
      </div>

      <ModalFirmaMonitoreo
        abierto={Boolean(firmaActiva)}
        titulo={firmaActiva?.titulo ?? ""}
        valor={firmaActiva?.valor ?? ""}
        onChange={(value) => {
          if (!firmaActiva) return;
          setValue(firmaActiva.ruta as never, value as never, { shouldValidate: validationAttempted });
        }}
        onClose={() => setFirmaActiva(null)}
        onClear={() => {
          if (!firmaActiva) return;
          setValue(firmaActiva.ruta as never, "" as never, { shouldValidate: validationAttempted });
        }}
      />
    </div>
  );
}
