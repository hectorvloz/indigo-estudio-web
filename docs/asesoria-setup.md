# Agenda de asesorías: configuración

La página `/asesoria/` agenda reuniones de 30 minutos en Google Calendar con enlace de Google Meet. Al terminar el formulario:

- Google le envía la invitación al cliente.
- A `hola@estudioindigo.com.co` llega un correo con los datos del lead.
- La reserva queda en `/home/indigo/indigo-config/leads.jsonl`.

Hay que hacer esta configuración una sola vez.

## 1. Cuenta de Google de la agenda

La agenda usa **indigoestudioo@gmail.com**, la misma cuenta que tiene conectada Infocus. Así cada cita aparece una sola vez en Google Calendar y en Infocus → Reuniones.

1. Abre Google Calendar con esa cuenta y verifica que la zona horaria sea **(GMT-05:00) Bogotá**.
2. Las invitaciones a los clientes salen con ese Gmail como organizador. Los avisos de cada lead llegan a `hola@estudioindigo.com.co` (`notify_email`).

## 2. Proyecto en Google Cloud

1. Entra a <https://console.cloud.google.com> con `indigoestudioo@gmail.com` y crea un proyecto llamado `Indigo Agenda`.
2. En **APIs y servicios → Biblioteca**, activa **Google Calendar API**.
3. En **Pantalla de consentimiento de OAuth**, elige el tipo **Externo**, nombre `Indigo Agenda` y correo `indigoestudioo@gmail.com`.
4. Agrega estos permisos: `.../auth/calendar.events` y `.../auth/calendar.freebusy`.
5. Pulsa **Publicar aplicación** (estado *En producción*). Si la dejas en *Prueba*, la autorización vence a los 7 días. Google mostrará "app no verificada"; para uso propio es normal y no necesita verificación.
6. En **Credenciales → Crear credenciales → ID de cliente de OAuth**, elige **App de escritorio** y copia el *Client ID* y el *Client secret*.

## 3. Autorizar la cuenta (en tu Mac)

```bash
python3 scripts/google_oauth.py CLIENT_ID CLIENT_SECRET
```

Se abre el navegador. Entra con `indigoestudioo@gmail.com` y acepta. Si aparece "app no verificada", ve a **Configuración avanzada → Ir a Indigo Agenda**. Al terminar, la terminal imprime el contenido del archivo de configuración.

## 4. Subir la configuración a cPanel

1. En el **Administrador de archivos**, crea la carpeta `/home/indigo/indigo-config/`, **fuera** de `public_html`.
2. Crea dentro el archivo `asesoria.php` y pega lo que imprimió la terminal.
3. Cambia los permisos del archivo a `600` y los de la carpeta a `700`.

Opcional, en ese mismo archivo:

- `'blocked_times' => ['09:00', '12:00', '12:30', '16:30']` define las horas que no se ofrecen y que se muestran tachadas.
- `'notify_email'` es el correo donde llegan los leads.

## 5. Probar

1. Abre `https://estudioindigo.com.co/asesoria/` y agenda una cita de prueba con otro correo.
2. Verifica que te llegue el correo del lead, que el cliente reciba la invitación con el enlace de Meet y que el evento aparezca en tu calendario.
3. Borra el evento de prueba.

Para bloquear un día completo (por ejemplo, un festivo o unas vacaciones), crea un evento "Ocupado" en tu Google Calendar. La agenda deja de ofrecer esas horas automáticamente.

## Conectar con Infocus CRM

Cada asesoría agendada llega a Infocus como lead: etapa *Posible cliente*, origen *Landing asesoría*, nota con la marca, el tipo de web, el WhatsApp y el UTM, y la reunión con el enlace de Meet en su agenda. Por eso también aparece en **Reuniones** de Infocus.

1. Genera un token largo y aleatorio. Es el mismo valor para los dos sitios:

   ```bash
   python3 -c "import secrets;print(secrets.token_urlsafe(32))"
   ```

2. En el `.env` de Infocus agrega `LEADS_WEBHOOK_TOKEN=el-token` y ejecuta `php artisan config:clear`.
3. En `/home/indigo/indigo-config/asesoria.php` (el archivo de configuración de la landing) agrega:

   ```php
   'infocus_url' => 'https://proyecto.estudioindigo.com.co',
   'infocus_token' => 'el-token',
   ```

4. Agenda una cita de prueba y revisa que el lead aparezca en Infocus → Leads y la reunión en Infocus → Reuniones.

Detalles:

- **Correo ya registrado:** si la persona ya existe en Infocus, no se crea otro lead. La reunión y la nota se agregan al lead existente, sin cambiarle la etapa.
- **Sin duplicados:** si la misma reserva llega dos veces, no se duplica. Y si Infocus está conectado al mismo Google Calendar, la reunión aparece una sola vez en Reuniones.
- **Si Infocus no responde:** la reserva igual queda hecha. El error queda en el log de PHP y el lead se conserva en `leads.jsonl`.

## Pixel de Meta

Cuando tengas el ID del Pixel, agrega `PUBLIC_META_PIXEL_ID=...` al archivo `.env`, vuelve a generar el sitio (`npm run build`) y súbelo.

El Pixel solo se carga si el visitante acepta las cookies de publicidad. Estos son los eventos que envía:

| Evento | Cuándo se envía |
| --- | --- |
| `PageView` | Al cargar la página |
| `AsesoriaDatos` | Al completar el paso 1 |
| `AsesoriaHorario` | Al escoger una hora |
| `Schedule` y `Lead` | Al agendar |

Para optimizar la campaña en Meta, usa **Schedule** como evento de conversión.

## Meta Conversions API (Lead desde el servidor)

Cuando alguien agenda, `book.php` también envía el evento **Lead** a Meta desde el servidor, con el correo, el WhatsApp y el primer nombre cifrados (SHA-256). Así la reserva cuenta aunque el visitante no haya aceptado cookies. El navegador y el servidor usan el mismo `event_id`, así que Meta la cuenta una sola vez.

Configuración, una sola vez:

1. En el **Administrador de eventos** de Meta, abre el conjunto de datos **Indigo Web** (píxel `2471341196727166`) → **Configuración** → **API de conversiones** → **Generar token de acceso**. Copia el token y no lo compartas por chat.
2. En cPanel, edita `/home/indigo/indigo-config/asesoria.php` y agrega dentro del arreglo:

   ```php
   'meta_pixel_id' => '2471341196727166',
   'meta_capi_token' => 'PEGAR_TOKEN_DE_CONVERSIONS_API',
   // Opcional para probar: código de la pestaña "Probar eventos" del Administrador de eventos. Quítalo después.
   // 'meta_test_event_code' => 'TEST12345',
   ```

3. Haz una reserva de prueba y verifica en **Probar eventos** que llegue un Lead con fuente "Servidor" (y deduplicado con el del navegador). Luego quita `meta_test_event_code`.

Si faltan `meta_pixel_id` o `meta_capi_token`, la agenda funciona igual y simplemente no envía el evento. Los errores quedan en el `error_log` de PHP como `asesoria: meta capi error`.

## Medición en la landing sin aviso de cookies

`/asesoria/` usa `consentMode="landing"` en `Layout.astro`: la medición (píxel de Meta y Google) arranca al cargar, sin mostrar el aviso y sin guardar una aceptación. Si el visitante pasa a otra página del sitio, ahí sí ve el aviso. Se respetan un rechazo guardado antes y las señales GPC/Do Not Track. La política de privacidad describe esta excepción; si cambias el comportamiento, actualízala.
