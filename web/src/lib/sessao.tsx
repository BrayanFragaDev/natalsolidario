'use client';

import { ehPerfil, temPermissao, type Perfil, type Permissao } from '@natal/shared';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';

export interface PerfilUsuario {
  nome: string;
  email: string;
  telefone: string | null;
  perfis: Perfil[];
  ativo: boolean;
}

export interface Sessao {
  carregando: boolean;
  usuario: User | null;
  perfil: PerfilUsuario | null;
}

const ContextoSessao = createContext<Sessao>({ carregando: true, usuario: null, perfil: null });

// O documento usuarios/{uid} é a fonte da verdade: escutá-lo faz a troca de
// perfis e a desativação valerem na hora, sem esperar o token expirar.
export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao>({ carregando: true, usuario: null, perfil: null });

  useEffect(() => {
    let pararDoc: (() => void) | undefined;

    const pararAuth = onAuthStateChanged(auth, (usuario) => {
      pararDoc?.();
      pararDoc = undefined;

      if (!usuario) {
        setSessao({ carregando: false, usuario: null, perfil: null });
        return;
      }

      setSessao({ carregando: true, usuario, perfil: null });
      pararDoc = onSnapshot(
        doc(db, 'usuarios', usuario.uid),
        (snap) => {
          const dados = snap.exists() ? snap.data() : undefined;
          if (!dados || dados.ativo !== true) {
            setSessao({ carregando: false, usuario: null, perfil: null });
            void signOut(auth);
            return;
          }
          setSessao({
            carregando: false,
            usuario,
            perfil: {
              nome: String(dados.nome ?? ''),
              email: String(dados.email ?? ''),
              telefone: dados.telefone ?? null,
              perfis: Array.isArray(dados.perfis) ? dados.perfis.filter(ehPerfil) : [],
              ativo: true,
            },
          });
        },
        () => {
          // Sem permissão para ler o próprio documento: conta não convidada.
          setSessao({ carregando: false, usuario: null, perfil: null });
          void signOut(auth);
        },
      );
    });

    return () => {
      pararDoc?.();
      pararAuth();
    };
  }, []);

  return <ContextoSessao.Provider value={sessao}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): Sessao {
  return useContext(ContextoSessao);
}

export function usePermissao(permissao: Permissao): boolean {
  const { perfil } = useSessao();
  return !!perfil && temPermissao(perfil.perfis, permissao);
}
