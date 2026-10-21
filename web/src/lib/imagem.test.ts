import { describe, expect, it } from 'vitest';
import { dimensoesReduzidas } from './imagem';

describe('dimensoesReduzidas', () => {
  it('reduz pelo lado maior até 1600', () => {
    expect(dimensoesReduzidas(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensoesReduzidas(1000, 3000)).toEqual({ largura: 533, altura: 1600 });
  });

  it('não amplia imagens menores', () => {
    expect(dimensoesReduzidas(800, 600)).toEqual({ largura: 800, altura: 600 });
  });

  it('aceita outro limite', () => {
    expect(dimensoesReduzidas(1000, 500, 400)).toEqual({ largura: 400, altura: 200 });
  });
});
