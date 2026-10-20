# Paraíso Termal

Sitio web adaptable a móvil y escritorio para presentar el hotel y consultar planes, habitaciones, disponibilidad, cotizaciones y pagos mediante la API pública del PMS.

## Dependencias externas

- El sitio anterior (`paraisotermal.com.co`) no forma parte del funcionamiento de esta aplicación. Las fotos estáticas, logos, fuente de marca y carta del restaurante usadas por la interfaz están dentro de `public/`.
- El catálogo, la disponibilidad de hospedaje, las cotizaciones y el estado de los pagos dependen de la API del PMS. Las habitaciones solo aparecen si el PMS las publica en sus planes.
- Las imágenes que el PMS adjunte a sus respuestas pueden seguir alojadas remotamente. Si una URL apunta al sitio público anterior, la interfaz la descarta y usa una imagen local disponible.
- La página de ubicación incorpora un mapa de Google Maps. WhatsApp, teléfono y correo son enlaces de contacto. El checkout redirige a la URL de pago proporcionada por el PMS.

## Requisitos

- Node.js 20 o posterior y npm.
- Acceso al backend del PMS para consultar los datos en vivo.
- `WEB_CHECKOUT_SECRET` proporcionado por el administrador del PMS para crear checkouts.

## Ejecutar localmente en Windows

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Edita `.env.local` con los valores correspondientes. `BACKEND_URL` debe apuntar al backend del PMS; el valor predeterminado es `https://system.paraisotermal.com.co`. El secreto `WEB_CHECKOUT_SECRET` se configura solo en el servidor y nunca debe llevar el prefijo `NEXT_PUBLIC_`.

## Compilar y revisar

```powershell
npx tsc --noEmit --incremental false
npm run build
npm run start
```

## Publicar el código en GitHub

1. Crea un repositorio vacío en [GitHub](https://github.com/new). No agregues README, licencia ni `.gitignore` desde GitHub, porque este proyecto ya trae esos archivos.
2. En PowerShell, abre la carpeta del proyecto y configura Git si todavía no lo has usado:

   ```powershell
   git config --global user.name "Tu nombre"
   git config --global user.email "tu-correo@example.com"
   ```

3. Inicializa y sube el proyecto. Cambia `TU-USUARIO` y `NOMBRE-DEL-REPOSITORIO` por los que elegiste en GitHub:

   ```powershell
   git init
   git add .
   git status
   git commit -m "Publica sitio de Paraíso Termal"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/NOMBRE-DEL-REPOSITORIO.git
   git push -u origin main
   ```

4. Antes de confirmar `git add`, revisa `git status`: `.env.local`, `.env` y `.env.*` no deben aparecer. `.env.example` sí debe aparecer y no debe contener secretos reales.
5. Para cambios posteriores:

   ```powershell
   git add .
   git commit -m "Describe el cambio"
   git push
   ```

GitHub guardará el código, pero no ejecutará el sitio por sí solo. Para publicarlo en Internet, conecta ese repositorio a un hosting compatible con Next.js y configura allí `BACKEND_URL` y `WEB_CHECKOUT_SECRET` como variables privadas del servidor. Configura además `WEB_PUBLIC_URL` en el PMS con el dominio final del sitio, para que el retorno de pago vuelva a `/reserva/{code}`. No subas `.env.local`, claves de pago ni credenciales al repositorio.

## Documentación del proyecto

- [Guía del proyecto](./GUIA_DEL_PROYECTO.md): páginas, componentes, recursos y flujo de datos.
- [Arquitectura](./ARCHITECTURE.md): capas y límites de confianza.
- [Integración PMS](./INTEGRACION_PMS.md): rutas, datos y configuración de la API pública.

El contrato oficial es `api-publica-web.md`, suministrado por el PMS. Si el contrato cambia, actualiza la integración contra ese documento y conserva los secretos únicamente en el servidor.
