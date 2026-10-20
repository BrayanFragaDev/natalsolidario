import { describe, expect, it } from 'vitest';
import { limitesDoPeriodo } from './periodo';

describe('limitesDoPeriodo (America/Sao_Paulo)', () => {
  it('sem datas não limita', () => {
    expect(limitesDoPeriodo('', '')).toEqual({ inicio: null, fimExclusivo: null });
  });

  it('"de" começa à meia-noite de São Paulo', () => {
    expect(limitesDoPeriodo('2026-10-20', '').inicio?.toISOString()).toBe('2026-10-20T03:00:00.000Z');
  });

  it('"até" inclui o dia inteiro (limite exclusivo no dia seguinte)', () => {
    expect(limitesDoPeriodo('', '2026-10-20').fimExclusivo?.toISOString()).toBe('2026-10-21T03:00:00.000Z');
  });

  it('virada de mês e de ano', () => {
    expect(limitesDoPeriodo('', '2026-12-31').fimExclusivo?.toISOString()).toBe('2027-01-01T03:00:00.000Z');
  });
});
