export function toDisplay(tempC: number, unit: 'F' | 'C'): number {
  if (unit === 'F') return Math.round(tempC * 9 / 5 + 32);
  return Math.round(tempC);
}

export function formatTemp(tempC: number, unit: 'F' | 'C'): string {
  return `${toDisplay(tempC, unit)}°`;
}
