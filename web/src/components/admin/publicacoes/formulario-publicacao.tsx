'use client';

import { gerarSlug } from '@natal/shared';
import { collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { useSessao } from '@/lib/sessao';
import { ROTULO_CATEGORIA, type CategoriaPublicacao } from '@/lib/tipos-portal';
import { CampoImagem } from './campo-imagem';
import { EditorTexto } from './editor-texto';
import { Galeria } from './galeria';
import {
  dadosParaGravar,
  escolherSlug,
  validarPublicacao,
  type AcaoPublicacao,
  type EstadoAtual,
  type FormPublicacao,
} from './salvar-publicacao';

const classeSelect = 'h-9 rounded-md border border-input bg-transparent px-3 text-sm';

function Campo({ id, rotulo, children, ajuda }: { id: string; rotulo: string; children: ReactNode; ajuda?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {ajuda && <p className="text-xs text-muted-foreground">{ajuda}</p>}
    </div>
  );
}

async function slugEmUso(slug: string, idAtual: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'publicacoes'), where('slug', '==', slug), limit(2)));
  return snap.docs.some((d) => d.id !== idAtual);
}

export function FormularioPublicacao({
  id,
  novo,
  inicial,
  estadoInicial,
}: {
  id: string;
  novo: boolean;
  inicial: FormPublicacao;
  estadoInicial: EstadoAtual & { status: 'rascunho' | 'publicada' };
}) {
  const router = useRouter();
  const { usuario } = useSessao();
  const [form, setForm] = useState(inicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [criado, setCriado] = useState(!novo);
  const [salvando, setSalvando] = useState(false);

  const mudar = <K extends keyof FormPublicacao>(campo: K, valor: FormPublicacao[K]) => setForm((f) => ({ ...f, [campo]: valor }));
  const pasta = `publicacoes/${id}`;

  async function salvar(acao: AcaoPublicacao) {
    const erro = validarPublicacao(form);
    if (erro) {
      toast.error(erro);
      return;
    }
    setSalvando(true);
    try {
      const slug = estado.slugFixado
        ? estado.slug
        : await escolherSlug(gerarSlug(form.titulo) || 'publicacao', (s) => slugEmUso(s, id));
      const dados = dadosParaGravar(form, acao, { ...estado, slug });
      const ref = doc(db, 'publicacoes', id);
      const autoria = { atualizadoPor: usuario?.uid, atualizadoEm: serverTimestamp() };
      if (criado) {
        await updateDoc(ref, { ...dados, ...autoria });
      } else {
        await setDoc(ref, { ...dados, ...autoria, criadoPor: usuario?.uid, criadoEm: serverTimestamp() });
        setCriado(true);
        router.replace(`/admin/publicacoes/${id}`);
      }
      setEstado({
        slug,
        slugFixado: dados.slugFixado as boolean,
        status: dados.status as 'rascunho' | 'publicada',
        publicadoEm: estado.publicadoEm ?? (acao === 'publicar' ? new Date() : null),
      });
      toast.success(
        acao === 'publicar'
          ? 'Publicação no ar! Pode levar até 5 minutos para aparecer no site.'
          : acao === 'despublicar'
            ? 'Publicação retirada do site.'
            : 'Rascunho salvo.',
      );
    } catch (e) {
      toast.error(e instanceof Error && !('code' in e) ? e.message : mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    try {
      await deleteDoc(doc(db, 'publicacoes', id));
      toast.success('Rascunho excluído.');
      router.replace('/admin/publicacoes');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    }
  }

  const publicada = estado.status === 'publicada';

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{novo && !criado ? 'Nova publicação' : 'Editar publicação'}</h1>
        <Badge variant={publicada ? 'default' : 'secondary'}>{publicada ? 'Publicada' : 'Rascunho'}</Badge>
        {publicada && (
          <a href={`/publicacoes/${estado.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm underline">
            Ver no site <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      <Campo id="pub-titulo" rotulo="Título">
        <Input id="pub-titulo" maxLength={140} value={form.titulo} onChange={(e) => mudar('titulo', e.target.value)} />
      </Campo>

      <Campo id="pub-categoria" rotulo="Categoria">
        <select
          id="pub-categoria"
          className={classeSelect}
          value={form.categoria}
          onChange={(e) => mudar('categoria', e.target.value as CategoriaPublicacao)}
        >
          {Object.entries(ROTULO_CATEGORIA).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="pub-resumo" rotulo="Resumo" ajuda={`${form.resumo.length}/280 — aparece nas listas e na prévia do link no WhatsApp.`}>
        <textarea
          id="pub-resumo"
          rows={3}
          maxLength={280}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={form.resumo}
          onChange={(e) => mudar('resumo', e.target.value)}
        />
      </Campo>

      {form.categoria === 'evento' && (
        <fieldset className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Evento</legend>
          <Campo id="ev-inicio" rotulo="Início">
            <Input id="ev-inicio" type="datetime-local" value={form.evento.inicio} onChange={(e) => mudar('evento', { ...form.evento, inicio: e.target.value })} />
          </Campo>
          <Campo id="ev-fim" rotulo="Fim (opcional)">
            <Input id="ev-fim" type="datetime-local" value={form.evento.fim} onChange={(e) => mudar('evento', { ...form.evento, fim: e.target.value })} />
          </Campo>
          <Campo id="ev-local" rotulo="Local">
            <Input id="ev-local" value={form.evento.local} onChange={(e) => mudar('evento', { ...form.evento, local: e.target.value })} />
          </Campo>
          <Campo id="ev-maps" rotulo="Link do Google Maps (opcional)">
            <Input id="ev-maps" type="url" value={form.evento.enderecoMaps} onChange={(e) => mudar('evento', { ...form.evento, enderecoMaps: e.target.value })} />
          </Campo>
        </fieldset>
      )}

      {form.categoria === 'campanha' && (
        <fieldset className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Campanha</legend>
          <Campo id="camp-inicio" rotulo="Início">
            <Input id="camp-inicio" type="date" value={form.campanha.inicio} onChange={(e) => mudar('campanha', { ...form.campanha, inicio: e.target.value })} />
          </Campo>
          <Campo id="camp-fim" rotulo="Fim">
            <Input id="camp-fim" type="date" value={form.campanha.fim} onChange={(e) => mudar('campanha', { ...form.campanha, fim: e.target.value })} />
          </Campo>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.campanha.temMeta} onChange={(e) => mudar('campanha', { ...form.campanha, temMeta: e.target.checked })} />
            Mostrar meta com barra de progresso
          </label>
          {form.campanha.temMeta && (
            <>
              <Campo id="meta-desc" rotulo="O que está sendo arrecadado" ajuda='Ex.: "brinquedos", "cestas básicas".'>
                <Input id="meta-desc" value={form.campanha.descricao} onChange={(e) => mudar('campanha', { ...form.campanha, descricao: e.target.value })} />
              </Campo>
              <div className="grid grid-cols-2 gap-4">
                <Campo id="meta-alvo" rotulo="Meta">
                  <Input id="meta-alvo" type="number" min={1} step={1} value={form.campanha.alvo || ''} onChange={(e) => mudar('campanha', { ...form.campanha, alvo: Number(e.target.value) })} />
                </Campo>
                <Campo id="meta-atual" rotulo="Arrecadado">
                  <Input id="meta-atual" type="number" min={0} step={1} value={form.campanha.atual} onChange={(e) => mudar('campanha', { ...form.campanha, atual: Number(e.target.value) })} />
                </Campo>
              </div>
            </>
          )}
        </fieldset>
      )}

      <CampoImagem pasta={pasta} rotulo="Capa" valor={form.capa} aoMudar={(capa) => mudar('capa', capa)} />

      <div className="flex flex-col gap-2">
        <Label>Texto</Label>
        <EditorTexto rotulo="Texto da publicação" valor={form.conteudoHtml} aoMudar={(html) => mudar('conteudoHtml', html)} />
      </div>

      <Galeria pasta={pasta} valor={form.galeria} aoMudar={(fotos) => mudar('galeria', fotos)} />

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {publicada ? (
          <>
            {/* Numa publicação no ar, salvar mantém o status "publicada". */}
            <Button disabled={salvando} onClick={() => void salvar('publicar')}>
              Salvar alterações
            </Button>
            <Button variant="destructive" disabled={salvando} onClick={() => void salvar('despublicar')}>
              Despublicar
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" disabled={salvando} onClick={() => void salvar('rascunho')}>
              Salvar rascunho
            </Button>
            <Button disabled={salvando} onClick={() => void salvar('publicar')}>
              Publicar
            </Button>
          </>
        )}
        {criado && !estado.publicadoEm && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" className="ml-auto text-destructive" />}>Excluir rascunho</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este rascunho?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void excluir()}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
