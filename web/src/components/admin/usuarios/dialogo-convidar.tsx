'use client';

import type { Perfil } from '@natal/shared';
import { httpsCallable } from 'firebase/functions';
import { Copy, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mensagemDeErro } from '@/lib/erros';
import { functions } from '@/lib/firebase';
import { SeletorPerfis } from './seletor-perfis';

const convidarUsuario = httpsCallable<
  { nome: string; email: string; telefone: string | null; perfis: Perfil[] },
  { uid: string; linkConvite: string | null }
>(functions, 'convidarUsuario');

export function DialogoConvidar() {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  function limpar() {
    setNome('');
    setEmail('');
    setTelefone('');
    setPerfis([]);
    setLink(null);
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (perfis.length === 0) {
      toast.error('Escolha pelo menos um perfil.');
      return;
    }
    setEnviando(true);
    try {
      const { data } = await convidarUsuario({
        nome,
        email,
        telefone: telefone.replace(/\D/g, '') || null,
        perfis,
      });
      if (data.linkConvite) {
        setLink(data.linkConvite);
      } else {
        toast.success(`Convite enviado para ${email.trim()}.`);
        setAberto(false);
        limpar();
      }
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado.');
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (!abrir) limpar();
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus />
        Convidar
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{link ? 'Convite criado' : 'Convidar usuário'}</DialogTitle>
          <DialogDescription>
            {link
              ? 'Envie este link para a pessoa definir a senha.'
              : 'A pessoa receberá um link para definir a própria senha.'}
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="flex flex-col gap-3">
            <Input readOnly value={link} aria-label="Link do convite" onFocus={(e) => e.target.select()} />
            <DialogFooter>
              <Button onClick={() => void copiar()}>
                <Copy />
                Copiar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="convite-nome">Nome</Label>
              <Input id="convite-nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="convite-email">E-mail</Label>
              <Input
                id="convite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="convite-telefone">Telefone (opcional)</Label>
              <Input
                id="convite-telefone"
                inputMode="tel"
                placeholder="11987654321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <SeletorPerfis valor={perfis} aoMudar={setPerfis} />
            <DialogFooter>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar convite'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
