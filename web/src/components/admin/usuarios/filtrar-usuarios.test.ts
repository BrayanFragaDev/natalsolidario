import { describe, expect, it } from 'vitest';
import { filtrarUsuarios, type UsuarioLista } from './filtrar-usuarios';

const lista: UsuarioLista[] = [
  { uid: '1', nome: 'João Silva', email: 'joao@ong.org', telefone: null, perfis: ['editor'], ativo: true },
  { uid: '2', nome: 'Maria Souza', email: 'maria@ong.org', telefone: null, perfis: ['diretoria', 'editor'], ativo: false },
  { uid: '3', nome: 'Ana Lima', email: 'ana.tesouraria@ong.org', telefone: null, perfis: ['tesouraria'], ativo: true },
];

const uids = (r: UsuarioLista[]) => r.map((u) => u.uid);
const semFiltro = { texto: '', perfil: 'todos', situacao: 'todos' } as const;

describe('filtrarUsuarios', () => {
  it('sem filtros devolve todos', () => {
    expect(uids(filtrarUsuarios(lista, semFiltro))).toEqual(['1', '2', '3']);
  });

  it('busca no nome ignorando acentos e maiúsculas', () => {
    expect(uids(filtrarUsuarios(lista, { ...semFiltro, texto: 'JOAO' }))).toEqual(['1']);
  });

  it('busca no e-mail', () => {
    expect(uids(filtrarUsuarios(lista, { ...semFiltro, texto: 'tesouraria' }))).toEqual(['3']);
  });

  it('filtra por perfil', () => {
    expect(uids(filtrarUsuarios(lista, { ...semFiltro, perfil: 'editor' }))).toEqual(['1', '2']);
  });

  it('filtra por situação', () => {
    expect(uids(filtrarUsuarios(lista, { ...semFiltro, situacao: 'inativos' }))).toEqual(['2']);
    expect(uids(filtrarUsuarios(lista, { ...semFiltro, situacao: 'ativos' }))).toEqual(['1', '3']);
  });

  it('combina filtros', () => {
    expect(uids(filtrarUsuarios(lista, { texto: 'souza', perfil: 'editor', situacao: 'ativos' }))).toEqual([]);
    expect(uids(filtrarUsuarios(lista, { texto: 'souza', perfil: 'editor', situacao: 'inativos' }))).toEqual(['2']);
  });
});
