# Integración de la API pública del PMS

La fuente del contrato es `api-publica-web.md` entregado por el hotel. Base configurada como `${BACKEND_URL}/api/v1/public`.

| Operación del sitio | Endpoint del PMS | Autenticación |
|---|---|---|
| Catálogo | `GET /plans?section=...` | Ninguna |
| Disponibilidad | `GET /availability?checkIn&checkOut&adults&children&roomTypeId` | Ninguna |
| Cotización | `POST /quote` | Ninguna |
| Crear checkout | `POST /checkouts` | `X-Web-Secret`, solo desde el servidor del sitio |
| Consultar resultado | `GET /checkouts/{code}` | Ninguna |

La UI envía el documento (`CC`, `CE`, `PA`, `TI`, `NIT`) y todos los datos obligatorios del titular. Para las ofertas que no son hospedaje no se envía `checkOut` ni se consulta disponibilidad. El endpoint de checkout calcula el total nuevamente y entrega `paymentUrl`.

La portada consulta disponibilidad en vivo para el hospedaje: primero se eligen fechas y huéspedes, luego la web muestra los tipos de habitación con cupo y sus planes asociados. Para pasadía, pasanoche, camping, spa, pasaportes y vecinos, el contrato actual permite consultar planes y cotizar por fecha, pero no define disponibilidad/cupos de esos servicios. La web no presenta una respuesta de cotización como si fuera control de inventario.

La sección `ARENERO` está preparada en la interfaz y el BFF reenvía `GET /plans?section=ARENERO`. El PMS debe incorporar esa sección al enum del catálogo y publicar tarifas para que el plan aparezca. La disponibilidad por horario, cupos, edad o acompañantes sigue pendiente de que el PMS defina el modelo; hasta entonces la reserva de esta sección no se puede confirmar como inventario.

Estados reales: `OPEN`, `PAID`, `FAILED`, `EXPIRED`. Si `PAID` viene con `needsReview: true`, el pago se recibió pero el equipo debe confirmar la reserva. El navegador consulta el estado autoritativo con espera progresiva mientras siga `OPEN` o haya un error temporal; detiene la consulta automática después de diez minutos y permite consultar manualmente. La respuesta del proveedor de pago nunca se considera confirmación.

La web solo acepta `paymentUrl` HTTPS cuyo host coincida exactamente con `PMS_PAYMENT_ALLOWED_HOSTS`, una lista de nombres de host separados por coma, sin comodines ni esquemas. La documentación local del contrato confirma que el PMS entrega `paymentUrl`, pero no especifica su host ni garantiza que sea el checkout de Wompi. Por eso la lista debe permanecer vacía hasta que el administrador del PMS confirme los dominios permitidos para pruebas y producción; sin esa configuración, el BFF rechaza el checkout y no redirige.

## Variables

- `BACKEND_URL`: el documento indica el host `system.paraisotermal.com.co` sin esquema; se verificó que `https://system.paraisotermal.com.co` responde. Usa `http://localhost:3001` solo para un backend local.
- `WEB_CHECKOUT_SECRET`: secreto compartido con el PMS, solo servidor y solo enviado como `X-Web-Secret` al crear checkouts.
- `PMS_PAYMENT_ALLOWED_HOSTS`: hosts exactos desde los que el PMS devuelve sus URLs de pago; solicitar los valores por entorno al administrador del PMS. No es una credencial y nunca debe llevar prefijo `NEXT_PUBLIC_`.
- `TRUSTED_CLIENT_IP_HEADER` (opcional): nombre del header de IP que el proxy confiable sobrescribe antes de enviar la solicitud a Next.js. No configurarlo si la infraestructura no elimina el valor que envía el cliente.

Los límites locales del BFF son una defensa adicional por proceso. En producción, configura además un limitador distribuido en el proxy/hosting y un header de IP confiable sobrescrito por el ingress; el `Map` local no coordina varias instancias.

En el backend del PMS debe configurarse `WEB_PUBLIC_URL` para que Wompi retorne a `{WEB_PUBLIC_URL}/reserva/{code}`. `WOMPI_PRIVATE_KEY`, `WOMPI_EVENT_SECRET` y `WOMPI_URL` pertenecen únicamente al backend del PMS.

La guía no especifica configuración CORS; este proyecto enruta las llamadas por el BFF del mismo origen para que el navegador no necesite CORS hacia el backend. No se configuró ni inventó ningún webhook del lado del sitio.

La web no consulta el antiguo dominio público del hotel. Las imágenes y recursos estáticos propios viven en `public/`. Si el PMS devuelve una imagen con origen en `paraisotermal.com.co`, el componente de imagen la ignora y usa una foto local disponible; imágenes de otros hosts que envíe el PMS pueden seguir siendo remotas.

## Prueba

1. Inicia el PMS local en el puerto y URL documentados.
2. Configura `BACKEND_URL` y el mismo `WEB_CHECKOUT_SECRET` usado por el PMS en `.env.local`.
3. Inicia el sitio con `npm run dev` y abre `/reservar`.
4. Elige un plan publicado, fechas/personas según corresponda, revisa disponibilidad y cotización.
5. Envía los datos del titular y verifica que el BFF cree un checkout y redirija al `paymentUrl`.
6. Completa o rechaza el checkout en el ambiente de pruebas; `/reserva/{code}` debe reflejar la consulta al PMS, no los parámetros de retorno.

Los ambientes reales/credenciales de prueba y planes activos deben ser provistos/configurados por el equipo del PMS.
