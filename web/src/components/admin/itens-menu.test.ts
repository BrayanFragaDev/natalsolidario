import { describe, expect, it } from 'vitest';
import { itensVisiveis } from './itens-menu';

const rotulos = (perfis: Parameters<typeof itensVisiveis>[0]) => itensVisiveis(perfis).map((i) => i.rotulo);

describe('itensVisiveis', () => {
  it('editor vê Painel, Publicações e Portal', () => {
    expect(rotulos(['editor'])).toEqual(['Painel', 'Publicações', 'Portal']);
  });

  it('coordenação de voluntários vê Painel e Voluntários', () => {
    expect(rotulos(['coord_voluntarios'])).toEqual(['Painel', 'Voluntários']);
  });

  it('tesouraria vê Painel e Transparência', () => {
    expect(rotulos(['tesouraria'])).toEqual(['Painel', 'Transparência']);
  });

  it('diretoria vê voluntários, transparência, usuários e auditoria', () => {
    expect(rotulos(['diretoria'])).toEqual(['Painel', 'Voluntários', 'Transparência', 'Usuários', 'Auditoria']);
  });

  it('almoxarifado vê só o Painel; membro não vê nada', () => {
    expect(rotulos(['almoxarifado'])).toEqual(['Painel']);
    expect(rotulos(['membro'])).toEqual([]);
  });

  it('admin vê tudo', () => {
    expect(rotulos(['admin'])).toEqual([
      'Painel',
      'Publicações',
      'Voluntários',
      'Transparência',
      'Portal',
      'Usuários',
      'Auditoria',
    ]);
  });
});
