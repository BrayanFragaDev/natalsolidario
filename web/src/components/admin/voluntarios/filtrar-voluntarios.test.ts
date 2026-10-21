import { describe, expect, it } from 'vitest';
import { filtrarVoluntarios, type VoluntarioLista } from './filtrar-voluntarios';

const v = (id: string, extra: Partial<VoluntarioLista>): VoluntarioLista => ({
  id,
  nome: 'Pessoa',
  whatsapp: '11987654321',
  cidadeBairro: 'Mooca',
  ajudas: ['arrecadacao'],
  dias: ['seg'],
  turnos: ['manha'],
  status: 'novo',
  criadoEm: null,
  ...extra,
});

const lista = [
  v('1', { nome: 'José Lima', status: 'ativo', ajudas: ['entregas'], dias: ['sab'], turnos: ['noite'] }),
  v('2', { nome: 'Ana', status: 'novo', ajudas: ['eventos'], dias: ['sab'], turnos: ['manha'] }),
  v('3', { nome: 'Bia', status: 'inativo', ajudas: ['entregas', 'eventos'], dias: ['dom'], turnos: ['noite'] }),
];

const todos = { texto: '', status: 'todos', ajuda: 'todas', dia: 'todos', turno: 'todos' } as const;
const ids = (r: VoluntarioLista[]) => r.map((x) => x.id);

describe('filtrarVoluntarios', () => {
  it('busca no nome sem acento', () => {
    expect(ids(filtrarVoluntarios(lista, { ...todos, texto: 'jose' }))).toEqual(['1']);
  });

  it('filtra por status e por ajuda', () => {
    expect(ids(filtrarVoluntarios(lista, { ...todos, status: 'novo' }))).toEqual(['2']);
    expect(ids(filtrarVoluntarios(lista, { ...todos, ajuda: 'entregas' }))).toEqual(['1', '3']);
  });

  it('combina dia e turno', () => {
    expect(ids(filtrarVoluntarios(lista, { ...todos, dia: 'sab', turno: 'noite' }))).toEqual(['1']);
  });
});
