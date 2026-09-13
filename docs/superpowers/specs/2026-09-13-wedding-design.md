# Invitación de boda — propuesta de diseño y arquitectura

Estado: propuesta preparada para aprobación general; implementación no iniciada.
Fecha: 2026-09-13. Entrega objetivo: hoy, con despliegue Railway y comprobación real.

## Estado inicial

Repositorio Git vacío, sin commits, sin remote, sin aplicación ni dependencias. Node 20.18.0 y npm 10.8.2 disponibles. Railway CLI instalado: `railway whoami` devuelve Unauthorized; `railway status` indica que no hay proyecto vinculado. No se ha creado infraestructura ni contratado servicios.

## Decisión propuesta

| Enfoque | Ventajas | Coste / limitación |
| --- | --- | --- |
| Astro estático + TypeScript + CSS y pequeños módulos de navegador (recomendado) | HTML completo para WhatsApp, imágenes optimizadas en build, componentes y contenido separados, poco JS | Contenido requiere rebuild; RSVP depende de proveedor externo |
| React + Vite, prerender del documento | Flujo React familiar; interacciones complejas fáciles de ampliar | Prerender y metadatos requieren atención adicional; más JS para esta experiencia |
| HTML + TypeScript/Vite | Muy pocas capas, control directo | Reutilización y generación de HTML/SEO desde configuración requieren trabajo manual |

Recomiendo Astro estático. Railway sirve el resultado; sin base de datos, Docker, CMS ni backend de RSVP. Versiones compatibles con el runtime se fijan tras comprobar engines; no se actualiza el Node global. El build de Railway usará la versión declarada por el proyecto.

## Datos confirmados

- Miguel Alejandro Álvarez Avendaño.
- Lina Fernanda Lopez Mojica.
- Presentación propuesta del hero: Miguel & Lina. Nombres completos en la invitación formal. Se conserva «Lopez» tal como fue escrito.

## Dirección visual: «La víspera»

Una invitación fotográfica con la intimidad de una carta. Hero como díptico: nombres de gran escala sobre panel azul niebla y retrato protagonista; fecha alineada al borde de la fotografía. En móvil, fotografía vertical y tipografía adaptada al espacio seguro, sin cortar caras. Un ampersand de gran tamaño conecta los dos nombres: único gesto gráfico recurrente.

Paleta: blanco porcelana #F8F9F7, niebla #E6ECEE, tinta azul #263D49, gris texto #53636A, plata #B7C4C9. La plata se reserva para separadores; texto y botones deben cumplir contraste AA. Tipografía propuesta: Bodoni Moda para nombres y títulos, Instrument Sans para lectura, formularios y datos. WOFF2 locales, subconjunto latino con acentos, pesos mínimos y font-display swap.

Fotografía natural, tonos contenidos sin filtros agresivos. Sin librería de iconos, grids de tarjetas, cristal, fondos degradados ornamentales ni música automática. Los textos provisionales serán invitaciones neutras; no inventarán recuerdos de la pareja. La identidad final se ajustará a sus nombres y fotografías.

### Recorrido

1. Hero: Nos casamos, nombres, fecha, foto, enlace discreto a detalles.
2. Invitación personal: saludo de `guest` y breve bienvenida.
3. Countdown: cuatro cifras tipográficas sin cajas, fecha y agregar al calendario.
4. Introducción y nuestra historia: párrafos breves y 2–3 fotografías en composición alternada.
5. El día: ceremonia y recepción, horarios y direcciones legibles, enlaces a Maps.
6. Dress code: bloque breve y práctico.
7. Galería: seis fotos con ritmo de tamaños; móvil en una/dos columnas según legibilidad; ampliación accesible.
8. RSVP: bloque destacado con proveedor desacoplado y cuatro campos.
9. Regalos: texto breve, enlace opcional validado.
10. Cierre: foto horizontal, mensaje final y nombres.

Navegación breve con anclas. Acceso móvil a RSVP sin cubrir controles ni contenido, respetando safe-area. Scroll nativo, sin scroll hijacking, sin exigir abrir un sobre para leer.

## Arquitectura y contratos

