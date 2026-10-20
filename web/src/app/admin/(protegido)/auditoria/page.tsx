'use client';

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Diferenca } from '@/components/admin/auditoria/diferenca';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { usePermissao } from '@/lib/sessao';

const POR_PAGINA = 50;
const FUSO = 'America/Sao_Paulo';

const ROTULO_ACAO: Record<string, string> = {
  'usuario.convidar': 'Convidou usuário',
  'usuario.definirPerfis': 'Alterou perfis',
  'usuario.desativar': 'Desativou usuário',
  'usuario.reativar': 'Reativou usuário',
  'usuario.criarPrimeiroAdmin': 'Criou o primeiro administrador',
};

// Cada subprojeto acrescenta suas entidades.
const ENTIDADES = [{ valor: 'usuarios', rotulo: 'Usuários' }];

const dataHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' });
// 'en-CA' formata como AAAA-MM-DD, o mesmo formato do <input type="date">.
const diaISO = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO });

interface Registro {
  id: string;
  atorUid: string;
  atorNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  em: Date | null;
}

interface Pagina {
  registros: Registro[];
  ultimo: QueryDocumentSnapshot | null;
  haMais: boolean;
}

async function buscarPagina(filtro: {
  ator: string;
  entidade: string;
  depoisDe: QueryDocumentSnapshot | null;
}): Promise<Pagina> {
  const restricoes: QueryConstraint[] = [];
  if (filtro.ator) restricoes.push(where('atorUid', '==', filtro.ator));
  if (filtro.entidade) restricoes.push(where('entidade', '==', filtro.entidade));
  restricoes.push(orderBy('em', 'desc'), limit(POR_PAGINA));
  if (filtro.depoisDe) restricoes.push(startAfter(filtro.depoisDe));

  const snap = await getDocs(query(collection(db, 'auditoria'), ...restricoes));
  return {
    registros: snap.docs.map((d) => {
      const r = d.data();
      return {
        id: d.id,
        atorUid: String(r.atorUid ?? ''),
        atorNome: String(r.atorNome ?? ''),
        acao: String(r.acao ?? ''),
        entidade: String(r.entidade ?? ''),
        entidadeId: String(r.entidadeId ?? ''),
        antes: r.antes ?? null,
        depois: r.depois ?? null,
        em: r.em?.toDate?.() ?? null,
      };
    }),
    ultimo: snap.docs.at(-1) ?? null,
    haMais: snap.size === POR_PAGINA,
  };
}

const classeSelect =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-ring';

export default function PaginaAuditoria() {
  const podeVer = usePermissao('auditoria:ver');
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [ultimo, setUltimo] = useState<QueryDocumentSnapshot | null>(null);
  const [haMais, setHaMais] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [pessoas, setPessoas] = useState<{ uid: string; nome: string }[]>([]);
  const [ator, setAtor] = useState('');
  const [entidade, setEntidade] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  useEffect(() => {
    if (!podeVer) return;
    getDocs(query(collection(db, 'usuarios'), orderBy('nome')))
      .then((snap) => setPessoas(snap.docs.map((d) => ({ uid: d.id, nome: String(d.data().nome ?? '') }))))
      .catch(() => setPessoas([]));
  }, [podeVer]);

  const buscar = useCallback(
    (depoisDe: QueryDocumentSnapshot | null) => buscarPagina({ ator, entidade, depoisDe }),
    [ator, entidade],
  );

  function aplicar(pagina: Pagina, acrescentar: boolean) {
    setRegistros((atuais) => (acrescentar && atuais ? [...atuais, ...pagina.registros] : pagina.registros));
    setUltimo(pagina.ultimo);
    setHaMais(pagina.haMais);
    setErro(null);
  }

  useEffect(() => {
    if (!podeVer) return;
    let cancelado = false;
    buscar(null)
      .then((pagina) => !cancelado && aplicar(pagina, false))
      .catch((e) => !cancelado && setErro(mensagemDeErro(e)));
    return () => {
      cancelado = true;
    };
  }, [podeVer, buscar]);

  async function carregarMais() {
    setCarregando(true);
    try {
      aplicar(await buscar(ultimo), true);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }

  // O período é filtrado sobre as páginas já carregadas, para não exigir um índice por combinação.
  const visiveis = useMemo(
    () =>
      (registros ?? []).filter((r) => {
        if (!r.em) return !de && !ate;
        const dia = diaISO.format(r.em);
        return (!de || dia >= de) && (!ate || dia <= ate);
      }),
    [registros, de, ate],
  );

  if (!podeVer) {
    return <p className="text-muted-foreground">Você não tem permissão para ver a auditoria.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="filtro-ator">Pessoa</Label>
          <select id="filtro-ator" className={classeSelect} value={ator} onChange={(e) => setAtor(e.target.value)}>
            <option value="">Todas</option>
            {pessoas.map((p) => (
              <option key={p.uid} value={p.uid}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filtro-entidade">Módulo</Label>
          <select
            id="filtro-entidade"
            className={classeSelect}
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
          >
            <option value="">Todos</option>
            {ENTIDADES.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filtro-de">De</Label>
          <Input id="filtro-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filtro-ate">Até</Label>
          <Input id="filtro-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>

      {erro && (
        <p role="alert" className="text-destructive">
          {erro}
        </p>
      )}

      {registros === null ? (
        <Skeleton className="h-40 w-full" />
      ) : visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Data</TableHead>
                <TableHead>Pessoa</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((r) => (
                <Fragment key={r.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-expanded={aberto === r.id}
                        aria-label="Ver detalhes"
                        onClick={() => setAberto(aberto === r.id ? null : r.id)}
                      >
                        {aberto === r.id ? <ChevronDown /> : <ChevronRight />}
                      </Button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.em ? dataHora.format(r.em) : '—'}</TableCell>
                    <TableCell>{r.atorNome}</TableCell>
                    <TableCell>{ROTULO_ACAO[r.acao] ?? r.acao}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.entidade}/{r.entidadeId}
                    </TableCell>
                  </TableRow>
                  {aberto === r.id && (
                    <TableRow>
                      <TableCell />
                      <TableCell colSpan={4} className="whitespace-normal">
                        <Diferenca antes={r.antes} depois={r.depois} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {haMais && (
        <Button variant="outline" className="self-center" disabled={carregando} onClick={() => void carregarMais()}>
          {carregando ? 'Carregando…' : 'Carregar mais'}
        </Button>
      )}
    </div>
  );
}
