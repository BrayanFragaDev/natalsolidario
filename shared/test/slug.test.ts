import { describe, expect, it } from 'vitest';
import { gerarSlug, slugComSufixo } from '../src/slug';
import { normalizarWhatsapp } from '../src/voluntario';

describe('gerarSlug', () => {
  it('gera slug sem acentos e pontuação', () => {
    expect(gerarSlug('Campanha de Natal 2026: Brinquedos!')).toBe('campanha-de-natal-2026-brinquedos');
    expect(gerarSlug('  Ação   Solidária  ')).toBe('acao-solidaria');
  });

  it('limita a 80 caracteres sem hífen no fim', () => {
    const slug = gerarSlug('palavra '.repeat(25));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('acrescenta sufixo numérico', () => {
    expect(slugComSufixo('abc', 2)).toBe('abc-2');
    expect(slugComSufixo('a'.repeat(80), 12).length).toBeLessThanOrEqual(80);
    expect(slugComSufixo('a'.repeat(80), 12).endsWith('-12')).toBe(true);
  });
});

describe('normalizarWhatsapp', () => {
  it.each(['(11) 98765-4321', '+55 11 98765-4321', '5511987654321', '11987654321'])('%s', (entrada) => {
    expect(normalizarWhatsapp(entrada)).toBe('11987654321');
  });

  it('aceita fixo com 10 dígitos e recusa curto', () => {
    expect(normalizarWhatsapp('(11) 3333-4444')).toBe('1133334444');
    expect(normalizarWhatsapp('123')).toBeNull();
  });
});
