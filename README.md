# Miguel & Lina

Invitación editorial en Astro 7 y TypeScript, estática, servida por Node.js 24.

- Producción: https://invitacion-production-9cbd.up.railway.app
- Repositorio privado: https://github.com/MiguelAlvarez111/miguel-y-lina
- Formulario: https://tally.so/r/lbxKzv
- Administrar respuestas: https://tally.so/forms/lbxKzv/submissions

## Desarrollo y despliegue

Con Node 24 instalado:

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm start
railway up --service invitacion --detach
```

Railway usa `railway.toml`, PORT=8080 y RAILPACK_NODE_VERSION=24. PUBLIC_SITE_URL y PUBLIC_RSVP_URL se incorporan al compilar: redeplegar al cambiarlas. El despliegue es por CLI; subir a GitHub no despliega automáticamente.

## Cambiar textos y fecha

Editar `src/config/wedding.ts`. Incluye nombres, fecha, lugar, textos, fotografías, RSVP y metadatos. Los enlaces de Google Calendar y `/boda.ics` derivan de esa configuración. La finalización a las 22:00 es una duración aproximada de calendario, no una hora confirmada del evento.

Personalización: añadir `?guest=Familia%20Álvarez` al enlace. Solo cambia el saludo; no asigna cupos ni autentica invitados. La página es pública por enlace y solicita no indexación; no tiene contraseña.

## Cambiar fotos

Las fotografías servidas están en `public/photos`, WebP en anchos 480, 960 y 1600. Cada `id` en la configuración corresponde a `id-480.webp`, `id-960.webp`, `id-1600.webp`. Mantener las tres variantes y un texto alternativo correcto. Fuentes retocadas: `src/assets/photos`. `scripts/prepare-photos.mjs` convierte las siete imágenes JPG numeradas originales; no sustituye los derivados retocados.

Se integraron cinco retoques OpenAI (hero, 0546, 6802, 6803, 6804); 6806 y 6810 conservan la foto original optimizada. Los HEIC originales no se modificaron ni se subieron al repositorio. La herramienta de imágenes no expone selección del modelo denominado 2.5.

`public/og.jpg` es la tarjeta para compartir, 1200×630. Si se cambian nombres, fecha o lugar, hay que actualizar también esta imagen. Los metadatos OG están listos; la caché y presentación final de WhatsApp dependen de esa aplicación.

## RSVP

Tally abre en una pestaña propia desde los botones de confirmación. Nombre y asistencia obligatorios, cantidad desplegable 1–10 requerida únicamente al asistir, mensaje opcional. Se evita incrustar el formulario para mantener una apertura fiable y sin espacio vacío mientras carga un tercero. Cambiar proveedor con PUBLIC_RSVP_URL; se permiten Tally y Google Forms.

En Submissions puedes ver respuestas y descargar CSV. Hay dos registros técnicos, llamados `PRUEBA FINAL — NO CONTAR` y `PRUEBA TÉCNICA — NO CONTAR COMO INVITADO`; excluirlos del recuento. El segundo pertenece a una versión anterior del campo numérico y contiene 1.5, defecto corregido con el desplegable. La prueba final recibió 1 asistente sin mensaje.

## Verificación

52 pruebas unitarias/servidor y 8 de navegador: fecha, calendario, personalización segura, archivos estáticos, visor por teclado, movimiento reducido y cinco anchos (390, 430, 768, 1024, 1440). Revisión independiente sin hallazgos importantes. Evidencia visual en `docs/evidence`. Auditoría npm: cero vulnerabilidades en la instalación verificada.

## Pendientes del cliente

Ningún dato obligatorio para publicar. Opcionales: precisar la hora de finalización del calendario, ampliar el selector si una familia requiere más de 10 personas, definir cierre de confirmaciones y comprobar la previsualización real al compartir en WhatsApp. No se enviaron invitaciones a terceros.
