# Patrona CAD: versión unificada 0.6

Carpeta principal: este proyecto `12 Patrona_CAD`. No publicar desde la carpeta antigua de ChatGPT.

## Fuentes preservadas

- Editor avanzado 0.4: capas, fotos, contornos Bézier, puntos suaves/simétricos, inserción y borrado, trazos editables.
- Biblioteca 0.4: 24 referencias, 14 generadores FreeSewing, importación SVG/DXF, modelos propios, márgenes, piquetes y comparación de costuras.
- Copias inmutables en `recuperacion-2026-10-08/`, con manifiestos SHA-256. No sustituirlas.

## Antes de cada publicación

1. Revisar la carpeta local y otras versiones del proyecto; comprobar cambios y fecha de las fuentes.
2. Consultar el alias `patrona-cad.vercel.app` y los despliegues del proyecto `prj_q4LJDXtYO0q9zYtwtEEenCE4wlrg`. Comparar con `release-state.json`. Si cambió la producción, investigar e incorporar la evolución antes de reemplazarla.
3. Ejecutar pruebas y compilación. Preparar `version.json` y un manifiesto de las fuentes y artefactos con `node scripts/prepare-release.mjs`.
4. Publicar primero una vista previa y probar generación, importación, capas, edición, guardado y exportaciones. Verificar móvil y escritorio.
5. Volver a consultar el alias inmediatamente antes de producción. Detener la publicación si no coincide con la versión registrada.
6. Publicar exactamente los archivos de la vista previa comprobada, sin recompilar entre ambas. Registrar IDs, enlaces y huellas en `release-state.json`.

Este control se aplica a nuestro procedimiento de publicación; una publicación desde otro lugar sigue necesitando esta misma coordinación. No depende de GitHub ni cambia permisos de Vercel.

## Compatibilidad y límites

Los JSON schemaVersion 2 de ambas ramas son importables. Los de biblioteca sin capas reciben una capa de dibujo. Las piezas añadidas se asignan a una capa nueva; no retienen referencias a capas ajenas. El JSON conserva fotos y datos completos; SVG/PDF/DXF excluyen las fotos y capas ocultas o con opacidad cero. Los patrones siguen siendo experimentales y requieren comprobación física.

## Evolución 0.6

Partiendo de 0.5 se añaden guías explícitas, reglas X/Y, suavizado, formas regulares y restricciones de dibujo, imán, útiles de costura transformables y borrado uniforme. `draftingAids` es opcional para mantener compatibilidad; los útiles se excluyen de exportación. El respaldo 0.5 se conserva intacto.

## Evolución 0.7

Modo de lienzo a pantalla completa compatible con Safari sin depender de la API Fullscreen. Dos dedos amplían y desplazan la vista en ambos modos; un dedo y el Pencil conservan la herramienta activa. Los gestos de vista no se guardan como cambios de geometría. Se conservan los respaldos anteriores.

## Evolución 0.8

Ayuda minimizable y situada en cualquiera de las cuatro esquinas; preferencia local independiente del JSON. Capas, útiles, propiedades y validación se abren en un panel superpuesto dentro del modo completo. Cerrar el panel conserva la vista y no altera la geometría.

## Evolución 0.9

Imán por objetivos, radio en píxeles y retención del objetivo para evitar saltos. Índice de geometría visible reutilizado por proyecto. Manejador de giro alrededor del centro del útil y gesto de dos dedos en modo Transformar útil; tamaño bloqueado salvo opción explícita. Seguir borde guarda un subtramo Bézier exacto. Solo Pencil, estabilización, muestras coalescentes, presión e inclinación opcionales para grosor de boceto. JSON conserva presión; SVG/PDF conservan grosores; DXF conserva líneas centrales. Doble toque y squeeze nativos no se emulan ni se anuncian como disponibles.

## Evolución 0.10

Archivo de proyectos con IndexedDB, migración no destructiva del guardado anterior, galería con miniaturas y carpetas/etiquetas, creación en blanco, duplicación, búsqueda y papelera reversible. Autoguardado transaccional, guardado pendiente antes de cambiar de proyecto, historial permanente manual/automático y copia previa a restaurar. Revisión optimista y copia de conflicto para dos pestañas. Abrir JSON o modelos completos crea proyectos independientes. Conserva las herramientas y bases anteriores. El archivo es local al navegador y dominio; la sincronización en la nube aún no está conectada.

## Evolución 0.11

Copias privadas en Supabase con acceso por correo, RLS por propietario, almacenamiento inmutable e inserciones idempotentes por SHA-256. Copia actual o de todos los proyectos locales no eliminados, historial y fotos incluidos. Copia automática optativa del actual cada dos minutos mientras la aplicación está abierta y conectada; reintento al recuperar conexión. Recuperación transaccional como proyecto nuevo con remapeo completo del historial. El archivo local sigue siendo la fuente de edición; no hay fusión automática entre dispositivos. Hasta 12 MB por copia y almacenamiento total según plan. Perfiles independientes y Mis modelos permanecen locales. Ninguna clave secreta en el navegador.

## Evolución 0.12

La galería admite búsqueda por varias palabras sobre nombre, etiquetas y carpeta, sin exigir tildes (la ñ sigue siendo distinta). Añade orden por fecha o nombre, recuento, limpieza de filtros y carpetas propias de la papelera. Los atajos del editor pasan a un único controlador: quedan en pausa al escribir o con un diálogo abierto y mantener Suprimir no borra una serie de objetos. La versión mostrada se obtiene de package.json.
