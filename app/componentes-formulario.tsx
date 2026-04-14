"use client";

import React, { useEffect, useRef, useState } from "react";
import Signature from "@uiw/react-signature/canvas";
import type { SignatureCanvasRef } from "@uiw/react-signature/canvas";
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { ValorSalud } from "./hse-f001.schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { type ValoresFormulario } from "./utilidades-formulario";

type TrazosFirma = Record<string, number[][]>;

const cacheTrazosFirma = new Map<string, TrazosFirma>();

function obtenerTrazosFirmaGuardados(firma: string): TrazosFirma {
  if (!firma) return {};
  return cacheTrazosFirma.get(firma) ?? {};
}

function guardarTrazosFirma(firma: string, trazos: TrazosFirma) {
  if (!firma) return;
  cacheTrazosFirma.set(firma, trazos);
}

export function CampoSimple({
  label,
  error,
  helper,
  full = false,
  center = false,
  value,
  readOnly,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
  full?: boolean;
  center?: boolean;
  value?: string;
}) {
  return (
    <div className={`field-shell ${full ? "field-shell--full" : ""} ${className}`}>
      <label className="field-shell__label">{label}</label>
      <Input {...props} value={value} readOnly={readOnly} className={center ? "field-shell__value--center" : ""} aria-invalid={Boolean(error)} />
      {helper ? <p className="field-helper">{helper}</p> : null}
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
    </div>
  );
}

export function CampoArea({
  label,
  error,
  helper,
  full = false,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helper?: string;
  full?: boolean;
}) {
  return (
    <div className={`field-shell ${full ? "field-shell--full" : ""} ${className}`}>
      <label className="field-shell__label">{label}</label>
      <Textarea {...props} aria-invalid={Boolean(error)} />
      {helper ? <p className="field-helper">{helper}</p> : null}
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
    </div>
  );
}

export function CampoSeleccion({
  label,
  error,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field-shell ${className}`}>
      <label className="field-shell__label">{label}</label>
      <Select {...props} aria-invalid={Boolean(error)}>
        {children}
      </Select>
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
    </div>
  );
}

export function GrupoSecciones({
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

export function CampoFirma({
  value,
  error,
  onChange,
  onClear,
  compact = false,
  clearLabel = "Limpiar firma",
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onClear: () => void;
  compact?: boolean;
  clearLabel?: string;
}) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const lienzoRef = useRef<SignatureCanvasRef | null>(null);
  const trazosIniciales = obtenerTrazosFirmaGuardados(value);
  const [trazosFirma, setTrazosFirma] = useState<TrazosFirma>(() => trazosIniciales);
  const trazosFirmaRef = useRef<TrazosFirma>(trazosIniciales);
  const [tamanoLienzo, setTamanoLienzo] = useState({ width: 0, height: 0 });

  useEffect(() => {
    trazosFirmaRef.current = trazosFirma;
  }, [trazosFirma]);

  useEffect(() => {
    const actualizarTamano = () => {
      const width = Math.round(contenedorRef.current?.clientWidth ?? 0);
      if (!width) return;
      setTamanoLienzo({ width, height: compact ? 110 : 180 });
    };
    actualizarTamano();
    const observador = new ResizeObserver(actualizarTamano);
    if (contenedorRef.current) observador.observe(contenedorRef.current);
    return () => observador.disconnect();
  }, [compact]);

  const manejarTrazado = (trazo: number[][]) => {
    if (trazo.length === 0) return;
    const claveTrazo = `path-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const siguientesTrazos = { ...trazosFirmaRef.current, [claveTrazo]: trazo };
    trazosFirmaRef.current = siguientesTrazos;
    setTrazosFirma(siguientesTrazos);
    window.setTimeout(() => {
      const firmaActual = lienzoRef.current?.canvas?.toDataURL("image/png") ?? "";
      if (!firmaActual) return;
      guardarTrazosFirma(firmaActual, siguientesTrazos);
      onChange(firmaActual);
    }, 0);
  };

  const limpiarFirma = () => {
    lienzoRef.current?.clear();
    const trazosVacios: TrazosFirma = {};
    trazosFirmaRef.current = trazosVacios;
    setTrazosFirma(trazosVacios);
    onClear();
  };

  return (
    <div className={`signature-pad ${compact ? "signature-pad--compact" : ""}`} ref={contenedorRef}>
      <Signature
        key={tamanoLienzo.width}
        ref={lienzoRef}
        readonly={false}
        defaultPoints={trazosFirma}
        width={tamanoLienzo.width || undefined}
        height={tamanoLienzo.height || undefined}
        className={`signature-canvas signature-canvas--dashed ${compact ? "signature-canvas--compact" : ""} ${error ? "field-shell__input--error" : ""}`}
        onPointer={manejarTrazado}
        style={{ width: "100%", height: tamanoLienzo.height ? `${tamanoLienzo.height}px` : compact ? "110px" : "180px" }}
      />
      {value ? <p className={`signature-status signature-status--success ${compact ? "signature-status--compact" : ""}`}>✓ Firma registrada</p> : null}
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
      <Button type="button" variant="secondary" onClick={limpiarFirma} className={`signature-clear-button ${compact ? "signature-clear-button--compact" : ""}`}>
        {clearLabel}
      </Button>
    </div>
  );
}

