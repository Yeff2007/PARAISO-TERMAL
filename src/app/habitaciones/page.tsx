'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Search, Users } from 'lucide-react';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import SiteHeader from '../../components/SiteHeader';
import { getPlans, searchAvailability, type PublicAvailability, type PublicPlan } from '../../lib/api';

const money = (amount: number, currency: string) => new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const nextDay = (value: string) => { const date = new Date(`${value || today()}T00:00:00`); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); };

export default function RoomsPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [rooms, setRooms] = useState<PublicAvailability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCheckIn = params.get('checkIn') || '';
    const initialCheckOut = params.get('checkOut') || '';
    const initialAdults = Number(params.get('adults') || 2);
    const initialChildren = Number(params.get('children') || 0);
    setCheckIn(initialCheckIn); setCheckOut(initialCheckOut);
    setAdults(params.get('adults') || '2'); setChildren(params.get('children') || '0');
    // Inicia catálogo y disponibilidad en paralelo: las fechas ya vienen del buscador de portada.
    if (initialCheckIn && initialCheckOut) {
      setSearching(true);
      void searchAvailability({ checkIn: initialCheckIn, checkOut: initialCheckOut, adults: initialAdults, children: initialChildren })
        .then((available) => { setRooms(available.filter((room) => room.available > 0)); setSearched(true); })
        .catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudo consultar la disponibilidad.'))
        .finally(() => setSearching(false));
    }
    void getPlans('HOSPEDAJE')
      .then((items) => {
        const published = items.filter((plan) => plan.roomType !== null);
        setPlans(published);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las habitaciones.'))
      .finally(() => setLoading(false));
  }, []);

  async function searchRooms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setRooms(null); setSearched(false); setSearching(true);
    try {
      const available = await searchAvailability({ checkIn, checkOut, adults: Number(adults), children: Number(children) });
      setRooms(available.filter((room) => room.available > 0)); setSearched(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo consultar la disponibilidad.'); }
    finally { setSearching(false); }
  }

  const roomTypes = useMemo(() => rooms === null
    ? searching ? [] : Array.from(new Map(plans.flatMap((plan) => plan.roomType ? [[plan.roomType.id, plan.roomType] as const] : [])).values())
    : rooms, [plans, rooms, searching]);

  return <main className="inner-page rooms-list-page">
    <SiteHeader/>
    <section className="inner-hero"><ImagePlaceholder label="Paisaje de montaña de Paraíso Termal" className="inner-hero-photo"/><div className="inner-hero-shade"/><div><span className="eyebrow gold-text">PARAÍSO TERMAL · HOSPEDAJE</span><h1>Elige dónde descansar</h1><p>Busca tus fechas, compara habitaciones y elige tu plan para vivir una pausa en la montaña.</p></div></section>
    <section className="catalog-shell">
      <form className="room-search" onSubmit={searchRooms} aria-label="Consultar disponibilidad de hospedaje">
        <label><span><CalendarDays/> Llegada</span><input type="date" min={today()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required/></label>
        <label><span><CalendarDays/> Salida</span><input type="date" min={nextDay(checkIn)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required/></label>
        <label><span><Users/> Adultos</span><select value={adults} onChange={(event) => setAdults(event.target.value)}>{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'adulto' : 'adultos'}</option>)}</select></label>
        <label><span><Users/> Niños</span><select value={children} onChange={(event) => setChildren(event.target.value)}>{[0,1,2,3,4].map((count) => <option key={count} value={count}>{count === 0 ? 'Sin niños' : `${count} ${count === 1 ? 'niño' : 'niños'}`}</option>)}</select></label>
        <button className="forest-button" disabled={searching}><Search size={16}/>{searching ? 'Consultando…' : 'Buscar habitaciones'}</button>
      </form>
      <div className="room-results">
        <div className="room-results-heading"><div><span className="eyebrow">TU ESPACIO EN PARAÍSO</span><h2>{searched ? 'Habitaciones disponibles' : 'Habitaciones para elegir'}</h2></div><span>{rooms === null ? `${plans.length} planes` : `${rooms.length} habitaciones disponibles`}</span></div>
        {loading && <p className="empty-state">Cargando habitaciones desde el sistema…</p>}
        {searching && <p className="empty-state">Consultando qué habitaciones tienen cupo para esas fechas…</p>}
        {message && <p className="catalog-message" role="status">{message}</p>}
        {!loading && !searching && !roomTypes.length && !searched && !message && <p className="empty-state">No hay opciones de hospedaje publicadas en este momento.</p>}
        {!loading && roomTypes.map((room) => {
          const offers = plans.filter((plan) => plan.roomType?.id === room.id);
          return <article className="catalog-room-card" key={room.id}>
            <ImagePlaceholder label={`Habitación ${room.name}`} imageUrl={offers[0]?.webImage || room.images[0]?.url} className="catalog-room-image"/>
            <div className="catalog-room-copy">
              <span className="card-kicker">DESCANSO EN LA MONTAÑA</span><h3>{room.name}</h3>
              <p className="room-meta"><Users size={14}/> Hasta {room.maxAdults} adultos y {room.maxChildren} niños</p>
              {room.description && <p>{room.description}</p>}
              {room.amenities.length > 0 && <div className="room-amenities">{room.amenities.slice(0,4).map((item) => <span key={item}><Check size={12}/>{item}</span>)}</div>}
              {searched && rooms?.find((item) => item.id === room.id) && <p className="room-stock">{rooms.find((item) => item.id === room.id)?.available} habitación(es) con cupo para tus fechas</p>}
              <div className="room-offers"><div className="room-offer"><div><b>{offers.length ? `${offers.length} ${offers.length === 1 ? 'plan' : 'planes'} para esta habitación` : 'Tarifa pendiente'}</b><span>{offers.length ? 'Elige la tarifa y consulta el valor estimado en el siguiente paso.' : 'Esta habitación tiene cupo, pero el PMS no ha publicado una tarifa para cotizar.'}</span></div>{offers.length > 0 && <Link className="forest-button" href={`/reservar?${new URLSearchParams({ section: 'HOSPEDAJE', roomTypeId: room.id, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}), adults, children })}`}>Continuar con esta habitación <ArrowRight size={14}/></Link>}</div></div>
            </div>
          </article>;
        })}
        {!loading && searched && !rooms?.length && !message && <p className="empty-state">No encontramos habitaciones disponibles para esas fechas y ocupación. Prueba otras fechas.</p>}
      </div>
    </section>
    <footer className="inner-footer"><Link href="/"><ArrowLeft size={15}/> Volver a Paraíso Termal</Link></footer>
  </main>;
}
