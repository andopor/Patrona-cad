# Patrona CAD 0.6 · versión unificada

Aplicación: https://patrona-cad.vercel.app/

Este directorio es la fuente principal. Reúne el editor avanzado de dibujo y capas con la biblioteca de patrones. Las dos variantes anteriores están respaldadas en `recuperacion-2026-10-08/`.

- Editor SVG con contornos rectos y Bézier, puntos suaves/simétricos, inserción exacta, borrado, lápiz y anotaciones editables.
- Capas con orden, opacidad, visibilidad, bloqueo e imágenes de referencia para calcar.
- Medidas y perfiles, cuerpo delantero/espalda y falda base; 24 referencias de prendas y 14 generadores FreeSewing 4.10.2.
- Importación SVG/DXF con selección de contornos, unidades y calibración.
- Márgenes por pieza, piquetes y comparación de tramos de costura.
- Biblioteca personal con modelos, componentes, fotos e instrucciones. Guardado local e intercambio de colecciones JSON.
- Proyectos JSON compatibles con las dos variantes 0.4; undo/redo. Exportación SVG/PDF/DXF dimensional de capas visibles, sin imprimir las fotos de referencia.

Patrones experimentales: revisar escala, márgenes, lomo y montaje, y probar una toile. No hay certificación física ni sincronización en la nube. Guarda copias JSON para conservar tu trabajo.

## Dibujo y reglas · 0.6

Guías horizontales y verticales por selector, posición numérica y clic sobre las reglas de los ejes. Lápiz con suavizado configurable. Círculos, rectángulos y polígonos regulares de 3–24 lados. Restricciones horizontal, vertical y 45°; Shift perpendicular/cuadrado/radio entero, Ctrl/⌘ 45°, Alt suspende el imán. Ajuste a rejilla de 0,5 cm, guías, vértices y bordes visibles.

Útiles: regla de 30 cm, escuadra de 45°, cartabón de 30°/60°, curva francesa y curva de cadera. Se colocan, arrastran, giran, escalan y bloquean. «Trazar borde elegido» copia su geometría al dibujo. Son plantillas orientativas propias; no se imprimen. Se guardan en JSON.

«Eliminar objeto», Suprimir y Retroceso borran piezas, trazos, guías, útiles e imágenes desbloqueadas. Deshacer recupera el objeto. En Contorno, Retroceso/Suprimir quita el último punto de un trazado aún no guardado. No actúan mientras escribes en un campo.

## Desarrollo

`npm ci`, `npm test`, `npm run build`, `npm run dev`.

Las dependencias de los generadores se cargan bajo demanda en un worker. Los módulos de importación y modelos se cargan al abrir sus herramientas.

## Publicación

Seguir `VERSIONES.md`: inspeccionar fuentes locales y despliegues externos, comprobar `release-state.json`, probar vista previa y volver a verificar la producción antes de actualizarla. `scripts/prepare-release.mjs` genera la identidad de fuentes y `public/version.json`. Usar los mismos archivos comprobados para vista previa y producción. No hace falta escritura en GitHub.

Licencias en `THIRD_PARTY_NOTICES.md` y `/licencias.html`.

### iPad y lienzo completo

Pulsa «Pantalla completa» junto a Encajar para dedicar la ventana al dibujo. «Salir de pantalla completa» recupera los paneles. Dos dedos permiten acercar, alejar y desplazar la vista en ambos modos; un dedo o el Pencil usa la herramienta seleccionada. Safari puede mantener sus barras: el modo ocupa toda la ventana disponible sin depender de permisos de pantalla completa.

### Ayuda y paneles en pantalla completa

La ayuda inferior tiene «Minimizar» y «Mover» (cuatro esquinas); se recuerda por navegador. En pantalla completa abre Útiles, Capas, Propiedades o Validación; el panel permite editar sin salir del lienzo. «Cerrar panel» vuelve al dibujo manteniendo su zoom.

### Imán y Apple Pencil (0.9)

«Imán y Pencil» configura objetivos (vértices, medios, centros de caja, bordes, guías e intersecciones), radio en pantalla y paso de rejilla. El giro se realiza con el círculo ↻, por ángulo, o con dos dedos al activar «Transformar útil seleccionado» y Seleccionar. «Permitir cambiar tamaño» está desactivado inicialmente.

