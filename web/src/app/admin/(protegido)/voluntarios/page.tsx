'use client';

import { AJUDAS, DIAS, STATUS_VOLUNTARIO, TURNOS } from '@natal/shared';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { filtrarVoluntarios, type FiltroVoluntarios, type VoluntarioLista } from '@/components/admin/voluntarios/filtrar-voluntarios';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { formatarData } from '@/lib/portal-datas';
import { usePermissao } from '@/lib/sessao';

const classeSelect = 'h-9 rounded-md border border-input bg-transparent px-3 text-sm';
const rotuloAjuda = Object.fromEntries(AJUDAS.map((a) => [a.valor, a.rotulo]));
const rotuloStatus = Object.fromEntries(STATUS_VOLUNTARIO.map((s) => [s.valor, s.rotulo]));

export default function PaginaVoluntarios() {
  const pode = usePermissao('voluntarios:ver');
  const [lista, setLista] = useState<VoluntarioLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroVoluntarios>({ texto: '', status: 'todos', ajuda: 'todas', dia: 'todos', turno: 'todos' });

  useEffect(() => {
    if (!pode) return;
    return onSnapshot(
      query(collection(db, 'voluntarios'), orderBy('criadoEm', 'desc')),
      (snap) =>
        setLista(
          snap.docs.map((d) => {
            const v = d.data();
            return {
              id: d.id,
              nome: v.nome,
              whatsapp: v.whatsapp,
              cidadeBairro: v.cidadeBairro,
              ajudas: v.ajudas ?? [],
              dias: v.dias ?? [],
              turnos: v.turnos ?? [],
              status: v.status,
              criadoEm: v.criadoEm?.toDate?.() ?? null,
            };
          }),
        ),
      (e) => setErro(mensagemDeErro(e)),
    );
  }, [pode]);

  const visiveis = useMemo(() => (lista ? filtrarVoluntarios(lista, filtro) : []), [lista, filtro]);
  const mudar = (campo: keyof FiltroVoluntarios, valor: string) => setFiltro((f) => ({ ...f, [campo]: valor }));

  if (!pode) return <p className="text-muted-foreground">Você não tem permissão para ver os voluntários.</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Voluntários</h1>

      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Buscar por nome"
          aria-label="Buscar por nome"
          className="sm:max-w-xs"
          value={filtro.texto}
          onChange={(e) => mudar('texto', e.target.value)}
        />
        <select aria-label="Filtrar por situação" className={classeSelect} value={filtro.status} onChange={(e) => mudar('status', e.target.value)}>
          <option value="todos">Todas as situações</option>
          {STATUS_VOLUNTARIO.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}
        </select>
        <select aria-label="Filtrar por ajuda" className={classeSelect} value={filtro.ajuda} onChange={(e) => mudar('ajuda', e.target.value)}>
          <option value="todas">Todas as ajudas</option>
          {AJUDAS.map((a) => <option key={a.valor} value={a.valor}>{a.rotulo}</option>)}
        </select>
        <select aria-label="Filtrar por dia" className={classeSelect} value={filtro.dia} onChange={(e) => mudar('dia', e.target.value)}>
          <option value="todos">Todos os dias</option>
          {DIAS.map((d) => <option key={d.valor} value={d.valor}>{d.rotulo}</option>)}
        </select>
        <select aria-label="Filtrar por turno" className={classeSelect} value={filtro.turno} onChange={(e) => mudar('turno', e.target.value)}>
          <option value="todos">Todos os turnos</option>
          {TURNOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
        </select>
      </div>

      {erro ? (
        <p role="alert" className="text-destructive">{erro}</p>
      ) : lista === null ? (
        <Skeleton className="h-40 w-full" />
      ) : visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum voluntário encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade / bairro</TableHead>
                <TableHead>Ajudas</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/voluntarios/${v.id}`} className="hover:underline">{v.nome}</Link>
                  </TableCell>
                  <TableCell>{v.cidadeBairro}</TableCell>
                  <TableCell className="whitespace-normal">{v.ajudas.map((a) => rotuloAjuda[a] ?? a).join(', ')}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'novo' ? 'default' : v.status === 'ativo' ? 'outline' : 'secondary'}>{rotuloStatus[v.status]}</Badge>
                  </TableCell>
                  <TableCell>{v.criadoEm ? formatarData(v.criadoEm) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
