import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  aoMudarAuth: undefined as undefined | ((u: unknown) => void),
  aoMudarDoc: undefined as undefined | ((snap: unknown) => void),
  signOut: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {} }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    estado.aoMudarAuth = cb;
    return () => undefined;
  },
  signOut: estado.signOut,
}));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...caminho: string[]) => caminho.join('/'),
  onSnapshot: (_ref: unknown, cb: (snap: unknown) => void) => {
    estado.aoMudarDoc = cb;
    return () => undefined;
  },
}));

import { ProvedorSessao, usePermissao, useSessao } from './sessao';

function Sonda() {
  const { carregando, perfil } = useSessao();
  const verUsuarios = usePermissao('usuarios:ver');
  const gerenciar = usePermissao('usuarios:gerenciar');
  if (carregando) return <p>carregando</p>;
  return (
    <p>
      {perfil?.nome ?? 'anônimo'} ver={String(verUsuarios)} gerenciar={String(gerenciar)}
    </p>
  );
}

function snap(dados: object | undefined) {
  return { exists: () => dados !== undefined, data: () => dados };
}

beforeEach(() => {
  estado.signOut.mockReset();
  estado.aoMudarAuth = undefined;
  estado.aoMudarDoc = undefined;
  render(
    <ProvedorSessao>
      <Sonda />
    </ProvedorSessao>,
  );
});

describe('ProvedorSessao', () => {
  it('fica carregando até o Auth responder', () => {
    expect(screen.getByText('carregando')).toBeInTheDocument();
  });

  it('sem usuário termina de carregar como anônimo', () => {
    act(() => estado.aoMudarAuth!(null));
    expect(screen.getByText(/anônimo/)).toBeInTheDocument();
  });

  it('diretoria vê usuários mas não gerencia', () => {
    act(() => estado.aoMudarAuth!({ uid: 'u1' }));
    expect(screen.getByText('carregando')).toBeInTheDocument();
    act(() =>
      estado.aoMudarDoc!(snap({ nome: 'Dora', email: 'd@x.org', telefone: null, perfis: ['diretoria'], ativo: true })),
    );
    expect(screen.getByText('Dora ver=true gerenciar=false')).toBeInTheDocument();
  });

  it('documento desativado encerra a sessão', () => {
    act(() => estado.aoMudarAuth!({ uid: 'u1' }));
    act(() => estado.aoMudarDoc!(snap({ nome: 'Ed', email: 'e@x.org', telefone: null, perfis: ['admin'], ativo: false })));
    expect(estado.signOut).toHaveBeenCalled();
    expect(screen.getByText(/ver=false gerenciar=false/)).toBeInTheDocument();
  });

  it('usuário sem documento (não convidado) encerra a sessão', () => {
    act(() => estado.aoMudarAuth!({ uid: 'u1' }));
    act(() => estado.aoMudarDoc!(snap(undefined)));
    expect(estado.signOut).toHaveBeenCalled();
  });

  it('troca de perfis no documento atualiza as permissões na hora', () => {
    act(() => estado.aoMudarAuth!({ uid: 'u1' }));
    act(() => estado.aoMudarDoc!(snap({ nome: 'Ana', email: 'a@x.org', telefone: null, perfis: ['editor'], ativo: true })));
    expect(screen.getByText('Ana ver=false gerenciar=false')).toBeInTheDocument();
    act(() => estado.aoMudarDoc!(snap({ nome: 'Ana', email: 'a@x.org', telefone: null, perfis: ['admin'], ativo: true })));
    expect(screen.getByText('Ana ver=true gerenciar=true')).toBeInTheDocument();
  });
});
