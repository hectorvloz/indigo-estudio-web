# Web Indigo — implementación

Estado: primera versión funcional para revisión. Fecha: 25 de septiembre de 2026.

Prioridad actual: revisar y ajustar en local (`http://localhost:4321`). Por indicación de Héctor, no generar paquetes ZIP ni publicar todavía. Más adelante se subirá el código a un repositorio de GitHub. El ZIP de prueba fue retirado.

Último ajuste de portada: solo logo, hamburguesa de trazo grueso y frase protagonista con símbolo. Se retiraron el encabezado auxiliar, la franja introductoria, el resumen y la miniatura del proyecto, la flecha inferior, el pie de portada y el contador numérico. El control de sonido vive dentro del mega menú.

## Incluido

- Logo final suministrado por Héctor; nombre Indigo sin tilde.
- Amarillo `#F1C844`, negro y crema.
- Tipografía gigante Barlow Condensed; DM Sans para lectura y DM Mono para etiquetas. Fuentes locales.
- Intro «Bien pueda. Entre.» una vez por sesión; entrada con o sin audio.
- Recorrido de siete escenas: portada, tres proyectos, servicios, estudio y contacto.
- Desplazamiento vertical natural con ajuste suave de posición, enlaces directos y flechas del teclado.
- Mega menú de pantalla completa: panel ascendente y entrada escalonada. Proyectos muestra imágenes, Estudio revela un símbolo, Contacto invierte colores.
- Portafolio filtrable, tres páginas de detalle y navegación al siguiente proyecto.
- Formulario breve que prepara WhatsApp, más enlaces directos a correo y WhatsApp.
- Diseño adaptable, diálogos con teclado, foco visible y movimiento reducido.
- Botonería mínima: texto y flechas sin fondos, cápsulas ni bordes decorativos; foco visible al usar teclado.
- Acciones en negrita y respuesta elástica. Navegación con hamburguesa grande y X, sin rótulos visibles; sus nombres accesibles se conservan. El foco de los botones se señala con subrayado o línea de puntos, sin recuadro.
- Cursor grande estilo macOS: flecha negra con borde blanco y sombra discreta. Sigue el puntero de forma directa, sin giro ni estela. Letras elásticas en intro, portada y mega menú: deformación local y retorno suave. Desactivado con puntero táctil o preferencia de movimiento reducido.
- HTML estático, imágenes WebP, recursos locales y paquete ZIP para cPanel.

## Contacto confirmado

- WhatsApp: **+57 319 209 9069**.
- Correo: **hola@estudioindigo.com.co**.

## Recursos visuales

El logo público procede de `assets/logo/final/indigo-estudio-creativo-logo-negro.png`. Las exploraciones anteriores no son el logo del sitio.

Las tres imágenes WebP son visualizaciones generadas para esta maqueta:

- `indigo-brand.webp`: papelería conceptual de la marca propia, basada en el logo final.
- `ritmo.webp`: exploración gráfica de carteles; no es un cliente.
- `materia.webp`: exploración visual digital; no representa una web entregada.

Estas condiciones se indican en cada proyecto. No se atribuyen resultados ni clientes ficticios al estudio.

## Verificación

- Pruebas de navegador: intro, consentimiento de sonido, menú, Escape y foco, navegación por escenas, filtros, páginas y formulario de WhatsApp con destino interceptado.
- Anchos comprobados: 320, 768, 1024 y 1440 píxeles, sin desbordamiento horizontal en inicio, archivo y detalle.
- Revisión visual adicional a 390 y 1440 píxeles.
- Comprobación automática de accesibilidad con axe sobre portada, menú y formulario. No sustituye una auditoría manual completa ni pruebas en todos los navegadores.

## Antes de publicar

Confirmar dominio, aprobar o sustituir las exploraciones del portafolio y probar el paquete en el cPanel de destino. Instagram queda pendiente de una dirección confirmada.

## Nuevo recorrido de presentación

Después de la portada aparecen dos escenas blancas: «Q’ más pues, somos un estudio creativo» y «Vea, hacemos…», seguida de «Y somos expertos usando MagIA». IA usa serif cursiva y resaltado amarillo. El portafolio continúa después. El recorrido tiene nueve escenas. Scroll continuo con suavizado de rueda, sin scroll snap; gesto táctil nativo y movimiento reducido respetado.

## Revisión: Poppins y recorrido por paneles — 25 septiembre 2026
- Poppins local en toda la interfaz, con tamaños adaptados a escritorio y móvil.
- Presentación y servicios creativos reescritos en dos paneles blancos; MagIA conserva el énfasis amarillo sobre IA.
- Rueda/trackpad: transición de 800 ms por gesto, con bloqueo de inercia para evitar saltar varios paneles. Las secciones altas se recorren antes de avanzar.
- Móvil: desplazamiento táctil nativo con ajuste de proximidad a las secciones. Se respeta la preferencia de movimiento reducido.
- Verificación en Chromium: navegación, diálogos, accesibilidad, anchos 320–1440 px y seguimiento de los ojos.
- Trabajo disponible únicamente en local; sin empaquetado ni publicación.
