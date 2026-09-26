# Indigo Estudio

Web estática con Astro, TypeScript y CSS. Lista para alojar en cPanel mediante archivos HTML, sin Node ni base de datos en el servidor.

## Trabajar en local

Requisitos: Node compatible con Astro 7 (desarrollo verificado con Node 25), npm y Python 3 para empaquetar.

```sh
npm ci
npm run dev
```

Abrir la dirección que muestre la terminal. En esta revisión: `http://localhost:4321`.

```sh
npm run check
npx playwright install chromium
npm test
npm run package:cpanel
```

Las pruebas usan el servidor local en el puerto 4321. `TEST_URL` permite probar otra dirección local. `CHROMIUM_PATH` permite usar un ejecutable de Chromium ya instalado. `VISUAL=1 npm test` guarda capturas en `artifacts/revision/`.

## Editar contenido

| Contenido | Archivo |
| --- | --- |
| Contacto y navegación | `src/data/site.ts` |
| Proyectos, imágenes y textos | `src/data/projects.ts` |
| Portada, servicios y estudio | `src/pages/index.astro` |
| Intro y menú | `src/components/` |
| Colores, tipografía y animación | `src/styles/global.css` |
| Recursos públicos | `public/images/` |

Paleta aprobada: amarillo **#F1C844**, negro **#050505** y crema **#F5F1EA**. El logo aprobado se conserva negro; se invierte sobre fondos oscuros.

**Portafolio provisional:** Indigo es un proyecto propio con visualización conceptual. Ritmo y Materia son exploraciones ficticias, identificadas en la interfaz. Sustituirlas por casos reales antes del lanzamiento comercial si no se desean publicar como exploraciones.

Ver [instalación en cPanel](docs/instalacion-cpanel.md) y [estado de implementación](docs/implementacion-web.md).
