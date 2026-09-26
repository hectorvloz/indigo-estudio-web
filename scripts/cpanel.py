"""Prepare Apache settings and package only the generated static website."""
from pathlib import Path
import os
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'


def prepare():
    base = '/' + os.environ.get('SITE_BASE', '/').strip('/')
    base = base.rstrip('/') + '/'
    if not re.fullmatch(r'/([A-Za-z0-9_-]+/)*', base):
        raise SystemExit('SITE_BASE debe ser una ruta, por ejemplo / o /indigo/.')
    if not (DIST / 'index.html').is_file():
        raise SystemExit('Primero genera el sitio con npm run build.')
    canonical_redirect = '''RewriteEngine On
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} ^www\.estudioindigo\.com\.co$ [NC]
RewriteRule ^ https://estudioindigo.com.co%{REQUEST_URI} [R=301,L]
''' if base == '/' else ''
    (DIST / '.htaccess').write_text(f'''# Indigo Estudio — sitio estático para Apache/cPanel
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 {base}404.html
{canonical_redirect}

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://*.doubleclick.net; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.googleadservices.com https://*.doubleclick.net; frame-src https://*.doubleclick.net; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(webp|png|svg)$">
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript image/svg+xml
</IfModule>
''')
    asset_dir = DIST / '_astro'
    if asset_dir.is_dir():
        (asset_dir / '.htaccess').write_text('''# Astro genera nombres de archivo con huella de contenido.
<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
''')
    print(f'Configuración cPanel preparada para {base}')


def package():
    if not (DIST / '.htaccess').is_file():
        raise SystemExit('Primero ejecuta npm run build.')
    target = ROOT / 'artifacts' / 'indigo-cpanel.zip'
    target.parent.mkdir(exist_ok=True)
    files = sorted(p for p in DIST.rglob('*') if p.is_file() and p.name != '.DS_Store')
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(DIST))
    with zipfile.ZipFile(target) as archive:
        if archive.testzip():
            raise SystemExit('No se pudo verificar el ZIP.')
        if not {'index.html', '404.html', '.htaccess'}.issubset(archive.namelist()):
            raise SystemExit('Faltan archivos esenciales en el ZIP.')
    print(f'{target}\n{len(files)} archivos · {target.stat().st_size / 1024 / 1024:.2f} MB')


if __name__ == '__main__':
    actions = {'prepare': prepare, 'zip': package}
    if len(sys.argv) != 2 or sys.argv[1] not in actions:
        raise SystemExit('Uso: python3 scripts/cpanel.py prepare|zip')
    actions[sys.argv[1]]()
