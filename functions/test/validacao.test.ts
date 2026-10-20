import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { esquemaEmail, esquemaNome, esquemaPerfis, esquemaTelefone, validar } from '../src/lib/validacao';

describe('esquemaEmail', () => {
  it('remove espaços e passa para minúsculas', () => {
    expect(esquemaEmail.parse(' Ana@Exemplo.com ')).toBe('ana@exemplo.com');
  });

  it('recusa texto que não é e-mail', () => {
    expect(esquemaEmail.safeParse('ana').success).toBe(false);
  });
});

describe('esquemaNome', () => {
  it('remove espaços nas pontas', () => {
    expect(esquemaNome.parse('  Ana Souza ')).toBe('Ana Souza');
  });

  it('recusa nome vazio ou longo demais', () => {
    expect(esquemaNome.safeParse('').success).toBe(false);
    expect(esquemaNome.safeParse('   ').success).toBe(false);
    expect(esquemaNome.safeParse('a'.repeat(101)).success).toBe(false);
  });
});

describe('esquemaTelefone', () => {
  it('aceita 10 ou 11 dígitos', () => {
    expect(esquemaTelefone.parse('11987654321')).toBe('11987654321');
    expect(esquemaTelefone.parse('1133334444')).toBe('1133334444');
  });

  it('transforma vazio ou ausente em null', () => {
    expect(esquemaTelefone.parse('')).toBeNull();
    expect(esquemaTelefone.parse(undefined)).toBeNull();
    expect(esquemaTelefone.parse(null)).toBeNull();
  });

  it('recusa formato inválido', () => {
    expect(esquemaTelefone.safeParse('11-9876').success).toBe(false);
    expect(esquemaTelefone.safeParse('abcdefghijk').success).toBe(false);
  });
});

describe('esquemaPerfis', () => {
  it('aceita perfis válidos', () => {
    expect(esquemaPerfis.parse(['admin', 'editor'])).toEqual(['admin', 'editor']);
  });

  it('recusa lista vazia, perfil inexistente e repetição', () => {
    expect(esquemaPerfis.safeParse([]).success).toBe(false);
    expect(esquemaPerfis.safeParse(['root']).success).toBe(false);
    expect(esquemaPerfis.safeParse(['admin', 'admin']).success).toBe(false);
  });
});

describe('validar', () => {
  it('devolve o valor transformado quando válido', () => {
    expect(validar(z.object({ email: esquemaEmail }), { email: ' X@Y.com' })).toEqual({ email: 'x@y.com' });
  });

  it('lança invalid-argument com mensagem em português', () => {
    try {
      validar(z.object({ nome: esquemaNome }), { nome: '' });
      expect.unreachable();
    } catch (e) {
      expect(e).toMatchObject({ code: 'invalid-argument' });
      expect((e as Error).message).toMatch(/nome/i);
    }
  });
});
