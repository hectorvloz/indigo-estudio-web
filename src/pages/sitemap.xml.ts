import type { APIRoute } from 'astro';
import { projects } from '../data/projects';
import { site } from '../data/site';

export const prerender = true;

type SitemapImage = { src: string; title: string; caption: string };
type SitemapPage = { path: string; images?: SitemapImage[] };

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!);
const absolute = (path: string) => new URL(path.replace(/^\//, ''), `${site.url}/`).href;
const projectImage = (src: string, title: string, caption: string): SitemapImage => ({ src: absolute(`images/${src}`), title, caption });

const projectImages = projects.map(project => projectImage(project.image, `${project.name} — ${project.category}`, project.alt));
const pages: SitemapPage[] = [
  { path: '/', images: projectImages },
  { path: '/proyectos/', images: projectImages },
  { path: '/servicios/', images: projects.slice(0, 6).map(project => projectImage(project.image, `${project.name} — ${project.discipline}`, project.alt)) },
  { path: '/estudio/', images: [
    projectImage('estudio-mundo.jpg', 'Indigo Estudio creativo en Colombia', 'Espacio de trabajo de Indigo Estudio creativo.'),
    projectImage('indigo-creando.svg', 'Mandingo, personaje de Indigo', 'Personaje gráfico de Indigo Estudio creando una idea.'),
  ] },
  ...projects.map(project => ({
    path: `/proyectos/${project.slug}/`,
    images: project.mockups.map((mockup, index) => projectImage(mockup, `${project.name} — aplicación ${index + 1}`, project.mockupAlts[index])),
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map(page => `  <url>
    <loc>${escapeXml(absolute(page.path))}</loc>${page.images?.map(image => `
    <image:image>
      <image:loc>${escapeXml(image.src)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
      <image:caption>${escapeXml(image.caption)}</image:caption>
    </image:image>`).join('') || ''}
  </url>`).join('\n')}
</urlset>`;

export const GET: APIRoute = () => new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
