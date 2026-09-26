import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: process.env.SITE_BASE || '/',
  site: process.env.SITE_URL || 'https://estudioindigo.com.co',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
