# Investigación de referencias — 13 septiembre 2026

Se clonaron los cuatro repositorios en /tmp/wedding-references y se indexaron con codebase-memory-mcp. Lectura de README, manifests y búsquedas de implementación. Observación visual de páginas oficiales de Bliss & Bone y Riley & Grey. No se ejecutaron aplicaciones de terceros ni se verificaron sus formularios reales. «No identificado» describe el alcance inspeccionado, no una auditoría exhaustiva.

| Referencia | Arquitectura / configuración | Móvil / motion / visual | Galería / RSVP | Fecha / mapas / calendario / invitados | Decisión |
| --- | --- | --- | --- | --- | --- |
| [nerln](https://github.com/nerln/wedding-invite-starter-kit) | HTML, CSS y JS; contenido en HTML y constantes JS; editor GrapesJS local | CSS responsive; hero 100svh, tipografía aireada, reveals progresivos | Grid de seis fotos y dialog; mailto por defecto, alternativas externas documentadas | Countdown con estado de vencimiento, Maps; calendario y personalización no identificados en lo inspeccionado | Adoptar mejora progresiva y simplicidad; centralizar contenido y usar almacenamiento RSVP real |
| [kbichave](https://github.com/kbichave/wedding-invite) | React 18, CRA, router, Tailwind; siteConfig con flags; Express/Netlify y googleapis | Breakpoints Tailwind; entradas CSS; UI de cards y rutas separadas | Fotos configuradas y Google Drive; RSVP fetch a API configurable; backend para otros flujos | Countdown reutilizable, Maps iframe, Google/Outlook/ICS; parseo de hora local del dispositivo; personalización URL no identificada | Adoptar configuración y adaptadores; evitar stack amplio y parsing de fecha dependiente del dispositivo |
| [i-am-fran](https://github.com/i-am-fran/wedding-website-template) | HTML/CSS; tres páginas index/location/honeymoon, colores CSS | Composición botánica con recortes; animaciones CSS; reglas responsive | Fotografías/ilustraciones y vídeo; enlace Microsoft Forms; galería interactiva no identificada | Maps; countdown, calendario y personalización no identificados | Adoptar coherencia con el lugar y copy personal; no copiar ilustraciones ni dispersar contenido |
| [Rainier-PS](https://github.com/Rainier-PS/Invitation-Template) | HTML/CSS/JS, JSON de evento, builder y demos | Secciones de pantalla completa, transiciones; estética glassmorphism del proyecto | Proveedor RSVP detectado, Tally u otros en embed; galería no confirmada | Countdown, Maps y Google Calendar documentados; personalización privada no verificada | Adoptar JSON conceptual y proveedor desacoplado; evitar cristal y desplazamiento forzado |

Licencias declaradas: nerln incluye LICENSE; kbichave ISC; i-am-fran MIT; Rainier MIT. Implementación propuesta original; si se incorpora código concreto, revisar licencia completa y mantener avisos correspondientes.

## Referencias profesionales

- [Bliss & Bone](https://blissandbone.com/) y [ejemplos editoriales 2026](https://cdn.blissandbone.com/resources/examples-of-wedding-websites): suites coordinadas, serif fina, fotografía/objetos y márgenes amplios. Observación en navegador de composición con fondo oliva, nombres delicados y papelería a juego. Patrón útil: coherencia entre portada, detalle y pieza compartida. No trasladar promociones, banners ni navegación comercial a la invitación.
- [Riley & Grey](https://www.rileygrey.com/) y [RSVP](https://www.rileygrey.com/wedding-rsvps): fotografía protagonista y organización de información por invitado; en la portada observada, contraste de serif editorial y lectura sans con ejemplo fotográfico en blanco y negro. Patrón útil: situar fotografía y contexto práctico juntos, y mantener clara la acción RSVP.

La inspección visual fue de páginas y ejemplos mostrados por proveedores, no una prueba de motion de todas las invitaciones de sus catálogos. La animación propuesta es una decisión propia basada en legibilidad, scroll nativo y rendimiento; se validará en nuestra aplicación.

## Fuentes técnicas actuales

- [Astro en Railway](https://docs.astro.build/en/guides/deploy/railway/): Railpack detecta y construye Astro estático; base para evitar Docker innecesario.
- [Tally embed](https://tally.so/help/embed-your-form): integrar un formulario existente con opción de enlace alternativo.

## Síntesis aplicada

La arquitectura más útil combina contenido centralizado y HTML de salida completo. La personalidad debe venir de fotografía, tipografía, secuencia y contenido auténtico. Funciones prioritarias: fecha inequívoca, ubicación accesible, RSVP verificable y buena experiencia móvil. La propuesta no reutiliza código de estos repositorios.
