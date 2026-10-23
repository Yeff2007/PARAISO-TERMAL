/** Checks a real ISO calendar date rather than just its string shape. */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidStay(checkIn: unknown, checkOut: unknown): boolean {
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) return false;
  return Date.parse(`${checkOut}T00:00:00.000Z`) > Date.parse(`${checkIn}T00:00:00.000Z`);
}

export function isValidVisitDate(value: unknown): value is string {
  const todayInBogota = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  return isValidDate(value) && value >= todayInBogota;
}
