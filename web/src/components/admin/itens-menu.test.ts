import { describe, expect, it } from 'vitest';
import { itensVisiveis } from './itens-menu';

const rotulos = (perfis: Parameters<typeof itensVisiveis>[0]) => itensVisiveis(perfis).map((i) => i.rotulo);

describe('itensVisiveis', () => {
  it('editor vê só o Painel', () => {
    expect(rotulos(['editor'])).toEqual(['Painel']);
  });

  it('diretoria vê Painel, Usuários e Auditoria', () => {
    expect(rotulos(['diretoria'])).toEqual(['Painel', 'Usuários', 'Auditoria']);
  });

  it('membro não vê nada', () => {
    expect(rotulos(['membro'])).toEqual([]);
  });

  it('admin vê tudo', () => {
    expect(rotulos(['admin'])).toEqual(['Painel', 'Usuários', 'Auditoria']);
  });
});
