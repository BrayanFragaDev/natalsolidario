'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mensagemDeErro } from '@/lib/erros';
import { reduzirImagem } from '@/lib/imagem';
import type { Midia } from '@/lib/tipos-portal';
import { enviarArquivo } from '@/lib/upload';

const LIMITE_MB = 5;

export async function enviarFoto(pasta: string, arquivo: File): Promise<Midia> {
  const reduzida = await reduzirImagem(arquivo);
  if (reduzida.size > LIMITE_MB * 1024 * 1024) throw new Error(`A imagem precisa ter até ${LIMITE_MB} MB.`);
  const extensao = reduzida.type === 'image/webp' ? 'webp' : 'jpg';
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
  const { url, caminho } = await enviarArquivo(`${pasta}/${nome}`, reduzida, reduzida.type);
  return { url, caminho, alt: '' };
}

export function erroDeUpload(e: unknown): string {
  return e instanceof Error && !('code' in e) ? e.message : mensagemDeErro(e);
}

export function CampoImagem({
  pasta,
  rotulo,
  valor,
  aoMudar,
}: {
  pasta: string;
  rotulo: string;
  valor: Midia | null;
  aoMudar: (midia: Midia | null) => void;
}) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviando(true);
    try {
      aoMudar({ ...(await enviarFoto(pasta, arquivo)), alt: valor?.alt ?? '' });
    } catch (e) {
      toast.error(erroDeUpload(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{rotulo}</Label>
      {valor ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- prévia no admin */}
          <img src={valor.url} alt="" className="h-28 w-44 rounded-md object-cover" />
          <div className="flex flex-1 flex-col gap-2">
            <Input
              aria-label={`${rotulo}: texto alternativo`}
              placeholder="Descreva a imagem (para quem usa leitor de tela)"
              value={valor.alt}
              onChange={(e) => aoMudar({ ...valor, alt: e.target.value })}
            />
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => aoMudar(null)}>
              <Trash2 />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <label htmlFor={id} className="flex h-28 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted">
          <ImagePlus className="size-5" />
          {enviando ? 'Enviando…' : 'Escolher imagem'}
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={enviando}
        onChange={(e) => {
          void escolher(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
