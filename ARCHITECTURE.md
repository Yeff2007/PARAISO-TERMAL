# Arquitectura de Paraíso Termal

```text
Navegador → interfaz Next.js → BFF /api/public → API pública del PMS → PMS/Wompi
```

La aplicación no requiere el sitio público anterior para servir sus páginas: los recursos estáticos de marca y restaurante están en `public/`. El contenido operativo (planes, disponibilidad, cotización y estado del checkout) sí depende del PMS. Google Maps y los enlaces de contacto son integraciones externas de la sección de ubicación; el proveedor de pago se abre mediante el `paymentUrl` entregado por el PMS. Las imágenes incluidas en respuestas del PMS pueden alojarse externamente; el componente visual bloquea URLs del dominio público antiguo.

## Límites de confianza

- `GET plans`, `GET availability`, `POST quote` y `GET checkouts/{code}` son consultas públicas del API documentado.
- El BFF protege el `POST checkouts` y agrega `X-Web-Secret` solo en el servidor.
- El sitio no integra Wompi, no recibe webhooks ni interpreta el retorno del navegador como aprobación.
- El estado autoritativo viene de `GET checkouts/{code}`. Solo `PAID` sin `needsReview` se presenta como reserva confirmada.
- Las cotizaciones son informativas. El PMS recalcula el valor al crear el checkout.

## Módulos

- `src/lib/api.ts`: tipos y cliente de navegador para el BFF.
- `src/lib/server/public-api.ts`: cliente server-only para el contrato del PMS.
- `src/app/api/public/*`: proxy y validación de solicitudes; la ruta de checkouts es la única que usa el secreto.
- `src/app/reservar/page.tsx`: flujo de planes, disponibilidad, cotización y datos del huésped.
- `src/app/reserva/[code]/page.tsx`: consulta el estado del checkout y presenta los estados definidos por el PMS.
