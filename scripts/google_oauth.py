#!/usr/bin/env python3
"""Autoriza una vez la cuenta de Google de la agenda y genera la configuración del servidor.

Uso:
    python3 scripts/google_oauth.py CLIENT_ID CLIENT_SECRET

Abre el navegador, inicias sesión con la cuenta dueña del calendario
(indigoestudioo@gmail.com, la misma que usa Infocus) y el script imprime el archivo asesoria.php
que va en /home/indigo/indigo-config/ del servidor (fuera de public_html).
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen
import json
import secrets
import sys
import webbrowser

PORT = 8765
REDIRECT = f'http://127.0.0.1:{PORT}/'
SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy'


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    client_id, client_secret = sys.argv[1], sys.argv[2]
    state = secrets.token_urlsafe(16)
    result: dict[str, str] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            query = parse_qs(urlparse(self.path).query)
            if query.get('state', [''])[0] == state and 'code' in query:
                result['code'] = query['code'][0]
                message = 'Listo. Ya puedes cerrar esta pestaña y volver a la terminal.'
            else:
                message = 'No se recibió autorización. Revisa la terminal.'
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(message.encode())

        def log_message(self, *args):
            pass

    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urlencode({
        'client_id': client_id,
        'redirect_uri': REDIRECT,
        'response_type': 'code',
        'scope': SCOPES,
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state,
    })
    print('Abriendo el navegador. Inicia sesión con indigoestudioo@gmail.com…')
    print(url)
    webbrowser.open(url)
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    while 'code' not in result:
        server.handle_request()

    body = urlencode({
        'code': result['code'],
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': REDIRECT,
        'grant_type': 'authorization_code',
    }).encode()
    with urlopen(Request('https://oauth2.googleapis.com/token', data=body)) as response:
        tokens = json.load(response)
    refresh = tokens.get('refresh_token')
    if not refresh:
        raise SystemExit('Google no entregó refresh_token. Revoca el acceso de la app en tu cuenta y vuelve a intentarlo.')

    print('\nGuarda esto como /home/indigo/indigo-config/asesoria.php en el servidor (permisos 600):\n')
    print(f"""<?php
return [
    'client_id' => '{client_id}',
    'client_secret' => '{client_secret}',
    'refresh_token' => '{refresh}',
    'calendar_id' => 'primary',
    'notify_email' => 'hola@estudioindigo.com.co',
    'from_email' => 'agenda@estudioindigo.com.co',
    'allowed_origins' => ['https://estudioindigo.com.co'],
    'leads_file' => '/home/indigo/indigo-config/leads.jsonl',
];""")


if __name__ == '__main__':
    main()
