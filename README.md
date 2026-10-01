# GARABIDE

Web corporativa estática para GitHub Pages. HTML, CSS y JavaScript sin dependencias de compilación.

## Contenido

- `index.html`: portada, servicios, ejemplos de soluciones y contacto.
- `brand.css`: stylesheet de la identidad GARABIDE.
- `site.css`: composición responsive y títulos en trazados de Butler Medium.
- `site.js`: menú móvil, enlaces de interés y envío con mensajes localizados.
- `privacidad.html`: información sobre contacto y proveedores; completar los datos legales del titular antes del lanzamiento definitivo.
- `gracias.html`: retorno tras el envío del formulario.
- `CNAME`: dominio `garabide.com`.

## Publicación

Repositorio previsto: `asierreguero/garabide-web`. GitHub → Settings → Pages → Deploy from a branch → `main` → `/ (root)`. El archivo CNAME conserva el dominio. No es necesario ejecutar npm ni añadir claves al código.

En Cloudflare, después de asociar el dominio a GitHub Pages:

| Tipo | Nombre | Destino | Proxy |
|---|---|---|---|
| A | @ | 185.199.108.153 | Solo DNS |
| A | @ | 185.199.109.153 | Solo DNS |
| A | @ | 185.199.110.153 | Solo DNS |
| A | @ | 185.199.111.153 | Solo DNS |
| CNAME | www | asierreguero.github.io | Solo DNS |

Conservar MX, SPF, DKIM y DMARC del correo. Activar Enforce HTTPS cuando GitHub emita el certificado. DNS y certificado pueden tardar en propagarse.

Referencia: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Contacto

El formulario envía JSON al Worker `garabide-contact` de Cloudflare mediante HTTPS. Los resultados se muestran en castellano o euskera sin salir de la página. Requiere JavaScript; el correo directo siempre está disponible. No se incluyen claves en la web.

El Worker utiliza CONTACT_EMAIL (Email Service) y CONTACT_RATE (5 intentos por minuto por IP y ubicación de Cloudflare). Valida el origen, los campos, el consentimiento, el tamaño de la petición y un campo trampa; tiene un destinatario fijo correspondiente al buzón actual de info@garabide.com. El envío no guarda mensajes en una base de datos ni registra su contenido. La confirmación solo se muestra cuando Cloudflare acepta el correo. Comprobar la recepción real manualmente.

El código y pruebas del Worker se conservan en la carpeta local `work`, fuera de la publicación estática. No publicar datos privados del destinatario en este repositorio.

## Identidad

Colores: #192A3A, #918CA8, #FAF7F0, #9ABAC5, #262626. Butler de Fabian De Smet como tipografía de marca y Manrope para el resto. No se incluyen archivos de fuentes. Manrope se carga desde Google Fonts. El logotipo y los títulos se han convertido a trazados SVG de Butler Medium de Fabian De Smet; mantienen su texto accesible en HTML. Para cambiar un título, regenerar el trazado o configurar Butler con archivos propios y sustituir el SVG por texto.

Los horarios y la facturación se presentan únicamente como ejemplos de soluciones, sin revelar clientes, trabajos realizados, proyectos en curso ni negociaciones.

## Mantenimiento

Editar los archivos y subir los cambios a main. GitHub Pages publica automáticamente. Mantener reservada la información sobre clientes y proyectos. No subir archivos de desarrollo o QA; `__qa.html` se usa solo para revisión local y no forma parte de la publicación.

