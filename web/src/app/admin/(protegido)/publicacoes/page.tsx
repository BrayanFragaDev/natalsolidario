'use client';

import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { formatarData } from '@/lib/portal-datas';
import { usePermissao } from '@/lib/sessao';
import { ROTULO_CATEGORIA, type CategoriaPublicacao } from '@/lib/tipos-portal';

interface Linha {
  id: string;
  titulo: string;
  categoria: CategoriaPublicacao;
  status: 'rascunho' | 'publicada';
  atualizadoEm: Date | null;
}

const classeSelect = 'h-9 rounded-md border border-input bg-transparent px-3 text-sm';

export default function PaginaPublicacoes() {
  const pode = usePermissao('publicacoes:editar');
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<'todas' | CategoriaPublicacao>('todas');
  const [status, setStatus] = useState<'todos' | 'rascunho' | 'publicada'>('todos');

  useEffect(() => {
    if (!pode) return;
    return onSnapshot(
      query(collection(db, 'publicacoes'), orderBy('atualizadoEm', 'desc')),
      (snap) =>
        setLinhas(
          snap.docs.map((d) => {
            const p = d.data();
            return { id: d.id, titulo: p.titulo, categoria: p.categoria, status: p.status, atualizadoEm: p.atualizadoEm?.toDate?.() ?? null };
          }),
        ),
      (e) => setErro(mensagemDeErro(e)),
    );
  }, [pode]);

  const visiveis = useMemo(
    () => (linhas ?? []).filter((l) => (categoria === 'todas' || l.categoria === categoria) && (status === 'todos' || l.status === status)),
    [linhas, categoria, status],
  );

  if (!pode) return <p className="text-muted-foreground">Você não tem permissão para editar publicações.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Publicações</h1>
        <Button render={<Link href="/admin/publicacoes/novo" />}>
          <Plus />
          Nova publicação
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select aria-label="Filtrar por categoria" className={classeSelect} value={categoria} onChange={(e) => setCategoria(e.target.value as typeof categoria)}>
          <option value="todas">Todas as categorias</option>
          {Object.entries(ROTULO_CATEGORIA).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <select aria-label="Filtrar por situação" className={classeSelect} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="todos">Todas as situações</option>
          <option value="publicada">Publicadas</option>
          <option value="rascunho">Rascunhos</option>
        </select>
      </div>

      {erro ? (
        <p role="alert" className="text-destructive">{erro}</p>
      ) : linhas === null ? (
        <Skeleton className="h-40 w-full" />
      ) : visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhuma publicação encontrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Atualizada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/publicacoes/${l.id}`} className="hover:underline">
                      {l.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>{ROTULO_CATEGORIA[l.categoria]}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'publicada' ? 'default' : 'secondary'}>{l.status === 'publicada' ? 'Publicada' : 'Rascunho'}</Badge>
                  </TableCell>
                  <TableCell>{l.atualizadoEm ? formatarData(l.atualizadoEm) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
