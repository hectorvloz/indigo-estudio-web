# Publicación SEO de Indigo Estudio

## Dominio canónico

- URL principal: `https://estudioindigo.com.co/`
- Sitemap: `https://estudioindigo.com.co/sitemap.xml`
- Robots: `https://estudioindigo.com.co/robots.txt`
- Las variantes HTTP y `www` redirigen a la URL principal desde `.htaccess`.

## Alta en Google Search Console

1. Crear una propiedad de dominio para `estudioindigo.com.co`.
2. Verificarla mediante el registro TXT que entregue Google en el DNS del dominio.
3. En **Sitemaps**, enviar `https://estudioindigo.com.co/sitemap.xml`.
4. En **Inspección de URLs**, revisar y solicitar indexación para:
   - `https://estudioindigo.com.co/`
   - `https://estudioindigo.com.co/proyectos/`
   - `https://estudioindigo.com.co/servicios/`
   - `https://estudioindigo.com.co/estudio/`
5. Volver a revisar **Indexación de páginas** y **Mejoras** después de que Google rastree el sitio.

## Presencia local

Si Indigo atiende clientes con una ubicación o área de servicio pública, crear o completar el Perfil de Empresa de Google con el nombre, teléfono, sitio y horarios reales. No publicar una dirección privada solo para posicionar.

## Medición mensual

- Consultas y páginas con impresiones, clics, CTR y posición media.
- Cobertura del sitemap y motivos de exclusión.
- Core Web Vitals y problemas de experiencia móvil.
- Proyectos que atraen búsquedas por branding, identidad visual, diseño editorial y diseño web.
- Títulos o descripciones con impresiones y CTR bajo que convenga mejorar con datos reales.

## Comprobación antes de subir

```bash
npm run check
npm run build
npm run seo:check
```

El posicionamiento depende también de autoridad, menciones, competencia y tiempo de rastreo. Esta implementación deja la base técnica lista para que Google pueda descubrir, interpretar y presentar el sitio correctamente.