export function TarjetaTrabajadorExtra({
  index,
  control,
  errors,
  register,
  remove,
  setValue,
  validationAttempted,
}: {
  index: number;
  control: Control<ValoresFormulario>;
  errors: FieldErrors<ValoresFormulario>;
  register: UseFormRegister<ValoresFormulario>;
  remove: (index: number) => void;
  setValue: UseFormSetValue<ValoresFormulario>;
  validationAttempted: boolean;
}) {
  const base = `extraWorkers.${index}` as const;
  const health = useWatch({ control, name: `${base}.salud` as const }) as ValorSalud | undefined;
  const name = useWatch({ control, name: `${base}.nombre` as const }) as string | undefined;
  const cargo = useWatch({ control, name: `${base}.cargo` as const }) as string | undefined;
  const observation = useWatch({
    control,
    name: `${base}.observacion` as never,
  }) as string | undefined;
  const signatureValue = useWatch({ control, name: `${base}.signature` as const }) ?? "";

  useEffect(() => {
    if (health === "No" && signatureValue) {
      setValue(`${base}.signature` as never, "" as never, { shouldValidate: false });
    }
  }, [base, health, setValue, signatureValue]);

  return (
    <div className="soft-card compact-card">
      <div className="declaration-card__head worker-extra__head">
        <h3 className="declaration-card__title">ÍTEM {index + 2}</h3>
        <Button type="button" variant="ghost" onClick={() => remove(index)} className="worker-extra__remove">
          Eliminar
        </Button>
      </div>
      <div className="grid gap-6">
        <CampoSimple label="NOMBRE COMPLETO" error={obtenerErrorPorRuta(errors, `${base}.nombre`)?.message} {...register(`${base}.nombre` as never)} placeholder="Nombre completo" value={name ?? undefined} />
        <CampoSimple label="N° de identificación" error={obtenerErrorPorRuta(errors, `${base}.identificacion`)?.message} {...register(`${base}.identificacion` as never)} placeholder="Solo números" />
        <CampoSimple label="CARGO" error={obtenerErrorPorRuta(errors, `${base}.cargo`)?.message} {...register(`${base}.cargo` as never)} placeholder="Cargo o función" value={cargo ?? undefined} />
        <CampoSeleccion label="¿Se encuentra en buen estado de salud?" error={obtenerErrorPorRuta(errors, `${base}.salud`)?.message} {...register(`${base}.salud` as never)}>
          <option value="Seleccione una opción">Seleccione una opción</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </CampoSeleccion>
        {health === "No" ? (
          <>
            <CampoArea
              label="OBSERVACIÓN DEL ESTADO DE SALUD"
              full
              error={obtenerErrorPorRuta(errors, `${base}.observacion`)?.message}
              value={observation ?? ""}
              onChange={(event) => setValue(`${base}.observacion` as never, event.target.value as never, { shouldValidate: validationAttempted })}
              placeholder="Describe la observación o trazabilidad"
            />
            <div className="worker-warning" role="alert">
              <strong>Observación requerida:</strong> registra el motivo por el cual el trabajador no está en buen estado de salud.
            </div>
          </>
        ) : null}
        {health !== "No" ? (
          <div className="signature-slot">
            <div className="mini-title">FIRMA DEL TRABAJADOR</div>
            <CampoFirma
              value={signatureValue}
              error={obtenerErrorPorRuta(errors, `${base}.signature`)?.message}
              onChange={(value) => setValue(`${base}.signature` as never, value as never, { shouldValidate: validationAttempted })}
              onClear={() => setValue(`${base}.signature` as never, "" as never, { shouldValidate: validationAttempted })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TarjetaRolAprobacion({
  index,
  control,
  errors,
  register,
  setValue,
  validationAttempted,
}: {
  index: number;
  control: Control<ValoresFormulario>;
  errors: FieldErrors<ValoresFormulario>;
  register: UseFormRegister<ValoresFormulario>;
  setValue: UseFormSetValue<ValoresFormulario>;
  validationAttempted: boolean;
}) {
  const base = `approvalPeople.${index}` as const;
  const role = useWatch({ control, name: `${base}.role` as const }) as string | undefined;
  const signatureValue = useWatch({ control, name: `${base}.signature` as const }) ?? "";

  return (
    <div className="soft-card compact-card">
      <div className="declaration-card__head worker-extra__head">
        <h3 className="declaration-card__title">{role || `ROL ${index + 1}`}</h3>
      </div>
      <div className="grid gap-6">
        <CampoSimple label="NOMBRE COMPLETO" error={obtenerErrorPorRuta(errors, `${base}.nombre`)?.message} {...register(`${base}.nombre` as never)} placeholder="Nombre completo" />
        <CampoSimple label="NÚMERO DE IDENTIFICACIÓN" error={obtenerErrorPorRuta(errors, `${base}.identificacion`)?.message} {...register(`${base}.identificacion` as never)} placeholder="Solo números" />
        <div className="signature-slot">
          <div className="mini-title">FIRMA</div>
          <CampoFirma
            value={signatureValue}
            error={obtenerErrorPorRuta(errors, `${base}.signature`)?.message}
            onChange={(value) => setValue(`${base}.signature` as never, value as never, { shouldValidate: validationAttempted })}
            onClear={() => setValue(`${base}.signature` as never, "" as never, { shouldValidate: validationAttempted })}
          />
        </div>
      </div>
    </div>
  );
}

export function obtenerErrorPorRuta(errors: Record<string, unknown>, path: string): { message?: string } | undefined {
  const parts = path.split(".");
  let current: unknown = errors;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as { message?: string } | undefined;
}
