import type { Perfil } from '@natal/shared';

export interface UsuarioLista {
  uid: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfis: Perfil[];
  ativo: boolean;
}

export interface FiltroUsuarios {
  texto: string;
  perfil: Perfil | 'todos';
  situacao: 'ativos' | 'inativos' | 'todos';
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function filtrarUsuarios(lista: UsuarioLista[], filtro: FiltroUsuarios): UsuarioLista[] {
  const busca = normalizar(filtro.texto);
  return lista.filter(
    (u) =>
      (!busca || normalizar(u.nome).includes(busca) || normalizar(u.email).includes(busca)) &&
      (filtro.perfil === 'todos' || u.perfis.includes(filtro.perfil)) &&
      (filtro.situacao === 'todos' || u.ativo === (filtro.situacao === 'ativos')),
  );
}
