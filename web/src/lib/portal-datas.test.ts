import { describe, expect, it } from 'vitest';
import { campanhaAtiva, eventoEhFuturo, formatarData, formatarDataHora, progressoCampanha } from './portal-datas';

const d = (iso: string) => new Date(iso);
// Campanha de 01/12 a 24/12 (datas gravadas à meia-noite de São Paulo).
const periodo = { inicio: d('2026-12-01T03:00:00Z'), fim: d('2026-12-24T03:00:00Z') };

describe('campanhaAtiva (dias de São Paulo, inclusivo)', () => {
  it('ainda ativa às 23h30 do último dia', () => {
    expect(campanhaAtiva(periodo, d('2026-12-25T02:30:00Z'))).toBe(true);
  });

  it('encerrada no dia seguinte', () => {
    expect(campanhaAtiva(periodo, d('2026-12-25T03:30:00Z'))).toBe(false);
  });

  it('ativa desde 00h do primeiro dia, não antes', () => {
    expect(campanhaAtiva(periodo, d('2026-12-01T03:10:00Z'))).toBe(true);
    expect(campanhaAtiva(periodo, d('2026-12-01T02:50:00Z'))).toBe(false);
  });
});

describe('eventoEhFuturo', () => {
  it('é futuro até o horário de início', () => {
    expect(eventoEhFuturo({ inicio: d('2026-12-20T02:00:00Z') }, d('2026-12-20T01:59:00Z'))).toBe(true);
    expect(eventoEhFuturo({ inicio: d('2026-12-20T02:00:00Z') }, d('2026-12-20T02:00:00Z'))).toBe(false);
  });
});

describe('progressoCampanha', () => {
  it('sem meta ou alvo inválido não tem barra', () => {
    expect(progressoCampanha(null)).toBeNull();
    expect(progressoCampanha({ alvo: 0, atual: 5 })).toBeNull();
  });

  it('calcula e limita a 100%', () => {
    expect(progressoCampanha({ alvo: 500, atual: 250 })).toBe(50);
    expect(progressoCampanha({ alvo: 500, atual: 900 })).toBe(100);
    expect(progressoCampanha({ alvo: 3, atual: 1 })).toBe(33);
  });
});

describe('formatação', () => {
  it('data e hora em São Paulo', () => {
    expect(formatarDataHora(d('2026-12-20T22:30:00Z'))).toBe('20/12/2026 às 19:30');
    expect(formatarData(d('2026-12-25T02:30:00Z'))).toBe('24/12/2026');
  });
});
