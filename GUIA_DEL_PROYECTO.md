# Guía completa del código

Documento de orientación para mantener el sitio Paraíso Termal. Describe el código que existe hoy; el contrato de integración está definido por `api-publica-web.md` del PMS y debe tener prioridad si cambia.

## Tecnologías y comandos

- Next.js 14 App Router: páginas, navegación y rutas API del servidor.
- React 18 y TypeScript: componentes e interacción.
- CSS propio en `src/app/globals.css`: estilos, diseño responsive y estados visuales.
- `lucide-react`: iconos de interfaz.
- Node.js 20+ y npm.

Comandos disponibles en `package.json`:

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo local, normalmente en `http://localhost:3000`. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run start` | Sirve la compilación de producción. Ejecutar después de `npm run build`. |
| `npm run lint` | Ejecuta el comando de lint de Next.js configurado por el proyecto. |
| `npx tsc --noEmit --incremental false` | Revisa tipos TypeScript sin generar archivos de salida. |

## Estructura del repositorio

```text
paraiso-termal-web/
├── public/images/                 Recursos gráficos estáticos del sitio
├── public/menu/                   PDF de la carta y fotografía del restaurante
├── public/fonts/Vermina.ttf       Tipografía de marca (encabezados y pie)
├── src/
│   ├── app/                       Páginas, layout, estilos y BFF
│   │   └── api/public/             Endpoints del servidor web hacia el PMS
│   ├── components/                Componentes compartidos de presentación
│   └── lib/                       Tipos y clientes de API
├── .env.example                   Plantilla de configuración, sin secretos
├── .env.local                     Configuración privada local, no publicar
├── ARCHITECTURE.md                Límites de confianza y capas
├── INTEGRACION_PMS.md             Resumen del contrato e integración PMS
└── GUIA_DEL_PROYECTO.md           Este mapa de código y funcionamiento
```

Archivos de configuración de la raíz:

- `package.json` y `package-lock.json`: comandos npm y versiones instaladas de Next.js, React, iconos y herramientas CSS/TypeScript.
- `next.config.mjs`: configura imágenes de Next.js sin optimización integrada; `ImagePlaceholder` usa etiquetas `<img>` con carga diferida.
- `tailwind.config.ts`: rutas donde buscar clases y colores de marca extendidos. La mayoría del diseño está escrito como CSS propio.
- `postcss.config.mjs`: conecta Tailwind y Autoprefixer con el pipeline CSS.
- `tsconfig.json`: activa TypeScript estricto, alias `@/*` hacia `src/*` y tipos de Next.js.
- `next-env.d.ts`: declaraciones administradas por Next.js; no editar a mano.
- `.env.example`: plantilla que sí se puede documentar/versionar, sin secretos reales.
- `.env.local`: valores para la máquina local; no compartir ni subir al repositorio.

## Páginas y comportamiento

### Página de inicio — `src/app/page.tsx`

Construye la página larga de presentación del hotel: hero con buscador de hospedaje, segundo buscador para otros planes, beneficios, DNA del agua, planes, habitaciones, spa, pasaportes, restaurante, arenero infantil independiente, experiencias, galería interactiva, preguntas frecuentes, mapa y contacto. El arenero aparece inmediatamente después del restaurante y la galería antes de las preguntas.

El inicio hace **una llamada** a `getPlans()` y distribuye la respuesta por `webSection`. El segundo buscador agrupa en un selector único todos los planes que no son de hospedaje, por categoría, con su precio; al elegir uno, envía plan, fecha y ocupación al flujo de reserva:

- `HOSPEDAJE`: muestra solo entradas que incluyen un `roomType` real devuelto por el PMS.
- `PASAPORTE`: llena la sección de promociones.
- `SPA`: muestra masajes/servicios con nombre, descripción o inclusiones y precio del PMS.
- Las otras secciones completan la zona general de planes.

Si el catálogo no devuelve una sección, la interfaz muestra un estado vacío; no inventa habitaciones, masajes, pasaportes ni precios.

El resto de la página es contenido editorial. La API entregada no tiene endpoints para el menú del restaurante, preguntas frecuentes, textos institucionales, contacto o galería. La carta se administra como recurso estático en `public/menu/`; las preguntas, textos y datos editoriales de la portada se actualizan en este archivo y en `ImagePlaceholder.tsx` según corresponda. Las imágenes que antes venían del sitio anterior se guardan ahora en `public/images/`.

### Listado de hospedaje — `src/app/habitaciones/page.tsx`

Consulta `GET plans` filtrado a `HOSPEDAJE` y conserva solo los planes con `roomType`. El buscador consulta `GET availability` con fechas y huéspedes, y muestra solo los tipos de habitación con cupo. El botón de cada tipo pasa su `roomTypeId` al paso 1 de `/reservar`, donde se presenta en un recuadro y el huésped selecciona la tarifa del plan; al cotizar se vuelve a consultar la disponibilidad antes de pedir el valor estimado.

### Detalle — `src/app/habitaciones/[id]/page.tsx`

Busca el plan solicitado dentro de los planes `HOSPEDAJE`, exige que tenga `roomType`, presenta imágenes/datos disponibles y abre `/reservar` con la sección y el ID del plan en la URL.

### Motor de reserva — `src/app/reservar/page.tsx`

Permite elegir una de las secciones soportadas por el PMS, seleccionar plan y tipo de habitación, introducir fechas y ocupación, consultar disponibilidad/cotización, capturar los datos del titular y crear el checkout. Los parámetros `section`, `plan` y `roomTypeId` permiten abrir una sección, una tarifa o el tipo de habitación elegido.

Los planes de hospedaje (`PER_NIGHT` o `PER_PERSON`) piden llegada/salida y cupo. La interfaz verifica disponibilidad y solicita cotización en ese orden; si no hay cupo, no cotiza. Spa, pasadía, camping, pasaportes y vecinos usan solo `checkIn`, sin consulta de habitaciones ni `checkOut`. Los datos y precios finales los valida/calcula el PMS.

### Resultado — `src/app/reserva/[code]/page.tsx`

Consulta el checkout identificado por `code`. Vuelve a preguntar cada 4 segundos mientras está `OPEN`; cuando hay error temporal, reintenta en 6 segundos. Expone `PAID`, `FAILED`, `EXPIRED` y el caso `needsReview`. El retorno del navegador nunca es una confirmación de pago.

### Layout — `src/app/layout.tsx`

Aplica CSS global, idioma español y metadatos compartidos de la pestaña y tarjetas de enlace.

## Componentes

- `src/components/SiteHeader.tsx`: navegación para páginas internas, menú móvil y botón principal; acepta `actionHref` y `actionLabel` para cambiar la acción del encabezado.
- `src/components/HomeSearch.tsx`: buscador principal de hospedaje y buscador independiente de otros planes. El hospedaje abre la lista de habitaciones para consultar cupos en fechas; los otros planes aparecen juntos y agrupados por categoría; al elegir uno, pasan su sección, identificador, fecha y personas al flujo de cotización.
- `src/components/RestaurantMenu.tsx`: sección del restaurante con foto introductoria, botón para abrir la carta PDF en una pestaña aparte y opción para descargarla.
- `src/components/ImagePlaceholder.tsx`: bloque visual accesible. Prefiere `imageUrl` del PMS salvo que apunte al antiguo dominio público `paraisotermal.com.co`; en ese caso usa una foto local disponible. Si no hay URL válida, busca una foto por etiquetas; sin coincidencia, muestra el estado de fotografía pendiente. Las imágenes usan carga diferida.
- `src/components/ThermalWaterCarousel.tsx`: carrusel promocional del DNA del agua en la portada. Explica el calor, cloruros, bicarbonatos, calcio y sílice en lenguaje sencillo, con un panel visual preparado para fotografías que se incorporarán posteriormente, dato destacado, beneficios, controles accesibles y avance automático pausado al interactuar. Las fotos ya guardadas en `public/images/` se conservan. Las precauciones aparecen después del DNA y también como pregunta frecuente.
- La sección de preguntas frecuentes usa dos columnas y todo el ancho disponible en escritorio, y una columna en móvil.

## Estilos y recursos

- `src/app/globals.css`: hoja de estilos global y estilos de secciones. Incluye diseño responsive para teléfono, tableta y escritorio. Los cambios visuales se ajustan aquí. La fuente `Vermina` se aplica únicamente al texto de marca “PARAÍSO TERMAL” en el encabezado y el pie de página; el resto del sitio conserva sus tipografías existentes.
- Los estilos `.restaurant-menu*` y `.menu-*` en `globals.css` adaptan la sección y sus accesos a escritorio y móvil. `public/menu/carta-paraiso-termal.pdf` es la versión vigente que se abre o descarga; `public/menu/restaurante-churrasco.jpg` es la fotografía de presentación.
- Los bloques `.water-carousel` y `.water-safety` en `globals.css` definen presentación, transición y adaptación móvil del carrusel y de sus precauciones. El contenido y los valores están en `ThermalWaterCarousel.tsx`, para que sea fácil actualizarlos cuando cambie la información técnica del agua.
- `public/images/`: logos y fotos locales servidos directamente por Next.js, incluidas copias de piscina, spa, pasaporte y camping que reemplazan las referencias al sitio anterior. El tamaño del símbolo del logo se ajusta en `globals.css` para encabezados, pie y pantallas pequeñas. Las imágenes de planes que el PMS devuelva pueden venir de otros servidores; las del antiguo dominio público se descartan y se reemplazan con recursos locales.
- `public/fonts/Vermina.ttf`: archivo tipográfico local cargado con `@font-face` en `globals.css`. El navegador lo descarga desde `/fonts/Vermina.ttf`.
- `tailwind.config.ts`, `postcss.config.mjs`: configuración de utilidades CSS/PostCSS; los estilos de la página actual están principalmente en `globals.css`.

## Cliente del API y tipos

- `src/lib/api.ts`: tipos de la respuesta pública (`PublicPlan`, `PublicAvailability`, `PublicQuote`, `PublicCheckout`) y funciones cliente (`getPlans`, `searchAvailability`, `getQuote`, `createCheckout`, `getCheckout`). Solo llama rutas del mismo sitio y convierte errores en mensajes para la interfaz. El catálogo se conserva en memoria y en la sesión del navegador por 60 segundos para acelerar la navegación y las recargas; disponibilidad y cotizaciones siempre se consultan en vivo.
- `src/lib/domain/hotel.ts`: tipo TypeScript de datos de hotel/contacto/fotos. La documentación pública actual no incluye endpoint para consultarlos, por eso no implica una llamada activa al PMS.

## Rutas BFF del sitio

El BFF (Backend for Frontend) recibe llamadas del navegador en el mismo dominio y las reenvía al PMS desde el servidor. Conserva el formato `success/data` o `success:false/error` documentado. No debe calcular precios, inventario o estado del pago.

| Archivo | Método y ruta del sitio | Qué hace |
|---|---|---|
| `src/app/api/public/plans/route.ts` | `GET /api/public/plans?section=...` | Comprueba que `section` pertenezca al enum permitido y consulta planes publicados. |
| `src/app/api/public/availability/route.ts` | `GET /api/public/availability?...` | Valida parámetros de fechas/huéspedes y consulta cupo. |
| `src/app/api/public/quote/route.ts` | `POST /api/public/quote` | Valida tarifa, fechas y huéspedes; reenvía la cotización informativa. |
| `src/app/api/public/checkouts/route.ts` | `POST /api/public/checkouts` | Valida huésped y documento y crea checkout con secreto server-side; responde HTTP 201. |
| `src/app/api/public/checkouts/[code]/route.ts` | `GET /api/public/checkouts/{code}` | Consulta al PMS el estado autoritativo del checkout. |

`src/lib/server/public-api-response.ts` comparte el formato JSON de respuestas exitosas, errores de validación y errores del PMS.

## Cliente de servidor y seguridad

- `src/lib/server/config.ts`: lee las variables privadas y añade `/api/v1/public` al origen del PMS.
- `src/lib/server/public-api.ts`: contiene el cliente server-only, timeout de solicitud, lectura del envelope del PMS y traducción segura de errores. Añade `X-Web-Secret` solo para crear checkout.
- Las solicitudes tienen timeout de 12 segundos; las consultas de navegador usan también el límite para poder informar una espera larga.
- Las lecturas del catálogo se memorizan 60 segundos; disponibilidad y cotizaciones siempre se consultan en vivo.
- El código del sitio no debe guardar datos de tarjetas, declarar secretos `NEXT_PUBLIC_*`, validar webhooks ni generar links Wompi. Todo eso pertenece al PMS.

## Endpoints del PMS usados

El origen configurado se concatena con `/api/v1/public`:

| Acción | Endpoint |
|---|---|
| Leer todos los planes o filtrar por sección | `GET /plans[?section=...]` |
| Revisar cupo | `GET /availability?checkIn&checkOut&adults&children&roomTypeId` |
| Calcular cotización | `POST /quote` |
| Crear checkout | `POST /checkouts` con `X-Web-Secret` |
| Consultar checkout | `GET /checkouts/{code}` |

No se usan los antiguos endpoints de reserva/pago que el documento marca como `410`. Tampoco se crean rutas de webhook en la web.

## Variables de entorno

`.env.example` es plantilla; `.env.local` se mantiene local y no debe compartirse. En despliegue, configura las variables en el panel del hosting.

| Variable | Dónde | Valor |
|---|---|---|
| `BACKEND_URL` | Servidor del sitio | El documento indica el host `system.paraisotermal.com.co` sin esquema; se verificó que `https://system.paraisotermal.com.co` responde. En una copia local se usa `http://localhost:3001`. El código añade `/api/v1/public`. |
| `WEB_CHECKOUT_SECRET` | Servidor del sitio y PMS | Mismo secreto en ambos, enviado como `X-Web-Secret`; debe solicitarse al administrador del PMS. No poner `NEXT_PUBLIC_`. |
| `WEB_PUBLIC_URL` | Backend del PMS | Dominio público del sitio para que Wompi retorne a `/reserva/{code}`. No es variable de este frontend. |

Las credenciales privadas de Wompi también pertenecen solamente al backend del PMS.

## Desarrollo y publicación

1. Instalar Node.js 20+.
2. Copiar `.env.example` como `.env.local` y configurar `BACKEND_URL`; el secreto solo se obtiene del PMS.
3. Ejecutar `npm install` y `npm run dev`.
4. Abrir `http://localhost:3000`.
5. Para desplegar Next.js, publicar el código en un proveedor compatible y configurar las dos variables del servidor. Configurar aparte `WEB_PUBLIC_URL` en el PMS.
6. Confirmar compilación con `npm run build`; probar los pagos con un entorno de pruebas del PMS/Wompi.

El proyecto incluye `.gitignore`, que excluye dependencias, compilaciones, archivos temporales y variables locales como `.env.local`. El archivo `.env.example` es la única plantilla de entorno que se debe subir y debe permanecer sin credenciales. Los pasos para publicar el código en GitHub están en `README.md`.

La respuesta `{ success: true, data: [] }` significa que la API respondió pero no hay registros publicados que cumplan el filtro. Para mostrar habitaciones, masajes o pasaportes, publica planes activos para la web con su sección y, para hospedaje, su `roomType`.
