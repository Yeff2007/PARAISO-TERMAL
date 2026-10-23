const hostnamePattern = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

function parseAllowedHosts(value = process.env.PMS_PAYMENT_ALLOWED_HOSTS): string[] | null {
  if (!value?.trim()) return null;
  const hosts = value.split(',').map((host) => host.trim().toLowerCase());
  if (hosts.length > 20 || hosts.some((host) => !hostnamePattern.test(host))) return null;
  return hosts;
}

export function hasConfiguredPaymentHosts(value = process.env.PMS_PAYMENT_ALLOWED_HOSTS): boolean {
  return parseAllowedHosts(value) !== null;
}

/** Validates the payment destination returned by the PMS against an operator-confirmed host allowlist. */
export function isApprovedPaymentUrl(value: unknown, allowedHostsValue = process.env.PMS_PAYMENT_ALLOWED_HOSTS): boolean {
  if (typeof value !== 'string') return false;
  const allowedHosts = parseAllowedHosts(allowedHostsValue);
  if (!allowedHosts) return false;
  let paymentUrl: URL;
  try { paymentUrl = new URL(value); } catch { return false; }
  return paymentUrl.protocol === 'https:'
    && !paymentUrl.username
    && !paymentUrl.password
    && !paymentUrl.port
    && allowedHosts.includes(paymentUrl.hostname.toLowerCase());
}
