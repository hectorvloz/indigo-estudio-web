# Instrucciones para agentes (Codex, Claude, etc.)

Sitio web de Indigo. Estudio Creativo (Colombia), estudioindigo.com.co. Dueño: Héctor. Responde en español colombiano, claro y directo, sin emojis en código, interfaces ni documentación.

Este proyecto trabaja junto con **Infocus CRM** (`/Volumes/Dev/Proyectos/Infocus/crm oficial codigo`, que tiene su propio `AGENTS.md`). Si una tarea toca los dos, lee también ese archivo. Cada proyecto es un repo de git aparte: haz commits separados.

## Lo esencial

- Astro 7 + TypeScript + CSS, sitio estático. Repo `hectorvloz/indigo-estudio-web`, rama `main`.
- `dist/` SE COMMITEA: cPanel copia `dist/` a `public_html` con `.cpanel.yml` al hacer "Update from Remote". Antes de commitear un cambio visible, corre `npm run build` y commitea también `dist/`.
- Verificar: `npm run check`, `npm run seo:check`, `npm test` (Playwright, servidor local en el puerto 4321).
- Dónde está cada contenido: tabla en `README.md`. Paleta: amarillo #F1C844, negro #050505, crema #F5F1EA. Logo negro (se invierte sobre oscuro). Tono y diseño: `docs/voz-y-lenguaje.md`, `docs/direccion-visual.md`.
- El hosting no tiene terminal (solo SFTP por SSH, puerto 2200, usuario `indigo`). Nada de comandos en el servidor.

## Agenda de asesorías (`/asesoria/`)

- Página `src/pages/asesoria.astro` + API PHP en `public/api/asesoria/` (`slots.php` horarios libres, `book.php` crea el evento en Google Calendar con Meet, `lib.php` utilidades).
- La configuración real vive FUERA de la web: `/home/indigo/indigo-config/asesoria.php` (credenciales de Google, `infocus_url`, `infocus_token`). Nunca la pongas en el repo. Guía completa: `docs/asesoria-setup.md`.
- Integración con Infocus: `book.php` envía cada reserva como lead a `{infocus_url}/webhooks/leads` con `Authorization: Bearer {infocus_token}`. Ese token es `LEADS_WEBHOOK_TOKEN` del `.env` de Infocus (`LeadsWebhookController`). Si cambias el formato del lead, cambia los dos lados y sus tests (`tests/Feature/LeadsWebhookTest.php` en Infocus).

## Reglas de trabajo

- Cambios quirúrgicos; no rediseñes lo que no se pidió. Conserva la identidad visual y el tono.
- Nunca subas secretos. No commitees `.claude/`, `.impeccable/`, `output/`, `tmp/` ni `artifacts/`.

## Pendientes conocidos

- Llenar en el servidor los valores `PEGAR_CLIENT_ID`, `PEGAR_CLIENT_SECRET`, `PEGAR_REFRESH_TOKEN` de `asesoria.php` (refresh token con `python3 scripts/google_oauth.py CLIENT_ID CLIENT_SECRET`) y probar una reserva de punta a punta (debe llegar a Google Calendar, al correo y a Infocus → Leads).
- Pendientes de Infocus y del MCP: `docs/MCP_PROGRESO.md` en el repo de Infocus.
