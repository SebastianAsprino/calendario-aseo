# Aseo del depa

Calendario de una sola página con la rotación semanal de aseo entre Asprino, Gabriela y Sebastian
(Cocina · Sala - Balcón · Baño - Escaleras). Cada semana va de lunes a domingo y la rotación empieza
el lunes 2 de noviembre de 2026.

Además de la página, el sitio publica feeds de calendario (`.ics`) para suscribirse desde Apple,
Google u Outlook:

- `/aseo.ics`: calendario general (las 3 personas).
- `/asprino.ics`, `/gabriela.ics`, `/sebastian.ics`: solo las tareas de cada persona.

La rotación vive en un solo lugar (`src/lib/rotation.ts`); la página y los feeds se generan desde ahí.

## Uso

Requiere [Bun](https://bun.sh).

```sh
bun install      # instalar dependencias
bun run dev      # servidor de desarrollo en http://localhost:4321
bun test         # pruebas (rotación, feeds .ics, contraste de colores)
bun run build    # astro check + sitio estático en dist/
bun run preview  # servir dist/ localmente
```

## Publicar

`bun run build` genera un sitio 100 % estático en `dist/` (HTML, JS y los `.ics`). Se puede subir a
cualquier hosting estático (Cloudflare Pages, Netlify, GitHub Pages, Vercel, un servidor con nginx…):
basta con publicar el contenido de `dist/`.

Si el sitio queda en una subcarpeta (por ejemplo GitHub Pages en `/calendario-aseo/`), configura
`base` en `astro.config.mjs`.

Conviene que el hosting sirva los `.ics` con `Content-Type: text/calendar; charset=utf-8` (la
mayoría ya lo hace por la extensión).

**Importante:** los botones de suscripción (Apple, Google, Outlook) solo funcionan cuando el sitio
está publicado en una URL pública. Google y Outlook descargan el feed desde sus servidores, así que
no pueden leer `localhost`. "Descargar .ics" sí funciona siempre, pero importa una copia que no se
actualiza.
