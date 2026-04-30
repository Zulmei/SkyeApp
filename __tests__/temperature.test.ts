import { toDisplay, formatTemp } from '../utils/temperature';

describe('toDisplay', () => {
  it('returns Celsius unchanged', () => {
    expect(toDisplay(22, 'C')).toBe(22);
  });
  it('converts 0°C to 32°F', () => {
    expect(toDisplay(0, 'F')).toBe(32);
  });
  it('converts 100°C to 212°F', () => {
    expect(toDisplay(100, 'F')).toBe(212);
  });
  it('converts 22°C to 72°F', () => {
    expect(toDisplay(22, 'F')).toBe(72);
  });
  it('rounds fractional results', () => {
    expect(toDisplay(21, 'F')).toBe(70);
  });
});

describe('formatTemp', () => {
  it('formats Celsius with degree symbol', () => {
    expect(formatTemp(22, 'C')).toBe('22°');
  });
  it('formats Fahrenheit with degree symbol', () => {
    expect(formatTemp(0, 'F')).toBe('32°');
  });
});
