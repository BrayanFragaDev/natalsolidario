'use client';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { EditorTexto } from '@/components/admin/publicacoes/editor-texto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { reduzirImagem } from '@/lib/imagem';
import type { ConfigPortal } from '@/lib/tipos-portal';
import { enviarArquivo } from '@/lib/upload';

const VAZIO: ConfigPortal = { logo: null, frase: '', numeros: [], whatsapp: '', email: '', instagram: '', cnpj: '', sobreHtml: '' };
const LIMITE_LOGO_MB = 1;

function Logo({ valor, aoMudar }: { valor: ConfigPortal['logo']; aoMudar: (logo: ConfigPortal['logo']) => void }) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviando(true);
    try {
      // SVG vai como está; as demais imagens são reduzidas para 512 px.
      const dados = arquivo.type === 'image/svg+xml' ? arquivo : await reduzirImagem(arquivo, 512);
      if (dados.size > LIMITE_LOGO_MB * 1024 * 1024) throw new Error(`O logo precisa ter até ${LIMITE_LOGO_MB} MB.`);
      const extensao = dados.type === 'image/svg+xml' ? 'svg' : dados.type === 'image/webp' ? 'webp' : 'jpg';
      aoMudar(await enviarArquivo(`portal/logo-${Date.now()}.${extensao}`, dados, dados.type));
    } catch (e) {
      toast.error(e instanceof Error && !('code' in e) ? e.message : mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Logo</Label>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- prévia no admin */}
        {valor ? <img src={valor.url} alt="Logo atual" className="size-20 rounded-md border object-contain" /> : <div className="size-20 rounded-md border border-dashed" />}
        <div className="flex flex-col gap-2">
          <Input id={id} type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" disabled={enviando} onChange={(e) => void escolher(e.target.files?.[0])} />
          {valor && (
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => aoMudar(null)}>
              Remover logo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AbaGeral() {
  const [c, setC] = useState<ConfigPortal | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'config', 'portal'))
      .then((snap) => setC({ ...VAZIO, ...(snap.data() as Partial<ConfigPortal> | undefined) }))
      .catch((e) => toast.error(mensagemDeErro(e)));
  }, []);

  if (!c) return <Skeleton className="h-96 w-full" />;
  const mudar = <K extends keyof ConfigPortal>(k: K, v: ConfigPortal[K]) => setC((atual) => ({ ...atual!, [k]: v }));

  async function salvar() {
    if (!c) return;
    if (c.frase.length > 160) return toast.error('A frase de chamada deve ter até 160 caracteres.');
    setSalvando(true);
    try {
      await setDoc(doc(db, 'config', 'portal'), {
        ...c,
        frase: c.frase.trim(),
        numeros: c.numeros.filter((n) => n.rotulo.trim() && n.valor.trim()),
        atualizadoEm: serverTimestamp(),
      });
      toast.success('Configurações salvas. O site atualiza em até 5 minutos.');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Logo valor={c.logo} aoMudar={(logo) => mudar('logo', logo)} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="cfg-frase">Frase de chamada (início do site)</Label>
        <Input id="cfg-frase" maxLength={160} value={c.frase} onChange={(e) => mudar('frase', e.target.value)} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Números da ONG (até 4)</legend>
        {c.numeros.map((n, i) => (
          <div key={i} className="flex gap-2">
            <Input aria-label={`Número ${i + 1}: valor`} placeholder="1.200" className="w-32" value={n.valor} onChange={(e) => mudar('numeros', c.numeros.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))} />
            <Input aria-label={`Número ${i + 1}: descrição`} placeholder="famílias atendidas em 2025" value={n.rotulo} onChange={(e) => mudar('numeros', c.numeros.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)))} />
            <Button type="button" variant="ghost" size="icon" aria-label={`Remover número ${i + 1}`} onClick={() => mudar('numeros', c.numeros.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        {c.numeros.length < 4 && (
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => mudar('numeros', [...c.numeros, { rotulo: '', valor: '' }])}>
            <Plus /> Adicionar número
          </Button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ['whatsapp', 'WhatsApp (com DDD)'],
            ['email', 'E-mail'],
            ['instagram', 'Link do Instagram'],
            ['cnpj', 'CNPJ'],
          ] as const
        ).map(([campo, rotulo]) => (
          <div key={campo} className="flex flex-col gap-2">
            <Label htmlFor={`cfg-${campo}`}>{rotulo}</Label>
            <Input id={`cfg-${campo}`} value={c[campo]} onChange={(e) => mudar(campo, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Quem somos (página Sobre)</Label>
        <EditorTexto rotulo="Texto da página Sobre" valor={c.sobreHtml} aoMudar={(html) => mudar('sobreHtml', html)} />
      </div>

      <Button className="self-start" disabled={salvando} onClick={() => void salvar()}>
        {salvando ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
  );
}
