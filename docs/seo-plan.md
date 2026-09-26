# Plan SEO — Indigo Estudio

## Objetivo

Preparar `https://estudioindigo.com.co` para rastreo, indexación y presentación competitiva en búsquedas relacionadas con branding, diseño gráfico, diseño web y estudios creativos en Colombia, manteniendo la voz editorial actual.

## Fase 1 — Base técnica

- [x] Fijar dominio, idioma y URLs canónicas absolutas.
- [x] Generar `robots.txt` y sitemap XML con páginas e imágenes.
- [x] Redirigir HTTP y `www` al dominio canónico.

**Aceptación:** todas las URLs indexables usan HTTPS, terminan en `/` y aparecen una sola vez en el sitemap.

## Fase 2 — Metadatos y resultados sociales

- [x] Crear títulos y descripciones únicos por ruta.
- [x] Completar Open Graph, Twitter Cards, robots y previews de imagen.
- [x] Marcar 404 y páginas no comerciales cuando corresponda.

**Aceptación:** cada página indexable tiene title, description, canonical, OG y Twitter absolutos.

## Fase 3 — Datos estructurados

- [x] Añadir `Organization` y `WebSite` a la portada.
- [x] Añadir colección y servicios a sus páginas.
- [x] Añadir `CreativeWork` y breadcrumbs a cada caso de estudio.

**Aceptación:** cada bloque JSON-LD es válido, refleja contenido visible y no inventa dirección, reseñas ni premios.

## Fase 4 — Imágenes y contenido

- [x] Auditar `alt`, dimensiones, carga, decodificación y prioridad.
- [x] Incluir imágenes de proyecto en el sitemap con títulos y descripciones.
- [x] Reforzar enlaces internos y contexto semántico sin cambiar el lenguaje de marca.

**Aceptación:** ninguna imagen informativa carece de descripción y las decorativas conservan `alt=""`.

## Fase 5 — Producción y seguimiento

- [x] Ejecutar comprobación de Astro, build y pruebas SEO estáticas.
- [x] Revisar dependencias y artefactos de cPanel.
- [x] Documentar alta en Search Console, envío de sitemap y medición mensual.

**Aceptación:** build limpio, sitemap/robots presentes y lista de lanzamiento accionable.

## Riesgos

- Google decide si indexa y cómo muestra cada resultado; las señales técnicas no garantizan posiciones.
- No se inventarán datos legales, dirección física, perfiles sociales ni credenciales de Search Console.
- Los metadatos EXIF/IPTC no sustituyen nombres descriptivos, `alt`, contenido cercano y datos estructurados.
