"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Signature from "@uiw/react-signature/canvas";
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { SaludValue } from "./hse-f001.schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { type FormValues } from "./utilidades-formulario";

export function Field({
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

export function TextareaField({
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

export function SelectField({
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

export function SectionGroup({
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

export function SignatureField({ value, error, onChange, onClear }: { value: string; error?: string; onChange: (value: string) => void; onClear: () => void; }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [points, setPoints] = useState<Record<string, number[][]>>({});
  const [renderKey, setRenderKey] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const restoredPoints = useMemo(() => parseSignaturePoints(value), [value]);

  useEffect(() => {
    const updateSize = () => {
      const width = wrapperRef.current?.clientWidth ?? 0;
      if (!width) return;
      setCanvasSize({ width, height: 180 });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPoints(restoredPoints);
  }, [restoredPoints]);

  const handlePointer = (strokePoints: number[][]) => {
    if (strokePoints.length === 0) return;
    const pathKey = `path-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPoints((prev) => ({ ...prev, [pathKey]: strokePoints }));
    onChange(JSON.stringify(strokePoints));
    setRenderKey((current) => current + 1);
  };

  const clearSignature = () => {
    setPoints({});
    onClear();
    setRenderKey((current) => current + 1);
  };

  return (
    <div className="signature-pad" ref={wrapperRef}>
      <Signature
        key={renderKey}
        readonly={false}
        defaultPoints={points}
        width={canvasSize.width || undefined}
        height={canvasSize.height || undefined}
        className={`signature-canvas signature-canvas--dashed ${error ? "field-shell__input--error" : ""}`}
        onPointer={handlePointer}
        style={{ width: "100%", height: canvasSize.height ? `${canvasSize.height}px` : "180px" }}
      />
      {value ? <p className="signature-status signature-status--success">✓ Firma registrada</p> : <p className="signature-status">⏳ Pendiente</p>}
      {error ? <p className="field-helper field-helper--error">{error}</p> : null}
      <Button type="button" variant="secondary" onClick={clearSignature} className="signature-clear-button">
        Limpiar firma
      </Button>
    </div>
  );
}

export function ExtraWorkerCard({
  index,
  control,
  errors,
  register,
  remove,
  setValue,
  validationAttempted,
}: {
  index: number;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  register: UseFormRegister<FormValues>;
  remove: (index: number) => void;
  setValue: UseFormSetValue<FormValues>;
  validationAttempted: boolean;
}) {
  const base = `extraWorkers.${index}` as const;
  const health = useWatch({ control, name: `${base}.salud` as const }) as SaludValue | undefined;
  const signatureValue = useWatch({ control, name: `${base}.signature` as const }) ?? "";

  return (
    <div className="soft-card compact-card">
      <div className="declaration-card__head worker-extra__head">
        <h3 className="declaration-card__title">TRABAJADOR {index + 2}</h3>
        <Button type="button" variant="ghost" onClick={() => remove(index)} className="worker-extra__remove">
          Eliminar
        </Button>
      </div>
      <div className="grid gap-6">
        <Field label="N° de identificación" error={getErrorByPath(errors, `${base}.identificacion`)?.message} {...register(`${base}.identificacion` as never)} placeholder="Solo números" />
        <SelectField label="¿Se encuentra en buen estado de salud?" error={getErrorByPath(errors, `${base}.salud`)?.message} {...register(`${base}.salud` as never)}>
          <option value="Seleccione una opcion">Seleccione una opcion</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </SelectField>
        {health === "No" ? (
          <TextareaField label="¿Qué dificultad presenta?" error={getErrorByPath(errors, `${base}.dificultad`)?.message} {...register(`${base}.dificultad` as never)} placeholder="Describe brevemente la condición o dificultad" />
        ) : null}
        {health === "No" ? (
          <div className="worker-warning" role="alert">
            <strong>Alerta:</strong> el trabajador no puede realizar la actividad en espacios confinados.
          </div>
        ) : null}
        <div className="signature-slot">
          <div className="mini-title">FIRMA DEL TRABAJADOR</div>
          <SignatureField
            value={signatureValue}
            error={getErrorByPath(errors, `${base}.signature`)?.message}
            onChange={(value) => setValue(`${base}.signature` as never, value as never, { shouldValidate: validationAttempted })}
            onClear={() => setValue(`${base}.signature` as never, "" as never, { shouldValidate: validationAttempted })}
          />
        </div>
      </div>
    </div>
  );
}

export function getErrorByPath(errors: Record<string, unknown>, path: string): { message?: string } | undefined {
  const parts = path.split(".");
  let current: unknown = errors;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as { message?: string } | undefined;
}

function parseSignaturePoints(value: string) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as number[][];
    if (!Array.isArray(parsed)) return {};
    return { restored: parsed } as Record<string, number[][]>;
  } catch {
    return {} as Record<string, number[][]>;
  }
}
