// Páginas de servicio enfocadas en búsquedas locales (Pereira) y nacionales.
// Precios y plazos no se publican: se cotizan en la conversación inicial.

export type ServicePage = {
  slug: string;
  name: string;
  seoTitle: string;
  description: string;
  title: [string, string];
  lead: string;
  image: { src: string; width: number; height: number; alt: string; caption: string };
  primary: { label: string; href?: string };
  includesTitle: string;
  includes: { title: string; copy: string }[];
  kindsTitle: string;
  kinds: { title: string; copy: string; link?: { href: string; label: string } }[];
  processTitle: string;
  process: { label: string; copy: string }[];
  workTitle: string;
  work: { href: string; image: string; alt: string; name: string; detail: string }[];
  faq: { q: string; a: string; link?: { href: string; label: string } }[];
  closeLead: string;
  closeTitle: string;
};

const projectCard = (slug: string, name: string, detail: string, alt: string) => ({
  href: `proyectos/${slug}/`, image: `projects/${slug}-01.webp`, alt, name, detail,
});

export const servicePages: ServicePage[] = [
  {
    slug: 'diseno-web',
    name: 'Diseño web',
    seoTitle: 'Diseño de páginas web en Pereira | Indigo Estudio',
    description: 'Diseñamos y programamos páginas web en Pereira: rápidas, claras y listas para Google y WhatsApp. Sitios, landings y catálogos. Asesoría gratis.',
    title: ['Diseño web', 'en Pereira.'],
    lead: 'Páginas web que se ven bien, cargan rápido y hacen que te escriban. Las diseñamos y las programamos en el estudio, desde Pereira para toda Colombia.',
    image: { src: 'asesoria-webs.webp', width: 1400, height: 933, alt: 'Sitios web diseñados por Indigo en portátil, tableta y celular', caption: 'Webs hechas en Indigo, pensadas primero para el celular.' },
    primary: { label: 'Agenda una asesoría gratis', href: 'asesoria/' },
    includesTitle: 'Lo que lleva tu web.',
    includes: [
      { title: 'Diseño a la medida', copy: 'Nada de plantillas. La web sale de tu marca, de tu cliente y de lo que necesitas que haga.' },
      { title: 'Rápida en el celular', copy: 'La mayoría te va a ver desde el teléfono. La hacemos liviana para que abra en segundos.' },
      { title: 'Textos que se entienden', copy: 'Te ayudamos a decir qué haces, para quién y por qué elegirte, sin relleno.' },
      { title: 'Lista para Google', copy: 'Títulos, descripciones, sitemap, datos estructurados y velocidad desde el primer día.' },
      { title: 'WhatsApp y formularios', copy: 'Cada botón lleva a una conversación: WhatsApp, correo o una agenda de citas.' },
      { title: 'Medición', copy: 'Dejamos conectada la analítica para que sepas cuánta gente llega y qué hace.' },
    ],
    kindsTitle: 'Qué web necesitas.',
    kinds: [
      { title: 'Sitio de empresa', copy: 'Quiénes son, qué hacen y cómo contactarlos. Varias páginas, una sola voz.' },
      { title: 'Landing page', copy: 'Una sola página para un producto, una campaña o una pauta en redes.' },
      { title: 'Catálogo', copy: 'Productos con filtros, ficha y botón de WhatsApp en cada uno.', link: { href: 'consignatarias/', label: 'Mira el catálogo para consignatarias' } },
      { title: 'Marca personal', copy: 'Para profesionales que necesitan verse tan serios como trabajan.' },
    ],
    processTitle: 'Cómo lo hacemos.',
    process: [
      { label: 'Hablamos', copy: 'Media hora por Meet, gratis. Entendemos tu negocio y te decimos qué web te sirve.' },
      { label: 'Proponemos', copy: 'Estructura, textos y diseño. Lo ves antes de que escribamos una línea de código.' },
      { label: 'Construimos', copy: 'Programamos y probamos en celulares, tabletas y computadores reales.' },
      { label: 'Publicamos', copy: 'La subimos, la conectamos a Google y te enseñamos a moverla.' },
    ],
    workTitle: 'Webs que ya andan.',
    work: [
      projectCard('espadas-y-oro', 'Espadas y Oro', 'Rebranding y tienda online', 'Packaging y tienda online de Espadas y Oro junto a una espada de colección'),
      projectCard('infocus', 'Infocus', 'Producto digital', 'CRM Infocus mostrado en computador, tableta y teléfono'),
      { href: 'consignatarias/', image: 'consignatarias/mockup-catalogo.webp', alt: 'Catálogo web para consignatarias de carros en portátil y celular', name: 'Consignatarias', detail: 'Catálogo con WhatsApp' },
    ],
    faq: [
      { q: '¿Cuánto cuesta una página web?', a: 'Depende de cuántas páginas y funciones lleve. En la asesoría gratis te damos un precio cerrado antes de empezar, sin sorpresas.' },
      { q: '¿Cuánto se demora?', a: 'Te damos la fecha de entrega junto con la propuesta. Una landing toma bastante menos que un sitio de varias páginas.' },
      { q: '¿Mi web va a salir en Google?', a: 'La dejamos lista para que Google la entienda: rápida, con títulos claros, sitemap y datos estructurados. Subir posiciones toma tiempo, y te decimos qué hacer después del lanzamiento.' },
      { q: '¿Solo trabajan en Pereira?', a: 'No. Estamos en Pereira y trabajamos con marcas de toda Colombia y de afuera, por videollamada.' },
      { q: '¿Necesito tener logo antes?', a: 'No. Si todavía no tienes marca, la hacemos juntos y la web sale de ahí.', link: { href: 'servicios/branding/', label: 'Ver branding' } },
    ],
    closeLead: '¿Tienes una web en la cabeza?',
    closeTitle: 'Hablemos.',
  },
  {
    slug: 'branding',
    name: 'Branding',
    seoTitle: 'Branding y diseño de logos en Pereira | Indigo Estudio',
    description: 'Creamos marcas en Pereira: logo, identidad visual, colores, tipografía y manual de marca. Branding con carácter para empresas y emprendimientos.',
    title: ['Branding', 'en Pereira.'],
    lead: 'Encontramos lo que hace distinta a tu marca y le damos una forma que se reconoce: logo, colores, letra y voz. Desde Pereira, para marcas de cualquier lado.',
    image: { src: 'projects/retributiva-01.webp', width: 1800, height: 1200, alt: 'Identidad de Retributiva aplicada a una carpeta corporativa junto a una calculadora', caption: 'Retributiva: una agencia contable que habla claro.' },
    primary: { label: 'Cuéntanos tu idea' },
    includesTitle: 'Lo que lleva tu marca.',
    includes: [
      { title: 'Estrategia', copy: 'Para quién es, contra quién compite y qué la hace distinta. Primero se piensa.' },
      { title: 'Logo y sus versiones', copy: 'El símbolo, la palabra y cómo se adaptan a un perfil de redes, un letrero o un sello.' },
      { title: 'Colores y tipografía', copy: 'Una paleta y unas letras que se reconocen antes de leer el nombre.' },
      { title: 'Sistema gráfico', copy: 'Formas, patrones y estilo de imagen para que todo se vea de la misma familia.' },
      { title: 'Aplicaciones', copy: 'Papelería, empaque, redes, fachada o uniforme: la marca puesta a trabajar.' },
      { title: 'Manual de marca', copy: 'Las reglas claras para que cualquiera la use bien, aunque no estemos ahí.' },
    ],
    kindsTitle: 'Cuándo hace falta.',
    kinds: [
      { title: 'Vas a lanzar algo', copy: 'Un negocio, un producto o un consultorio que necesita verse bien desde el primer día.' },
      { title: 'Tu marca se quedó', copy: 'Creciste, cambiaste y el logo ya no cuenta lo que haces. Eso es un rebranding.', link: { href: 'proyectos/espadas-y-oro/', label: 'Mira el rebranding de Espadas y Oro' } },
      { title: 'Se ve distinta en cada lado', copy: 'Un color en Instagram, otro en la fachada. Le ponemos orden.' },
      { title: 'Vas a hacer tu web', copy: 'La web sale mucho mejor cuando la marca ya está clara.', link: { href: 'servicios/diseno-web/', label: 'Ver diseño web' } },
    ],
    processTitle: 'Cómo lo hacemos.',
    process: [
      { label: 'Escuchar', copy: 'Preguntamos por tu negocio, tu cliente y tu competencia. Primero, entender.' },
      { label: 'Explorar', copy: 'Probamos rutas distintas antes de casarnos con una. Salir de lo obvio.' },
      { label: 'Crear', copy: 'Diseñamos la marca completa y la ponemos a prueba en piezas reales.' },
      { label: 'Entregar', copy: 'Archivos listos para imprimir y para pantalla, más el manual para usarla.' },
    ],
    workTitle: 'Marcas que ya se notan.',
    work: [
      projectCard('fernando-martinez', 'Fernando Martínez', 'Branding médico', 'Logo del doctor Fernando Martínez en la recepción de un consultorio'),
      projectCard('masa-franca', 'Masa Franca', 'Branding gastronómico', 'Caja de Masa Franca con empanadas artesanales'),
      projectCard('creseres', 'Creseres', 'Branding para psicología', 'Logo de Creseres Psicología en la pared de una sala de consulta'),
    ],
    faq: [
      { q: '¿Branding es lo mismo que un logo?', a: 'No. El logo es una parte. El branding es todo lo que hace que tu marca se reconozca: colores, letra, imágenes, tono y las reglas para usarlos.' },
      { q: '¿Qué me entregan al final?', a: 'El logo y sus versiones en todos los formatos, la paleta, las tipografías, las aplicaciones acordadas y el manual de marca en PDF.' },
      { q: '¿Cuánto cuesta?', a: 'Depende de lo que necesites: no es lo mismo un logo para arrancar que un sistema de marca completo. Después de la primera conversación te damos un precio cerrado.' },
      { q: '¿Hacen rebranding?', a: 'Sí. Renovamos marcas que ya existen sin perder lo que la gente reconoce de ellas.' },
      { q: '¿Solo trabajan en Pereira?', a: 'No. Estamos en Pereira y hemos hecho marcas para clientes en Colombia, España y Panamá.' },
    ],
    closeLead: '¿Tienes una marca por hacer?',
    closeTitle: 'Hagámosle.',
  },
];
