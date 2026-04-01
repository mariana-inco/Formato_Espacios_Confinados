# Documentación del formulario HSE-F001

Este documento resume qué hace cada archivo y las funciones principales del formulario de trabajo en espacios confinados.

## Archivos principales

### `app/page.tsx`
Es la página principal del formulario.

Responsabilidades:
- Renderiza el formulario por secciones.
- Maneja el paso actual del wizard.
- Integra `react-hook-form` con Zod.
- Controla el avance y retroceso entre secciones.
- Genera el JSON final que se imprime por consola al enviar.
- Muestra las alertas de validación y las firmas.

### `app/utilidades-formulario.ts`
Contiene utilidades y constantes del formulario.

Responsabilidades:
- Define los pasos del formulario.
- Define los valores iniciales.
- Define los campos obligatorios que se validan por paso.
- Calcula la duración del trabajo.
- Limpia objetos vacíos antes de imprimir el JSON.
- Resume las firmas para que la consola no muestre el trazo completo.

### `app/componentes-formulario.tsx`
Contiene componentes reutilizables del formulario.

Responsabilidades:
- Renderiza campos de texto, textarea y select.
- Renderiza el contenedor de cada sección.
- Renderiza el componente de firma digital.
- Renderiza las tarjetas de trabajadores extra.
- Maneja la alerta cuando el trabajador no está apto.

### `app/hse-f001.schema.ts`
Contiene el esquema de validación con Zod.

Responsabilidades:
- Valida cada campo del formulario.
- Define mensajes de error.
- Valida que la salud del trabajador sea correcta.
- Valida firmas, declaración y campos obligatorios.

## Flujo general del formulario

1. El usuario llena la sección actual.
2. Al dar clic en `Siguiente`, se valida solo esa sección.
3. Si hay errores, no avanza.
4. Si no hay errores, pasa a la siguiente sección.
5. En la última sección, al dar clic en `Enviar formulario`, se arma un JSON limpio y organizado.
6. Ese JSON se imprime por consola.

## Funciones principales

### `calcularDuracion(inicio, fin)`
Archivo: [`app/utilidades-formulario.ts`](c:\Users\mariana.gomez\f001\app\utilidades-formulario.ts)

Qué hace:
- Recibe hora de inicio y hora de fin.
- Calcula la diferencia en horas.
- Devuelve un texto como `1.0 horas` o `2 horas`.

Dónde se usa:
- En el paso 1 del formulario.
- Para llenar automáticamente el campo `duracion`.

### `compactObject(value)`
Archivo: [`app/utilidades-formulario.ts`](c:\Users\mariana.gomez\f001\app\utilidades-formulario.ts)

Qué hace:
- Elimina campos vacíos del objeto.
- Quita `""`, `null` y `undefined`.

Dónde se usa:
- Al construir el JSON final.
- Sirve para que la consola quede limpia.

### `summarizeSignatureLink(label, signature)`
Archivo: [`app/utilidades-formulario.ts`](c:\Users\mariana.gomez\f001\app\utilidades-formulario.ts)

Qué hace:
- Convierte la firma en una versión resumida para consola.
- No imprime el trazo completo.
- Devuelve:
  - `registrado`
  - `enlace`
  - `puntos`

Dónde se usa:
- En el JSON final al enviar.
- Para mostrar firmas de forma legible.

### `nextStep()`
Archivo: [`app/page.tsx`](c:\Users\mariana.gomez\f001\app\page.tsx)

Qué hace:
- Valida los campos del paso actual.
- Si todo está bien, avanza al siguiente paso.
- Si hay errores, no deja avanzar.

### `prevStep()`
Archivo: [`app/page.tsx`](c:\Users\mariana.gomez\f001\app\page.tsx)

Qué hace:
- Regresa al paso anterior.
- No baja del paso 1.

### `onSubmit()`
Archivo: [`app/page.tsx`](c:\Users\mariana.gomez\f001\app\page.tsx)

Qué hace:
- Obtiene todos los valores del formulario.
- Arma el JSON final por secciones.
- Limpia vacíos.
- Resume firmas.
- Imprime el JSON por consola.

### `addWorkerEntry()`
Archivo: [`app/page.tsx`](c:\Users\mariana.gomez\f001\app\page.tsx)

Qué hace:
- Agrega un trabajador adicional.
- Crea un nuevo objeto vacío en `extraWorkers`.

### `Field`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Renderiza un campo de texto reutilizable.
- Puede funcionar como input normal.
- Muestra errores y textos de ayuda.

### `TextareaField`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Renderiza un textarea reutilizable.
- Se usa en observaciones, descripciones y comentarios.

### `SelectField`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Renderiza un select reutilizable.
- Se usa para campos como área y salud.

### `SignatureField`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Captura la firma digital.
- Ajusta el tamaño del canvas.
- Guarda los puntos de la firma.
- Recupera la firma al volver a una sección.
- Limpia la firma si el usuario lo pide.

### `ExtraWorkerCard`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Renderiza cada trabajador adicional.
- Muestra identificación, salud, dificultad y firma.
- Muestra una alerta si la salud es `No`.
- Permite eliminar el trabajador adicional.

### `SectionGroup`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Agrupa campos visualmente dentro de una misma sección.
- Muestra título y descripción.

### `getErrorByPath(errors, path)`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Busca un error dentro del objeto de errores del formulario.
- Permite mostrar el mensaje correcto en el campo correcto.

### `parseSignaturePoints(value)`
Archivo: [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)

Qué hace:
- Convierte la firma guardada en texto a puntos.
- Permite reconstruir la firma cuando el usuario regresa a la sección.

## Validaciones importantes

### Validación por sección
- No deja pasar al siguiente paso si la sección actual tiene errores.

### Validación del trabajador
- Si marca `No` en salud, se muestra la alerta:
  - `El trabajador no puede realizar la actividad en espacios confinados`

### Validación de firmas
- La firma del trabajador, HSE y responsable son obligatorias.

### Validación de declaración
- Se debe aceptar la declaración para poder continuar.

## Salida por consola

Al enviar, el formulario imprime un JSON:
- organizado por secciones
- sin campos vacíos
- con firmas resumidas

## Estructura recomendada para leer el código

Si quieres entenderlo rápido, léelo en este orden:
1. [`app/utilidades-formulario.ts`](c:\Users\mariana.gomez\f001\app\utilidades-formulario.ts)
2. [`app/componentes-formulario.tsx`](c:\Users\mariana.gomez\f001\app\componentes-formulario.tsx)
3. [`app/hse-f001.schema.ts`](c:\Users\mariana.gomez\f001\app\hse-f001.schema.ts)
4. [`app/page.tsx`](c:\Users\mariana.gomez\f001\app\page.tsx)

