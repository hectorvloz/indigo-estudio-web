# Instalación en cPanel

## Generar el paquete

Para la raíz del dominio:

```sh
SITE_URL=https://tu-dominio.com npm run package:cpanel
```

Para una carpeta, por ejemplo `/indigo/`:

```sh
SITE_URL=https://tu-dominio.com SITE_BASE=/indigo/ npm run package:cpanel
```

Reemplazar `tu-dominio.com` por el dominio confirmado. `SITE_URL` genera las direcciones canónicas y las imágenes sociales absolutas. `SITE_BASE` ajusta enlaces, recursos y la página 404. El paquete entregado por defecto corresponde a la raíz y no presupone un dominio.

Resultado: **`artifacts/indigo-cpanel.zip`**. También queda el sitio sin comprimir en `dist/`.

## Subir

1. Respaldar la carpeta de destino si ya contiene una web.
2. En cPanel → Administrador de archivos, abrir la raíz asignada al dominio; suele ser `public_html/`. Para el ejemplo de subcarpeta, abrir `public_html/indigo/`.
3. Subir y extraer el ZIP allí. `index.html`, `_astro/`, `images/` y `proyectos/` deben quedar directamente en esa carpeta.
4. Activar “Mostrar archivos ocultos” y comprobar `.htaccess`. Si ya existía uno, revisar y combinar sus reglas con las del paquete antes de reemplazarlo.
5. Abrir la web con HTTPS. Probar menú, imágenes, proyectos, correo y WhatsApp. Una ruta inexistente debe mostrar la página 404.

No subir `src/`, `node_modules/`, archivos de pruebas ni la carpeta del proyecto completa.

## Actualizar y volver atrás

Editar el proyecto local, volver a generar el ZIP y reemplazar la versión del sitio. Conservar una copia anterior fuera de la carpeta pública. Para volver atrás, restaurar esa copia completa.

Los recursos de `_astro/` tienen caché prolongada porque sus nombres cambian con el contenido. HTML se revalida e imágenes se conservan un día; al reemplazar una imagen conviene cambiar su nombre.

## Alcance

- Hosting estático Apache/cPanel. No requiere PHP, Node, MySQL ni procesos permanentes.
- El formulario prepara un mensaje para WhatsApp. La persona lo envía en WhatsApp. No guarda datos ni envía correos desde el servidor.
- Audio sintetizado localmente, tras consentimiento. Tipografías alojadas localmente.
- No se ha publicado en un hosting. Las reglas Apache deben comprobarse al instalar, según los módulos habilitados por el proveedor.
