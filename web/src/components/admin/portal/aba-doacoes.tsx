'use client';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import type { ConfigDoacoes, PontoColeta } from '@/lib/tipos-portal';

const LIMITE_ITENS = 30;
const LIMITE_PONTOS = 20;
const PONTO_VAZIO: PontoColeta = { nome: '', endereco: '', horario: '', linkMaps: null };

export function AbaDoacoes() {
  const [c, setC] = useState<ConfigDoacoes | null>(null);
  const [novoItem, setNovoItem] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'config', 'doacoes'))
      .then((snap) => setC({ necessidades: [], pontosColeta: [], ...(snap.data() as Partial<ConfigDoacoes> | undefined) }))
      .catch((e) => toast.error(mensagemDeErro(e)));
  }, []);

  if (!c) return <Skeleton className="h-64 w-full" />;

  function adicionarItem() {
    const item = novoItem.trim();
    if (!item || !c) return;
    if (c.necessidades.length >= LIMITE_ITENS) return toast.error(`Até ${LIMITE_ITENS} itens.`);
    setC({ ...c, necessidades: [...c.necessidades, item] });
    setNovoItem('');
  }

  const mudarPonto = (i: number, ponto: Partial<PontoColeta>) =>
    setC({ ...c, pontosColeta: c.pontosColeta.map((p, j) => (j === i ? { ...p, ...ponto } : p)) });

  async function salvar() {
    if (!c) return;
    const pontos = c.pontosColeta
      .map((p) => ({ nome: p.nome.trim(), endereco: p.endereco.trim(), horario: p.horario.trim(), linkMaps: p.linkMaps?.trim() || null }))
      .filter((p) => p.nome || p.endereco);
    if (pontos.some((p) => !p.nome || !p.endereco)) return toast.error('Cada ponto de coleta precisa de nome e endereço.');
    setSalvando(true);
    try {
      await setDoc(doc(db, 'config', 'doacoes'), { necessidades: c.necessidades, pontosColeta: pontos, atualizadoEm: serverTimestamp() });
      toast.success('Doações atualizadas. O site atualiza em até 5 minutos.');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">O que estamos precisando ({c.necessidades.length}/{LIMITE_ITENS})</legend>
        <ul className="flex flex-wrap gap-2">
          {c.necessidades.map((item, i) => (
            <li key={`${item}-${i}`} className="flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm">
              {item}
              <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remover ${item}`} onClick={() => setC({ ...c, necessidades: c.necessidades.filter((_, j) => j !== i) })}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            aria-label="Novo item"
            placeholder="Ex.: Brinquedos para meninos de 8 a 10 anos"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                adicionarItem();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={adicionarItem}>
            <Plus /> Adicionar
          </Button>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Pontos de coleta ({c.pontosColeta.length}/{LIMITE_PONTOS})</legend>
        {c.pontosColeta.map((p, i) => (
          <div key={i} className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
            <Input aria-label={`Ponto ${i + 1}: nome`} placeholder="Nome do local" value={p.nome} onChange={(e) => mudarPonto(i, { nome: e.target.value })} />
            <Input aria-label={`Ponto ${i + 1}: horário`} placeholder="Seg a sex, 9h às 18h" value={p.horario} onChange={(e) => mudarPonto(i, { horario: e.target.value })} />
            <Input aria-label={`Ponto ${i + 1}: endereço`} placeholder="Endereço" className="sm:col-span-2" value={p.endereco} onChange={(e) => mudarPonto(i, { endereco: e.target.value })} />
            <Input aria-label={`Ponto ${i + 1}: link do Maps`} placeholder="Link do Google Maps (opcional)" value={p.linkMaps ?? ''} onChange={(e) => mudarPonto(i, { linkMaps: e.target.value })} />
            <Button type="button" variant="ghost" size="sm" className="justify-self-start text-destructive" onClick={() => setC({ ...c, pontosColeta: c.pontosColeta.filter((_, j) => j !== i) })}>
              <Trash2 /> Remover ponto
            </Button>
          </div>
        ))}
        {c.pontosColeta.length < LIMITE_PONTOS && (
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setC({ ...c, pontosColeta: [...c.pontosColeta, PONTO_VAZIO] })}>
            <Plus /> Adicionar ponto de coleta
          </Button>
        )}
      </fieldset>

      <Button className="self-start" disabled={salvando} onClick={() => void salvar()}>
        {salvando ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
  );
}