- `src/config/wedding.ts`: nombres, fecha ISO con offset, zona IANA, textos, fotos, puntos focales, ceremonia, recepción, Maps, dress code, RSVP, regalos, contactos, SEO, Open Graph y calendario. Configuración tipada y validada. Campos desconocidos explícitos; nunca un enlace ficticio presentado como real.
- `src/pages/index.astro`: compone secciones; no contiene datos propios de la boda.
- `src/layouts/InvitationLayout.astro`: documento, idioma, metadata, fuentes y navegación.
- `src/components/`: Hero, PersonalInvitation, Countdown, Story, EventDetails, DressCode, Gallery, Rsvp, Gifts, Closing; Photo y CalendarLinks reutilizables.
- `src/lib/`: fechas/countdown, calendario, personalización, validación de configuración y adaptador RSVP.
- `src/scripts/`: inicialización progresiva de motion, galería, saludo y countdown.
- `src/styles/`: tokens, base y estilos de sección delimitados.
- `src/assets/photos/`: fuentes optimizables; `public/`: favicon, OG y archivos servidos sin transformar.
- `tests/`: lógica y flujos; `docs/`: investigación, especificación, plan, evidencia y operación.

Flujo: configuración → build → HTML/SEO/links/imágenes → scripts pequeños para interacciones. Sin JS deben seguir visibles los datos, fotos y enlaces. La animación nunca podrá dejar el contenido oculto indefinidamente.

### Personalización

`?guest=Familia%20Álvarez` se interpreta mediante URLSearchParams, normalización Unicode, eliminación de controles y límite de 100 caracteres. Se inserta con textContent; jamás HTML. Una cadena vacía da saludo genérico. Pruebas de acentos, emoji, longitud, controles y cargas XSS.

`?invite=abc123` tendrá un contrato GuestContext y un punto de resolución reemplazable. En esta versión no resuelve listas privadas, cupos ni permisos; un código desconocido cae al saludo genérico. Nunca se publica una lista de familias en el bundle ni se trata `guest` como autenticación. El futuro límite por familia se valida en servidor/proveedor, no sólo en navegador.

### Fecha y calendario

Fuente única: ISO con offset y zona del evento. Countdown nunca negativo; distingue fecha futura, día del evento y evento terminado. Si falta fecha, texto pendiente sin números engañosos. Google Calendar y descarga .ics comparten fecha, duración, ubicación y descripción. ICS con UID, DTSTAMP, escape, CRLF y folding correctos. Se verificará que invitados en otras zonas no cambien el instante del evento.

### RSVP

Proveedor recomendado: Tally, con nombre, asistirá sí/no, cantidad (cero si no asiste, mínimo uno si sí), mensaje opcional. Integración por iframe cargado al acercarse o abrirlo y enlace externo de respaldo. Adaptador discriminado por proveedor permite cambiar a Google Forms sin tocar las otras secciones. No se promete confirmación hasta que el proveedor la muestre.

Sin URL de formulario: sección visible indicando que la confirmación se habilitará pronto; nunca formulario que finja guardar. Se puede preparar y probar la UI, pero RSVP real requiere un formulario del usuario y una respuesta comprobada en su destino. No se usa localStorage como registro de invitados. No se construye un backend para eludir este dato pendiente.

### Maps, contenido y fallos

Botones de Maps por evento; las URLs deben ser HTTPS y del proveedor permitido. Si falta destino, se muestra pendiente y no un botón que lleve a un lugar inventado. Links externos con protección de opener. Fotos con tamaños explícitos, alt y fallback visual sobrio. Errores de proveedor con enlace alternativo. Galería con dialog, Escape, flechas, foco inicial, retorno de foco y controles táctiles de al menos 44 px.

## Motion

Entrada hero de 700–1000 ms: foto scale 1.035 a 1 y títulos translateY 12 px a 0, escalonados 90 ms. Reveals de 550–750 ms con cubic-bezier(.22,1,.36,1), desplazamiento máximo 18 px y una sola ejecución. Microinteracciones 160–220 ms. Countdown anima únicamente cifras que cambian y no anuncia segundos continuamente a lectores de pantalla.

