'use client';

import { AJUDAS, DIAS, STATUS_VOLUNTARIO, TURNOS, type StatusVoluntario } from '@natal/shared';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '@/lib/erros';
import { db, functions } from '@/lib/firebase';
import { formatarDataHora } from '@/lib/portal-datas';
import { usePermissao } from '@/lib/sessao';

const atualizarVoluntario = httpsCallable<{ id: string; status?: StatusVoluntario; anotacoes?: string | null }, { ok: true }>(
  functions,
  'atualizarVoluntario',
);

const rotulos = (lista: readonly { valor: string; rotulo: string }[], valores: string[] = []) =>
  valores.map((v) => lista.find((i) => i.valor === v)?.rotulo ?? v).join(', ') || '—';

function Info({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default function FichaVoluntario() {
  const podeVer = usePermissao('voluntarios:ver');
  const podeGerenciar = usePermissao('voluntarios:gerenciar');
  const { id } = useParams<{ id: string }>();
  const [v, setV] = useState<DocumentData | null | undefined>(undefined);
  const [anotacoes, setAnotacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const anotacoesCarregadas = useRef(false);

  useEffect(() => {
    if (!podeVer) return;
    return onSnapshot(
      doc(db, 'voluntarios', id),
      (snap) => {
        // O campo de anotações é preenchido só na primeira leitura: snapshots
        // seguintes (ex.: troca de status) não podem desfazer o que está sendo digitado.
        if (!anotacoesCarregadas.current) {
          anotacoesCarregadas.current = true;
          setAnotacoes(snap.data()?.anotacoes ?? '');
        }
        setV(snap.data() ?? null);
      },
      () => setV(null),
    );
  }, [id, podeVer]);

  async function salvar(dados: { status?: StatusVoluntario; anotacoes?: string | null }) {
    setSalvando(true);
    try {
      await atualizarVoluntario({ id, ...dados });
      toast.success('Voluntário atualizado.');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  if (!podeVer) return <p className="text-muted-foreground">Você não tem permissão para ver os voluntários.</p>;
  if (v === undefined) return <Skeleton className="h-80 w-full max-w-3xl" />;
  if (v === null) return <p role="alert" className="text-destructive">Voluntário não encontrado.</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/voluntarios" className="text-sm text-muted-foreground hover:underline">← Voluntários</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{v.nome}</h1>
        <Button render={<a href={`https://wa.me/55${v.whatsapp}`} target="_blank" rel="noopener noreferrer" />}>
          <MessageCircle />
          Abrir WhatsApp
        </Button>
      </div>

      <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <Info rotulo="WhatsApp">{v.whatsapp}</Info>
        <Info rotulo="E-mail">{v.email ?? '—'}</Info>
        <Info rotulo="Cidade / bairro">{v.cidadeBairro}</Info>
        <Info rotulo="Cadastro">{v.criadoEm ? formatarDataHora(v.criadoEm.toDate()) : '—'}</Info>
        <Info rotulo="Como pode ajudar">{rotulos(AJUDAS, v.ajudas)}</Info>
        {v.veiculo !== null && v.veiculo !== undefined && <Info rotulo="Tem veículo">{v.veiculo ? 'Sim' : 'Não'}</Info>}
        <Info rotulo="Dias">{rotulos(DIAS, v.dias)}</Info>
        <Info rotulo="Turnos">{rotulos(TURNOS, v.turnos)}</Info>
        {v.observacoes && <div className="sm:col-span-2"><Info rotulo="Observações">{v.observacoes}</Info></div>}
        {!podeGerenciar && v.anotacoes && <div className="sm:col-span-2"><Info rotulo="Anotações internas">{v.anotacoes}</Info></div>}
        <div className="sm:col-span-2 text-xs text-muted-foreground">
          Consentimento LGPD em {v.consentimento?.em ? formatarDataHora(v.consentimento.em.toDate()) : '—'}: “{v.consentimento?.texto}”
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <Label htmlFor="vol-status">Situação</Label>
        <select
          id="vol-status"
          className="h-9 w-48 rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-60"
          value={v.status}
          disabled={!podeGerenciar || salvando}
          onChange={(e) => void salvar({ status: e.target.value as StatusVoluntario })}
        >
          {STATUS_VOLUNTARIO.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}
        </select>
      </div>

      {podeGerenciar && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="vol-anotacoes">Anotações internas</Label>
          <textarea
            id="vol-anotacoes"
            rows={4}
            maxLength={2000}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
          />
          <Button variant="outline" className="self-start" disabled={salvando} onClick={() => void salvar({ anotacoes: anotacoes.trim() || null })}>
            Salvar anotações
          </Button>
        </div>
      )}
    </div>
  );
}
