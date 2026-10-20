'use client';

import { ehPerfil, PERFIS, ROTULO_PERFIL } from '@natal/shared';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { DialogoConvidar } from '@/components/admin/usuarios/dialogo-convidar';
import {
  filtrarUsuarios,
  type FiltroUsuarios,
  type UsuarioLista,
} from '@/components/admin/usuarios/filtrar-usuarios';
import { TabelaUsuarios } from '@/components/admin/usuarios/tabela-usuarios';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { usePermissao } from '@/lib/sessao';

const classeSelect =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-ring';

export default function PaginaUsuarios() {
  const podeVer = usePermissao('usuarios:ver');
  const podeGerenciar = usePermissao('usuarios:gerenciar');
  const [usuarios, setUsuarios] = useState<UsuarioLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroUsuarios>({ texto: '', perfil: 'todos', situacao: 'ativos' });

  useEffect(() => {
    if (!podeVer) return;
    // Volume esperado: dezenas de usuários; filtrar no cliente basta.
    return onSnapshot(
      query(collection(db, 'usuarios'), orderBy('nome')),
      (snap) =>
        setUsuarios(
          snap.docs.map((d) => {
            const u = d.data();
            return {
              uid: d.id,
              nome: String(u.nome ?? ''),
              email: String(u.email ?? ''),
              telefone: u.telefone ?? null,
              perfis: Array.isArray(u.perfis) ? u.perfis.filter(ehPerfil) : [],
              ativo: u.ativo === true,
            };
          }),
        ),
      (e) => setErro(mensagemDeErro(e)),
    );
  }, [podeVer]);

  const visiveis = useMemo(() => (usuarios ? filtrarUsuarios(usuarios, filtro) : []), [usuarios, filtro]);

  if (!podeVer) {
    return <p className="text-muted-foreground">Você não tem permissão para ver os usuários.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        {podeGerenciar && <DialogoConvidar />}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar por nome ou e-mail"
          value={filtro.texto}
          onChange={(e) => setFiltro({ ...filtro, texto: e.target.value })}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filtrar por perfil"
          className={classeSelect}
          value={filtro.perfil}
          onChange={(e) => {
            const valor = e.target.value;
            setFiltro({ ...filtro, perfil: ehPerfil(valor) ? valor : 'todos' });
          }}
        >
          <option value="todos">Todos os perfis</option>
          {PERFIS.map((p) => (
            <option key={p} value={p}>
              {ROTULO_PERFIL[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por situação"
          className={classeSelect}
          value={filtro.situacao}
          onChange={(e) => setFiltro({ ...filtro, situacao: e.target.value as FiltroUsuarios['situacao'] })}
        >
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {erro ? (
        <p role="alert" className="text-destructive">
          {erro}
        </p>
      ) : usuarios === null ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <TabelaUsuarios usuarios={visiveis} podeGerenciar={podeGerenciar} />
      )}
    </div>
  );
}
