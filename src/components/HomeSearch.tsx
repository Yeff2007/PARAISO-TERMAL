'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Search, Users } from 'lucide-react';
import type { PublicPlan, PublicSection } from '@/lib/api';

const experienceSections: Array<{ id: PublicSection; label: string }> = [
  { id: 'PASADIA', label: 'Pasadía' }, { id: 'PASANOCHE', label: 'Pasanoche' },
  { id: 'CAMPING', label: 'Camping' }, { id: 'SPA', label: 'Spa' },
  { id: 'PASAPORTE', label: 'Pasaportes' }, { id: 'VECINOS', label: 'Jueves de vecinos' },
  { id: 'ARENERO', label: 'Arenero para niños' },
];
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const nextDay = (value: string) => { const date = new Date(`${value || today()}T00:00:00`); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); };

/** Buscadores de portada; envían fechas y selección al flujo de cotización del PMS. */
export default function HomeSearch({ mode, plans = [], plansLoading = false }: { mode: 'lodging' | 'experiences'; plans?: PublicPlan[]; plansLoading?: boolean }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [planId, setPlanId] = useState('');
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const plansBySection = experienceSections.map((section) => ({ ...section, plans: plans.filter((plan) => plan.webSection === section.id) }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'lodging') {
      const query = new URLSearchParams({ checkIn, checkOut, adults, children });
      router.push(`/habitaciones?${query}`);
      return;
    }
    if (!selectedPlan) return;
    const query = new URLSearchParams({ section: selectedPlan.webSection, checkIn, adults, children, plan: selectedPlan.id });
    router.push(`/reservar?${query}`);
  }

  return mode === 'lodging' ? (
    <form className="home-search home-search-lodging" onSubmit={submit} aria-label="Buscar hospedaje">
      <label><span><CalendarDays/> Llegada</span><input type="date" min={today()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required/></label>
      <label><span><CalendarDays/> Salida</span><input type="date" min={nextDay(checkIn)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required/></label>
      <label><span><Users/> Adultos</span><select value={adults} onChange={(event) => setAdults(event.target.value)}>{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'adulto' : 'adultos'}</option>)}</select></label>
      <label><span><Users/> Niños</span><select value={children} onChange={(event) => setChildren(event.target.value)}>{[0,1,2,3,4].map((count) => <option key={count} value={count}>{count === 0 ? 'Sin niños' : `${count} ${count === 1 ? 'niño' : 'niños'}`}</option>)}</select></label>
      <button className="home-search-submit" type="submit"><Search/> Buscar habitaciones</button>
    </form>
  ) : (
    <form className="home-search home-search-experiences" onSubmit={submit} aria-label="Buscar otros planes">
      <label className="home-search-plan"><span>¿Qué quieres disfrutar?</span><select value={planId} disabled={plansLoading} onChange={(event) => setPlanId(event.target.value)} required><option value="">{plansLoading ? 'Cargando planes…' : 'Elige una experiencia'}</option>{plansBySection.map((group) => <optgroup key={group.id} label={group.label}>{group.plans.length ? group.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {new Intl.NumberFormat('es-CO', { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(plan.price)}</option>) : <option value="" disabled>Sin planes publicados todavía</option>}</optgroup>)}</select>{!plansLoading && plans.length === 0 && <small className="home-search-empty">El API aún no publica planes de spa, arenero, pasadía, pasanoche, pasaportes, vecinos o camping.</small>}</label>
      <label><span><CalendarDays/> Fecha de visita</span><input type="date" min={today()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required/></label>
      <label><span><Users/> Personas</span><div className="home-search-people"><select aria-label="Adultos" value={adults} onChange={(event) => setAdults(event.target.value)}>{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} adultos</option>)}</select><select aria-label="Niños" value={children} onChange={(event) => setChildren(event.target.value)}>{[0,1,2,3,4].map((count) => <option key={count} value={count}>{count === 0 ? 'Sin niños' : `${count} niños`}</option>)}</select></div></label>
      <button className="home-search-submit" type="submit" disabled={!selectedPlan}><span>Consultar precio</span><ArrowRight/></button>
    </form>
  );
}
