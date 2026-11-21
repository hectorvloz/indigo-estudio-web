# SEO fuera del código — Indigo Estudio

Auditoría del 20 de noviembre de 2026. El sitio está bien construido para Google: HTTPS, una sola versión del dominio (HTTP y `www` redirigen con 301), canonical en todas las páginas, sitemap y robots correctos, 404 real, compresión brotli, caché larga para assets y carga inicial liviana (unos 70 KB y menos de 1 s en escritorio). Bing ya tiene indexadas las 15 URLs públicas.

Por eso la página 6 no es un problema técnico. Es de **relevancia** (Google no sabe con claridad qué vende Indigo ni dónde) y de **autoridad** (casi nadie enlaza ni menciona el sitio). Lo de abajo ataca la autoridad y la presencia local, ordenado por impacto.

## 1. Google Search Console (esta semana)

1. Crea o verifica la propiedad de dominio `estudioindigo.com.co` (registro TXT en el DNS de cPanel).
2. Envía `https://estudioindigo.com.co/sitemap.xml` en **Sitemaps**.
3. En **Inspección de URLs**, pide la indexación del inicio, `/servicios/`, `/proyectos/`, `/estudio/` y `/consignatarias/`.
4. Después de 2 a 4 semanas revisa **Rendimiento → Consultas**: ahí aparecen las búsquedas reales donde ya sale Indigo y en qué posición. Con eso se ajustan títulos y textos. Sin este dato todo es a ciegas.
5. Haz lo mismo en **Bing Webmaster Tools** (se puede importar desde Search Console en un clic). Bing también alimenta a ChatGPT y Copilot.

## 2. Perfil de Empresa de Google (Google Business Profile)

Es lo que más mueve las búsquedas del tipo «diseño web Medellín» o «agencia de branding cerca de mí»: el bloque del mapa sale antes que los resultados orgánicos.

1. Créalo en business.google.com con el nombre exacto **Indigo Estudio**.
2. Categoría principal: «Diseñador de sitios web» o «Agencia de branding». Secundarias: «Diseñador gráfico», «Agencia de marketing».
3. Si no hay oficina abierta al público, márcalo como **empresa de área de servicio**: pones la ciudad y las zonas que atiendes, y la dirección queda oculta.
4. Mismo teléfono (+57 319 209 9069), el mismo correo y el enlace a `https://estudioindigo.com.co/`.
5. Sube de 10 a 15 fotos de proyectos reales (las del portafolio sirven) y el logo.
6. Escribe la descripción con los servicios y la ciudad, en la voz de Indigo.
7. Publica una novedad cada 2 o 3 semanas (un proyecto terminado, la oferta de consignatarias).

## 3. Reseñas

1. Pídeles una reseña en Google a los clientes reales (Retributiva, Creseres, Fernando Martínez, Masa Franca, Infocus...). Con 5 a 10 reseñas el perfil ya compite en el mapa.
2. Responde todas las reseñas.
3. No compres reseñas ni las pongas en el schema del sitio: Google lo penaliza.

## 4. Enlaces y menciones (autoridad)

Ordenado de más fácil a más trabajo:

1. **Perfiles propios con enlace al sitio:** Instagram, LinkedIn de empresa, Behance y Dribbble con los proyectos del portafolio, Pinterest y la página de Facebook. Cuando existan, pon sus URL en `src/data/site.ts` → `sameAs`, para que el schema conecte la marca con esos perfiles.
2. **Clientes:** pídeles a los clientes que pongan en el pie de su web «Diseño: Indigo Estudio» con enlace. Es el enlace más natural y más valioso que hay.
3. **Directorios serios de Colombia y del sector:** Clutch, Sortlist, GoodFirms, DesignRush y las páginas amarillas o los directorios de la Cámara de Comercio. Usa el mismo nombre, teléfono y sitio en todos.
4. **Comunidad local:** cámaras de comercio, gremios, coworkings, universidades donde Indigo dé charlas o talleres, y eventos de diseño.
5. **Contenido que otros enlacen:** un caso de estudio a fondo (por ejemplo, la vitrina de consignatarias con resultados reales) para compartir en LinkedIn y en grupos del sector.

## 5. Consistencia de marca (NAP)

«Indigo» es una palabra muy disputada en Google (aerolínea, tiendas, colores...). Usa siempre **Indigo Estudio**, con el mismo teléfono y el mismo sitio, en todos los perfiles y directorios. Así Google entiende que todas esas menciones son de la misma empresa.

## 6. Medición mensual

- Search Console: consultas, clics, CTR y posición media por página.
- El Perfil de Empresa: vistas, llamadas y clics al sitio.
- Las búsquedas a vigilar se definen con la ciudad y los servicios prioritarios (ver `docs/seo-plan.md`).

## Lo que sigue en el código (requiere decisión)

- Páginas de servicio propias (`/servicios/diseno-web/`, `/servicios/branding/`) con texto suficiente, casos y preguntas frecuentes. Hoy `/servicios/` tiene una sola frase por servicio, y Google no tiene contenido que posicionar para «diseño de páginas web» o «diseño de logos».
- Una línea visible en el hero del inicio que diga qué hace el estudio y dónde. El H1 actual («Lo bueno se nota.») no contiene ninguna búsqueda.
- Cuando se defina la ciudad: llevarla al título, a la descripción, a los textos y al schema (`areaServed` y `address.addressLocality`).
