'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, CircleAlert, X } from 'lucide-react';
import SiteHeader from '../../../components/SiteHeader';
import { getCheckout, type PublicCheckout } from '../../../lib/api';

export default function CheckoutResultPage() {
  const { code } = useParams<{ code: string }>(); const [checkout, setCheckout] = useState<PublicCheckout | null>(null); const [error, setError] = useState(''); const [autoStopped, setAutoStopped] = useState(false); const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    // El PMS es autoritativo. Se reintenta con espera progresiva y se detiene a los diez minutos.
    let active = true; let timer: ReturnType<typeof setTimeout> | undefined; let attempts = 0; const startedAt = Date.now(); const maxAutoPollMs = 10 * 60_000;
    const schedule = () => {
      if (Date.now() - startedAt >= maxAutoPollMs) { setAutoStopped(true); return; }
      const delay = Math.min(4_000 * (2 ** attempts), 30_000); attempts += 1; timer = setTimeout(poll, delay);
    };
    const poll = async () => {
      try {
        const status = await getCheckout(code); if (!active) return;
        setCheckout(status); setError('');
        if (status.status === 'OPEN') schedule();
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'No se pudo consultar el estado.'); schedule();
      }
    };
    setAutoStopped(false); void poll(); return () => { active = false; if (timer) clearTimeout(timer); };
  }, [code, refreshKey]);
  const checkNow = () => { setError(''); setRefreshKey((key) => key + 1); };
  const review = checkout?.status === 'PAID' && checkout.needsReview;
  return <main className="inner-page reserve-page"><SiteHeader/><section className="reserve-shell checkout-result"><Link href="/"><ArrowLeft size={14}/> Volver al inicio</Link><span className="eyebrow">ESTADO DEL CHECKOUT</span>{!checkout && <><Clock3/><h1>Consultando tu pago</h1><p>{error || 'Estamos verificando el resultado del pago. El regreso desde el proveedor no confirma por sí solo la reserva.'}</p>{autoStopped && <><p>La consulta automática se detuvo. Puedes revisar el estado manualmente.</p><button className="forest-button" type="button" onClick={checkNow}>Consultar estado ahora</button></>}</>}
    {checkout?.status === 'OPEN' && <><Clock3/><h1>Pago pendiente</h1><p>{autoStopped ? 'La consulta automática se detuvo. Puedes volver a revisar el estado cuando quieras.' : 'El checkout sigue abierto. Esta página seguirá consultando el estado actualizado del pago.'}</p><small>Vence: {checkout.expiresAt ? new Date(checkout.expiresAt).toLocaleString('es-CO') : 'en un máximo de dos horas'}</small>{autoStopped && <button className="forest-button" type="button" onClick={checkNow}>Consultar estado ahora</button>}</>}
    {checkout?.status === 'PAID' && !review && <><Check/><h1>Pago aprobado</h1><p>El pago fue aprobado y la reserva quedó confirmada.</p>{checkout.confirmationNumber && <div className="confirmation-reference"><span>Número de reserva</span><strong>{checkout.confirmationNumber}</strong></div>}</>}
    {review && <><CircleAlert/><h1>Pago recibido, confirmación pendiente</h1><p>El pago fue recibido, pero el hotel debe revisar y confirmar la disponibilidad antes de dar la reserva por lista.</p></>}
    {checkout?.status === 'FAILED' && <><X/><h1>Pago no aprobado</h1><p>El pago fue rechazado, anulado o no pudo completarse. No se creó una reserva.</p><Link className="forest-button" href="/reservar">Intentar otra vez</Link></>}
    {checkout?.status === 'EXPIRED' && <><Clock3/><h1>Checkout vencido</h1><p>El plazo de pago terminó y no se confirmó la reserva.</p><Link className="forest-button" href="/reservar">Iniciar una nueva reserva</Link></>}
    {error && checkout?.status === 'OPEN' && <p role="status">{error}{autoStopped ? '' : ' Reintentando consulta…'}</p>}
    {checkout && <div className="confirmation-reference"><span>{checkout.rateName} · {checkout.checkIn}{checkout.checkOut ? ` al ${checkout.checkOut}` : ''}</span><strong>{new Intl.NumberFormat('es-CO',{style:'currency',currency:checkout.currency,maximumFractionDigits:0}).format(checkout.total)}</strong></div>}
  </section><footer className="inner-footer"><Link href="/"><ArrowLeft size={15}/> Volver a Paraíso Termal</Link></footer></main>;
}
