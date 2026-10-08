# Patrona CAD

Estudio de patronaje experimental en React y TypeScript. Versión 0.2.

## Funciones

Cuerpo delantero y espalda y falda paramétrica; medidas y perfiles personales; selección y movimiento; edición de nodos y controles Bézier; guías, líneas, curvas y cotas; zoom; bloqueo y visibilidad; rotación y reflejo; duplicación y notas; historial; guardado local; importación y exportación JSON; SVG dimensional y PDF vectorial de prueba en A4 mosaico o lámina completa.

**Los patrones no están validados para confección hasta realizar pruebas físicas.** El cuerpo utiliza una aproximación geométrica simplificada. No incluye márgenes de costura. El PDF es experimental: imprimir al 100%, medir el control de 5 cm y comprobar el ajuste y montaje en una toile.

## Desarrollo

```sh
npm ci
npm run dev
npm test
npm run build
```

Los archivos compilados se generan en `dist`. Los proyectos se guardan en el navegador. Guardar JSON permite trasladarlos entre equipos y navegadores.

## Publicación en Vercel

Proyecto de destino: `patrona-cad`, id `prj_q4LJDXtYO0q9zYtwtEEenCE4wlrg`.

La configuración del repositorio indica Vite, instalación con `npm ci`, construcción con `npm run build` y salida `dist`. Conectar la rama `main` al proyecto existente para publicar los cambios. No se necesitan claves ni servicios externos para esta versión.
