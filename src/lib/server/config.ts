/**
 * Configuración solo de servidor. BACKEND_URL es el origen del PMS, no incluye
 * /api/v1/public; WEB_CHECKOUT_SECRET jamás debe tener prefijo NEXT_PUBLIC_.
 */
export function getPublicApiConfig() {
  // El documento indica este host sin esquema; se verificó que su endpoint responde por HTTPS.
  const backendUrl = (process.env.BACKEND_URL || 'https://system.paraisotermal.com.co').replace(/\/+$/, '');
  return { backendUrl: `${backendUrl}/api/v1/public`, webCheckoutSecret: process.env.WEB_CHECKOUT_SECRET };
}
