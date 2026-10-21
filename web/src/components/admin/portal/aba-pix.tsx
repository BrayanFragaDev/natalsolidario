'use client';

import { ROTULO_TIPO_CHAVE, validarChavePix, type TipoChavePix } from '@natal/shared';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pix } from '@/components/portal/pix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '@/lib/erros';
import { db, functions } from '@/lib/firebase';
import type { ConfigPix } from '@/lib/tipos-portal';

const definirPix = httpsCallable<ConfigPix, { ok: true }>(functions, 'definirPix');

export function AbaPix() {
  const [pix, setPix] = useState<ConfigPix | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'config', 'pix'))
      .then((snap) => setPix((snap.data() as ConfigPix | undefined) ?? { tipo: 'cnpj', chave: '', nomeRecebedor: '', cidade: '' }))
      .catch((e) => toast.error(mensagemDeErro(e)));
  }, []);

  if (!pix) return <Skeleton className="h-64 w-full" />;
  const mudar = <K extends keyof ConfigPix>(k: K, v: ConfigPix[K]) => setPix((p) => ({ ...p!, [k]: v }));
  const chaveValida = validarChavePix(pix.tipo, pix.chave);
  const completo = chaveValida && pix.nomeRecebedor.trim() && pix.cidade.trim();

  async function salvar() {
    if (!pix) return;
    setSalvando(true);
    try {
      await definirPix(pix);
      toast.success('Pix atualizado. O site mostra a nova chave em até 5 minutos.');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-md bg-muted p-3 text-sm">
        Confira a chave com atenção: as doações vão para a conta ligada a ela. Toda alteração fica registrada na auditoria.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pix-tipo">Tipo da chave</Label>
          <select id="pix-tipo" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={pix.tipo} onChange={(e) => mudar('tipo', e.target.value as TipoChavePix)}>
            {Object.entries(ROTULO_TIPO_CHAVE).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pix-chave">Chave</Label>
          <Input id="pix-chave" value={pix.chave} aria-invalid={!!pix.chave && !chaveValida} onChange={(e) => mudar('chave', e.target.value)} />
          {pix.chave && !chaveValida && <p className="text-sm text-destructive">Chave inválida para o tipo escolhido.</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pix-nome">Nome do recebedor (até 25)</Label>
          <Input id="pix-nome" maxLength={25} value={pix.nomeRecebedor} onChange={(e) => mudar('nomeRecebedor', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pix-cidade">Cidade (até 15)</Label>
          <Input id="pix-cidade" maxLength={15} value={pix.cidade} onChange={(e) => mudar('cidade', e.target.value)} />
        </div>
      </div>

      {completo && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Prévia (como aparece no site)</p>
          <Pix pix={pix} />
        </div>
      )}

      <Button className="self-start" disabled={salvando || !completo} onClick={() => void salvar()}>
        {salvando ? 'Salvando…' : 'Salvar Pix'}
      </Button>
    </div>
  );
}
