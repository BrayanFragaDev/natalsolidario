'use client';

import { ImagePlus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Midia } from '@/lib/tipos-portal';
import { enviarFoto, erroDeUpload } from './campo-imagem';

const LIMITE = 20;

export function Galeria({ pasta, valor, aoMudar }: { pasta: string; valor: Midia[]; aoMudar: (fotos: Midia[]) => void }) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);

  async function adicionar(arquivos: File[]) {
    const vagas = LIMITE - valor.length;
    if (arquivos.length > vagas) toast.warning(`A galeria aceita até ${LIMITE} fotos.`);
    setEnviando(true);
    const novas: Midia[] = [];
    try {
      for (const arquivo of arquivos.slice(0, vagas)) novas.push(await enviarFoto(pasta, arquivo));
    } catch (e) {
      toast.error(erroDeUpload(e));
    } finally {
      aoMudar([...valor, ...novas]);
      setEnviando(false);
    }
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">Galeria ({valor.length}/{LIMITE})</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {valor.map((foto, i) => (
          <div key={foto.caminho} className="flex flex-col gap-2 rounded-md border p-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia no admin */}
              <img src={foto.url} alt="" className="aspect-video w-full rounded object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute top-1 right-1"
                aria-label={`Remover foto ${i + 1}`}
                onClick={() => aoMudar(valor.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </div>
            <Input
              aria-label={`Foto ${i + 1}: texto alternativo`}
              placeholder="Descrição da foto"
              value={foto.alt}
              onChange={(e) => aoMudar(valor.map((f, j) => (j === i ? { ...f, alt: e.target.value } : f)))}
            />
          </div>
        ))}
      </div>
      {valor.length < LIMITE && (
        <label htmlFor={id} className="flex cursor-pointer items-center gap-2 self-start rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <ImagePlus className="size-4" />
          {enviando ? 'Enviando…' : 'Adicionar fotos'}
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={enviando}
        onChange={(e) => {
          void adicionar([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
    </fieldset>
  );
}
