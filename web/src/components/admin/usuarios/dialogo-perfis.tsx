'use client';

import type { Perfil } from '@natal/shared';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mensagemDeErro } from '@/lib/erros';
import { functions } from '@/lib/firebase';
import type { UsuarioLista } from './filtrar-usuarios';
import { SeletorPerfis } from './seletor-perfis';

const definirPerfis = httpsCallable<{ uid: string; perfis: Perfil[] }, { ok: true }>(functions, 'definirPerfis');

export function DialogoPerfis({ usuario, aoFechar }: { usuario: UsuarioLista; aoFechar: () => void }) {
  const [perfis, setPerfis] = useState<Perfil[]>(usuario.perfis);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (perfis.length === 0) {
      toast.error('Escolha pelo menos um perfil.');
      return;
    }
    setSalvando(true);
    try {
      await definirPerfis({ uid: usuario.uid, perfis });
      toast.success('Perfis atualizados.');
      aoFechar();
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perfis de {usuario.nome}</DialogTitle>
        </DialogHeader>
        <SeletorPerfis valor={perfis} aoMudar={setPerfis} />
        <DialogFooter>
          <Button onClick={() => void salvar()} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
