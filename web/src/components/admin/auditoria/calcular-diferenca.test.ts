import { describe, expect, it } from 'vitest';
import { calcularDiferenca } from './calcular-diferenca';

describe('calcularDiferenca', () => {
  it('lista o campo que mudou', () => {
    expect(calcularDiferenca({ perfis: ['editor'] }, { perfis: ['tesouraria'] })).toEqual([
      { campo: 'perfis', antes: ['editor'], depois: ['tesouraria'] },
    ]);
  });

  it('objetos iguais (arrays comparados por valor) não têm diferença', () => {
    expect(calcularDiferenca({ perfis: ['admin'], ativo: true }, { perfis: ['admin'], ativo: true })).toEqual([]);
  });

  it('antes nulo lista todos os campos de depois', () => {
    expect(calcularDiferenca(null, { nome: 'Ana', ativo: true })).toEqual([
      { campo: 'ativo', antes: undefined, depois: true },
      { campo: 'nome', antes: undefined, depois: 'Ana' },
    ]);
  });

  it('campo removido aparece com depois indefinido', () => {
    expect(calcularDiferenca({ telefone: '1199999999' }, {})).toEqual([
      { campo: 'telefone', antes: '1199999999', depois: undefined },
    ]);
  });

  it('dois nulos não têm diferença', () => {
    expect(calcularDiferenca(null, null)).toEqual([]);
  });
});