Parallax opcional máximo 12 px sólo si la segunda revisión aporta una mejora visible y medible. Sin animaciones de layout, sin motor de scroll. CSS + IntersectionObserver como base. prefers-reduced-motion elimina desplazamientos, stagger y parallax; todo permanece visible.

## Imágenes, rendimiento y SEO

Hero con srcset/sizes, carga prioritaria y preload sólo de su recurso principal. Historia/galería con lazy loading, tamaños estables y AVIF/WebP según pipeline. Objetivos: hero móvil <=350 KB, cada imagen de galería <=220 KB, JS propio comprimido <=35 KB, carga inicial móvil aproximadamente <=1 MB sin abrir RSVP. Se medirán; no son resultados obtenidos todavía.

Title, description, canonical y OG absolutos desde configuración; og:type website, og:image 1200x630 con dimensiones, Twitter summary_large_image y favicon con iniciales. Canonical excluye parámetros de invitados. HTML de build contiene metadata sin depender de JS. Configuración noindex para invitación accesible por enlace y mientras haya placeholders; no equivale a control de acceso. Preview técnica de WhatsApp verificable mediante HTML y descarga pública OG; vista exacta en la app sólo se afirmará si se observa allí.

## Railway y definición de terminado

Autenticar CLI, listar workspace y seleccionar destino accesible; crear proyecto/servicio si falta. Usar Railpack para Astro estático, fijar build/start y PORT conforme al servicio detectado. Lockfile y railway config versionados; .env.example sin secretos. Obtener dominio Railway HTTPS, establecer URL pública para canonical/OG y reconstruir.

Orden: MVP completo → QA funcional → pasada visual → pasada motion → checks → deploy → QA de URL real. Commits lógicos de documentación, base/funciones y polish/deploy según cambios reales.

Checks: lint, typecheck, unitarios de lógica, pruebas de navegador y production build. Anchos 390, 430, 768, 1024 y 1440, más texto largo y zoom. Cero overflow horizontal real, navegación de teclado, reduced motion, carga de assets, errores de consola y requests fallidos. Producción: HTTPS, fotos/fuentes, countdown, Maps, RSVP end-to-end, guest, calendario, OG y logs Railway. Evidencia se guarda sin datos sensibles. Revisión de código con skill Superpowers antes de declarar terminado.

No confundir demo desplegada con invitación lista para enviar: nombres/fecha/lugares reales, fotografías y RSVP funcional deben estar incorporados para la segunda afirmación.

## INFORMACIÓN PENDIENTE DEL CLIENTE

### NECESARIO

- Nombres recibidos y registrados; este dato ya está resuelto.
- Fecha, hora, zona horaria y fin aproximado.
- Ceremonia y recepción: nombre del lugar, dirección, horarios y Google Maps.
- RSVP: URL de Tally o Google Forms con los cuatro campos; fecha límite y máximo general si aplica.
- Iniciar sesión en Railway con `railway login`; indicar workspace si hay varios posibles. No pegar tokens en el chat.

### RECOMENDADO

- HERO: 1 vertical 4:5 o 3:4, mínimo 1600 px de alto; ambos visibles, espacio para texto. Versión horizontal 2400x1600 si existe.
- HISTORIA: 2–3 fotos, una horizontal y una vertical, lado largo >=1600 px; 2–3 párrafos reales.
- GALERÍA: 6 fotografías, ideal 3 verticales y 3 horizontales, lado largo >=1600 px; pueden reutilizarse fotos de historia.
- CIERRE: 1 horizontal >=2000x1300; puede reutilizarse una de galería.
- Dress code, bienvenida, contacto público opcional para dudas y política de acompañantes.

### OPCIONAL

- Regalos, texto y enlace; indicaciones de transporte/alojamiento.
- Open Graph propia 1200x630; en su defecto se genera a partir del hero y nombres.
- Dominio propio; se usa el dominio Railway inicialmente.

## Revisión de la propuesta

Sin infraestructura de invitados privados, cargas de fotos, panel de administración ni pagos. Los placeholders son contenido autorizado, no decisiones técnicas abiertas. La dependencia de autenticación/RSVP está identificada y no bloquea construir la versión local. Pendiente una aprobación general de esta propuesta antes del plan, conforme a brainstorming solicitado.