En Útiles, «Seguir este borde con Lápiz / Pencil» conserva un tramo exacto de la regla: empezar cerca y recorrer hasta el extremo deseado. Imán y Pencil permite volver a dibujo libre. La opción «Solo Pencil» reserva dedos para navegar y evita contactos de mano que dibujen; las entradas de palma durante un trazo del Pencil se ignoran. Presión e inclinación afectan solo al grosor del boceto si Safari proporciona los datos. Los eventos agrupados se procesan para conservar muestras; estabilización y suavizado son configurables. La geometría de corte no depende del grosor.

Compatibilidad: WebKit publica Pointer Events con presión/inclinación y, desde Safari 18.2, eventos coalescentes: https://webkit.org/blog/16301/webkit-features-in-safari-18-2/. Doble toque/squeeze de Pencil usan APIs nativas de Apple; no están integrados en esta aplicación web. Pruebas del controlador cubren secuencias de dedos/Pencil y cancelación; requieren comprobación adicional en un iPad físico.

## Archivo de proyectos · v0.10

`Mis proyectos` abre la galería local con miniaturas, búsqueda por nombre/etiqueta/carpeta, duplicación y papelera reversible. `Nuevo en blanco` crea un proyecto independiente y guarda antes el actual. Abrir JSON o un modelo completo también crea un proyecto nuevo, conservando el anterior.

La base IndexedDB `patrona-cad.projects` separa las fichas (`projects`), el contenido completo (`documents`), versiones (`versions`) y el identificador activo (`settings`). La primera apertura migra el proyecto anterior desde `patrona-cad.project.v2` sin borrar esa copia. Las siguientes aperturas recuperan el proyecto activo de IndexedDB. Las bibliotecas de modelos, perfiles y preferencias anteriores conservan su almacenamiento.

El autoguardado tiene una espera de 500 ms tras editar y escribe ficha y contenido en una transacción. Cambiar de proyecto, crear uno, abrir la galería o guardar una versión espera a que termine el guardado pendiente. Al ocultar la pestaña se intenta guardar inmediatamente. No se garantiza finalizar una escritura si el sistema cierra el navegador de forma abrupta antes de completarla; el estado muestra si hay cambios pendientes. Una escritura fallida conserva el último guardado y muestra el error. Los errores de apertura bloquean el editor y permiten descargar el JSON de recuperación.

Cada escritura comprueba la revisión del proyecto. Si otra pestaña la cambió, el editor conserva ambas copias y continúa en una copia por conflicto. El historial permanente admite 100 hitos manuales y 20 recuperaciones automáticas; estas conservan el estado previo al editar después de cinco minutos desde el último punto automático. Restaurar crea antes un hito con el estado actual. Deshacer/Rehacer pertenece a la sesión del proyecto abierto y se reinicia al cambiar de proyecto.

Los proyectos son locales al dispositivo, navegador y dominio. La versión 0.10 no incluía cuenta; la 0.11 añade las copias privadas descritas abajo. Descargar JSON conserva el dibujo, fotos, capas, medidas y geometría; las versiones y etiquetas de la galería son independientes del JSON del patrón. El navegador puede borrar sus datos locales: conserva copias JSON externas de los trabajos importantes. La papelera no elimina permanentemente datos.

Pruebas: `tests/project-archive.test.mjs` usa IndexedDB simulado para transacciones, migración, abortos, revisiones simultáneas y retención; también ejecuta el controlador React del archivo para comprobar guardado al cambiar, restauración y copias por conflicto. Verificación adicional desde el navegador con IndexedDB real.

## Copias privadas en nube (0.11)

Nube → introducir correo → abrir el enlace de acceso en el mismo navegador → Guardar actual / Guardar todos. La copia incluye proyecto editable, fotos, carpetas, etiquetas e historial. Recuperar crea un proyecto local nuevo y conserva los originales. Copia automática optativa cada dos minutos, solo con la aplicación abierta y conectada. Perfiles y Mis modelos permanecen locales. No es sincronización bidireccional ni fusión entre dispositivos.

Configuración: copiar `.env.example` a `.env.local` y establecer URL + clave publicable; nunca usar service_role. Esquema desplegado registrado en `supabase/schema.sql`, RLS con SELECT/INSERT solo del propietario; sin UPDATE/DELETE. Retorno de acceso limitado a las URLs configuradas. El correo integrado de Supabase puede restringir destinatarios y frecuencia; para usuarios externos se requiere configurar SMTP propio. Copias hasta 12 MB incluyendo historial; no se eliminan copias automáticamente ni se ocultan fallos de cuota.
