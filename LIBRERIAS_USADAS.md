# Librerías usadas en el proyecto

Este archivo describe las librerías instaladas y cómo se usan dentro del proyecto.

## Dependencias principales

### `next` (16.2.1)
- Framework principal del proyecto.
- Controla el enrutamiento, rendereo y generación de la aplicación.
- Se usa en `app/layout.tsx`, `app/page.tsx`, y en la configuración del proyecto.

### `react` (19.2.4)
- Librería de UI utilizada en todos los componentes.
- Se utiliza para hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`) y JSX.
- Archivos clave: `app/page.tsx`, `app/seccion-monitoreo-ambiental.tsx`, `app/componentes-formulario.tsx`.

### `react-dom` (19.2.4)
- Librería de renderizado de React en navegador.
- Utilizada internamente por Next.js.

### `react-hook-form` (^7.72.0)
- Manejo del formulario principal y validación de campos.
- Hooks usados: `useForm`, `useFieldArray`, `useWatch`, `register`, `setValue`.
- Archivos clave: `app/page.tsx`, `app/seccion-monitoreo-ambiental.tsx`, `app/componentes-formulario.tsx`.

### `@hookform/resolvers` (^5.2.2)
- Conecta `react-hook-form` con la librería de validación `zod`.
- Se usa en `app/page.tsx` con `zodResolver(esquemaFormulario)`.

### `zod` (^4.3.6)
- Definición de esquemas y reglas de validación para los datos del formulario.
- Archivos clave: `app/hse-f001.schema.ts`, `app/utilidades-formulario.ts`.

### `@uiw/react-signature` (^1.3.4)
- Librería para capturar firmas digitales en un canvas.
- Se usa en `app/componentes-formulario.tsx` dentro del componente `CampoFirma`.

## Dependencias de desarrollo

### `typescript` (^5)
- Motor de tipado estático.
- Define tipos para React, formulario y estructura de datos.
- Archivos clave: todos los `.ts` y `.tsx` del proyecto.

### `eslint` (^9)
- Linter de JavaScript/TypeScript.
- Se usa para mantener el código consistente y detectar errores estáticos.

### `eslint-config-next` (16.2.1)
- Reglas de ESLint recomendadas para Next.js.
- Configura el linter para estándares específicos del framework.

### `tailwindcss` (^4)
- Se usa para construir los estilos globales y wrappers CSS.
- Configuración principal en `app/globals.css`.

### `@tailwindcss/postcss` (^4)
- Plugin para integrar Tailwind con PostCSS en el pipeline de compilación.

### `@types/node`, `@types/react`, `@types/react-dom`
- Tipos de TypeScript para Node.js y React.
- Usados por el compilador TypeScript para mejorar autocompletado y validación.

## Cómo están conectadas estas librerías

- `next` ejecuta la aplicación React y carga los archivos dentro de `app/`.
- `react` y `react-dom` permiten renderizar componentes de UI.
- `react-hook-form` controla todo el formulario y sus estados.
- `@hookform/resolvers` adapta el esquema de validación de `zod` a `react-hook-form`.
- `zod` valida los datos y define la forma esperada del formulario.
- `@uiw/react-signature` captura firmas y devuelve una representación en formato texto.
- `tailwindcss` aporta las utilidades CSS usadas en `app/globals.css`.

## Resumen rápido por archivo

- `app/page.tsx`: Formulario principal, pasos, validación, submit.
- `app/seccion-monitoreo-ambiental.tsx`: Sección de monitoreo con tomas, firmas y tabla resumen.
- `app/componentes-formulario.tsx`: Componentes reutilizables, incluyendo firma digital.
- `app/hse-f001.schema.ts`: Definición de validación con `zod`.
- `app/utilidades-formulario.ts`: Valores iniciales, helpers y utilidades de formulario.
- `app/globals.css`: Estilos globales y layout.
