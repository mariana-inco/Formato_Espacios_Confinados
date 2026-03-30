# Formulario HSE - Documentación

## 📋 Estructura del Formulario

Componente completo desarrollado en **NextJS + React + Tailwind** sin dependencias externas de formularios.

---

## 🔹 VALIDACIONES IMPLEMENTADAS

### Nivel 1: Validaciones Requeridas (Críticas)
Se ejecutan en `handleSubmit()` antes de permitir envío:

- **lugar_fecha**: No puede estar vacío ❌
- **area**: No puede estar vacía ❌
- **centro_operacion**: No puede estar vacío ❌
- **trabajadores**: Mínimo 1 trabajador requerido ❌
- **responsable_nombre**: No puede estar vacío ❌

Si alguno de estos campos falta, muestra alerta con lista de errores.

### Nivel 2: Validaciones en Agregar
Se ejecutan cuando usuario intenta agregar trabajador o medición:

**Trabajador:**
- nombre: obligatorio
- identificacion: obligatoria

**Monitoreo:**
- resultado: obligatorio

---

## 📊 Estructura de Estados (useState)

```typescript
// SECCIÓN 1: Información General
seccion1: {
  lugar_fecha: string
  area: string
  permiso_a: string
  centro_operacion: string
  tiempo_solicitado: string
  hora_inicio: string (HH:mm)
  hora_fin: string (HH:mm)
  duracion_estimada: string
  descripcion_trabajo: string (textarea)
  herramientas: string (textarea)
}

// SECCIÓN 2: Trabajadores (Array dinámico)
trabajadores: Array<{
  nombre: string
  identificacion: string
  cargo: string
  estado_salud: boolean
  firma: string
}>

// SECCIÓN 3: Verificación (Array fijo de 22 items)
verificacion: Array<{
  descripcion: string (predefinida)
  respuesta: "SI" | "NO" | "NA"
}>

// SECCIÓN 4: Información Adicional
seccion4: {
  supervisor: string
  vigia: string
  trabajador_entrante: string
  jefe_area: string
  firma_supervisor: string
  firma_vigia: string
  firma_trabajador: string
  firma_jefe: string
}

// SECCIÓN 5: Monitoreo (Array dinámico)
monitoreo: Array<{
  tipo_medicion: string (O2, CO, SO2, H2S, CH4, OTRO)
  resultado: string | number
  fecha: string (ISO datetime)
  estado: "OK" | "ALERTA" | "NA"
}>

// SECCIÓN 6: Equipos
seccion6: {
  equipos_proteccion: string (textarea)
  equipos_rescate: string (textarea)
  otros: string (textarea)
}

// SECCIÓN FINAL
seccionFinal: {
  responsable_nombre: string
  responsable_cedula: string
  firma_responsable: string
}
```

---

## 📤 JSON de Salida

Al hacer submit con validaciones pasadas, genera:

```json
{
  "seccion_1_informacion_general": {...},
  "seccion_2_trabajadores_responsables": [...],
  "seccion_3_verificacion_diaria": [...],
  "seccion_4_informacion_adicional": {...},
  "seccion_5_monitoreo": [...],
  "seccion_6_equipos": {...},
  "seccion_final_responsable": {...},
  "metadata": {
    "fecha_generacion": "2026-03-27T13:45:30.000Z",
    "total_trabajadores": 2,
    "mediciones": 4
  }
}
```

Se imprime en console y se muestra alerta.

---

## 🎯 Funcionalidades

✅ **Gestión de Trabajadores**
- Agregar trabajador (validación de nombre + identificación)
- Eliminar trabajador
- Mostrar lista actual

✅ **Gestión de Monitoreo**
- Agregar medición (validación de resultado)
- Eliminar medición
- Mostrar lista actual

✅ **Campos Dinámicos**
- Todos los inputs actualizan estado en tiempo real
- Checkboxes para estado de salud
- Radio buttons para verificación diaria
- Select para tipo de medición y estado

✅ **Botones de Acción**
- ENVIAR FORMULARIO: Valida + genera JSON
- LIMPIAR: Recarga página (reset completo)

---

## 🔧 Instrucciones de Uso

1. Completar **Sección 1** (información general)
2. Agregar mínimo **1 trabajador** en Sección 2
3. Responder **todas las verificaciones** en Sección 3
4. Completar **nombres clave** en Sección 4
5. (Opcional) Agregar **mediciones** en Sección 5
6. (Opcional) Listar **equipos** en Sección 6
7. Ingresar **responsable final** en Sección Final
8. Click **ENVIAR FORMULARIO**

---

## 🚀 Ejecutar

```bash
npm run dev
# Abre http://localhost:3000
```

---

## 📝 Notas Técnicas

- Sin librerías de formularios (Formik, React Hook Form, etc)
- 100% React Hooks (useState)
- TypeScript completo
- Tailwind CSS (grid, spacing, colors)
- Validación básica (required, alerts)
- Consolelog con JSON formateado (pretty-print)
