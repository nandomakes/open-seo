# Panel OpenSEO en Cloudflare (CLICKSRUN)

Operator note for this fork. Commands and secret names are below. Values stay out of git.

Este fork es el panel interno de CLICKSRUN, en la misma línea que agenda.clicksrun.com y el panel del bot de WhatsApp. Es una herramienta de trabajo. El despliegue es el camino oficial de OpenSEO (`docs/SELF_HOSTING_CLOUDFLARE.md`). Esta nota añade lo que esa guía no fija para esta instalación.

## Despliegue

Hace falta Node 22.6 o más nuevo, pnpm, y una cuenta de Cloudflare con Workers, D1, KV y R2.

R2 guarda la caché de respuestas de DataForSEO. Activar R2 pide un método de pago en la cuenta aunque el uso quepa en el tramo gratis. El detalle lo muestra Cloudflare al abrir R2 en el dashboard. Ábrelo una vez antes del deploy. También abre Workers & Pages una vez: una cuenta nueva no tiene subdominio `workers.dev` hasta entonces, y sin él el bootstrap falla.

```bash
corepack enable
pnpm install
pnpm alchemy login deploy/alchemy/alchemy.run.ts --configure
pnpm alchemy cloudflare bootstrap
cp deploy/.env.selfhost.example .env.selfhost
# edita .env.selfhost en local. No lo subas.
pnpm deploy:selfhost --yes
```

En el login, responde que sí a personalizar los scopes y marca `access:write` junto a los que ya vienen marcados. Sin ese scope el deploy no puede crear la aplicación de Cloudflare Access.

Actualizar más adelante: `git pull`, `pnpm install`, `pnpm deploy:selfhost --yes`. Límites del plan gratis (un site audit se corta cerca de las 40 páginas) y el resto del flujo están en `docs/SELF_HOSTING_CLOUDFLARE.md`.

## Secretos

Solo nombres. Los valores van en `.env.selfhost`, en la raíz del repo. Git no versiona ese archivo. La plantilla que sí se versiona es `deploy/.env.selfhost.example`, y no lleva valores. No pongas secretos en un commit.

`pnpm deploy:selfhost` lee `.env.selfhost`. Alchemy los guarda como secretos del Worker. Cada deploy los vuelve a escribir desde el archivo. Un valor puesto solo en el dashboard de Cloudflare desaparece en el siguiente deploy.

El preflight de `pnpm deploy:selfhost` se detiene si `DATAFORSEO_API_KEY` está vacío. El repo se puede dejar listo sin esa clave. La añades en `.env.selfhost` cuando la cuenta de DataForSEO esté fondeada, y entonces despliegas. DataForSEO es pay-as-you-go: le pagas a DataForSEO por las consultas que hagas. El valor es el Base64 de `email:contraseña` de la página API Access, no la API key que muestra el dashboard. Ver `docs/DATAFORSEO_API_KEY.md`.

Obligatorios en el deploy:

- `DATAFORSEO_API_KEY`
- `AUTH_MODE=cloudflare_access`
- `ACCESS_ALLOWED_EMAILS` (correos separados por coma)

Opcionales:

- `CUSTOM_DOMAIN`, hostname en la misma cuenta de Cloudflare.
- `TEAM_DOMAIN` y `POLICY_AUD`, solo si la aplicación de Access ya existe y la gestionas tú. En ese caso el deploy no crea otra.
- `OPENSEO_OPERATOR_SECRET`, solo con `AUTH_MODE=password`, para resets desde la terminal.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y, en Access, `BETTER_AUTH_SECRET`. Ver Search Console abajo. Déjalos vacíos.

## Access y noindex

`AUTH_MODE=cloudflare_access` pone Cloudflare Access delante del Worker. Cloudflare comprueba cada petición antes de que llegue a OpenSEO. Solo entran los correos de `ACCESS_ALLOWED_EMAILS`. Para sumar a alguien, se añade el correo y se vuelve a desplegar. Un cambio hecho solo en el dashboard de esa policy se pisa en el siguiente deploy.

El build de `pnpm deploy:selfhost` (`vite build --mode selfhost`) pide a los buscadores que no indexen el panel:

- cabecera `X-Robots-Tag: noindex, nofollow` en las respuestas HTML que aún no la traen
- `<meta name="robots" content="noindex, nofollow">` en el HTML de la app

Access puede tardar unos dos minutos en aplicarse tras el primer deploy. Hasta entonces no pases la URL.

## Primera visita

`deploy/.env.selfhost.example` trae `AUTH_MODE=password`. En ese modo la primera persona que abre la URL crea la cuenta de administrador. El registro se cierra en cuanto esa cuenta existe. Mientras no exista, quien encuentre la URL puede quedarse la instalación. No dejes el panel así.

Para CLICKSRUN usa `cloudflare_access` antes de desplegar. Quien está en `ACCESS_ALLOWED_EMAILS` entra como owner del workspace compartido. La lista es el control de acceso.

## Search Console

Opcional, y aparte del lector que ya usas. seo-lector sigue leyendo Search Console con la cuenta de servicio y las propiedades `sc-domain:`. No hace falta otro login de Google para este panel, ni volver a verificar propiedades. El OAuth de OpenSEO (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) es otro camino. Si no lo vas a usar, no lo configures. Guía, por si algún día hiciera falta: `docs/SELF_HOSTING_GOOGLE_SEARCH_CONSOLE.md`.

## MCP e informes

OpenSEO expone su MCP en `https://<hostname-del-worker>/mcp`. Con Access, el deploy activa Managed OAuth en la aplicación que crea. Cómo conectar un cliente está en `docs/SELF_HOSTING_CLOUDFLARE_OPERATIONS.md` (sección Through Cloudflare Access). Sirve como referencia para Venus. No hay un servidor MCP distinto en este fork.

El informe HTML que OpenSEO guarda dentro de la app no sustituye el skill de auditoría PDF de Venus para clientes. Este fork no añade Semrush ni Ahrefs.

## Repo

El remoto es https://github.com/nandomakes/open-seo y tiene que quedarse privado. Comprobar:

```bash
gh repo view nandomakes/open-seo --json isPrivate,visibility
```

Si `isPrivate` es false, un admin del repo (el token de una GitHub App sin permiso de administración no puede) ejecuta:

```bash
gh repo edit nandomakes/open-seo --visibility private --accept-visibility-change-consequences
```
