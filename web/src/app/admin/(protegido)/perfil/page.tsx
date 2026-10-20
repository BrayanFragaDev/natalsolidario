'use client';

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mensagemDeErro } from '@/lib/erros';
import { auth, db } from '@/lib/firebase';
import { useSessao } from '@/lib/sessao';

function DadosPessoais() {
  const { usuario, perfil } = useSessao();
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [telefone, setTelefone] = useState(perfil?.telefone ?? '');
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!usuario) return;
    const tel = telefone.replace(/\D/g, '');
    if (nome.trim().length < 2 || nome.trim().length > 100) {
      toast.error('O nome deve ter entre 2 e 100 caracteres.');
      return;
    }
    if (tel && !/^\d{10,11}$/.test(tel)) {
      toast.error('O telefone deve ter DDD e número (10 ou 11 dígitos).');
      return;
    }
    setSalvando(true);
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        nome: nome.trim(),
        telefone: tel || null,
        atualizadoEm: serverTimestamp(),
      });
      toast.success('Dados atualizados.');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={perfil?.email ?? ''} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              inputMode="tel"
              placeholder="11987654321"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={salvando} className="self-start">
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TrocarSenha() {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [pedirAtual, setPedirAtual] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function trocar(evento: FormEvent) {
    evento.preventDefault();
    const usuario = auth.currentUser;
    if (!usuario?.email) return;
    if (nova.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setSalvando(true);
    try {
      if (pedirAtual) {
        await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, atual));
      }
      await updatePassword(usuario, nova);
      toast.success('Senha alterada.');
      setAtual('');
      setNova('');
      setPedirAtual(false);
    } catch (e) {
      if ((e as { code?: string }).code === 'auth/requires-recent-login') {
        setPedirAtual(true);
        toast.info('Por segurança, confirme sua senha atual.');
      } else {
        toast.error(mensagemDeErro(e));
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trocar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={trocar} className="flex flex-col gap-4">
          {pedirAtual && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha-atual">Senha atual</Label>
              <Input
                id="senha-atual"
                type="password"
                autoComplete="current-password"
                required
                value={atual}
                onChange={(e) => setAtual(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha-nova">Nova senha</Label>
            <Input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              required
              value={nova}
              onChange={(e) => setNova(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={salvando} className="self-start">
            {salvando ? 'Salvando…' : 'Trocar senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function MeuPerfil() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
      <DadosPessoais />
      <TrocarSenha />
    </div>
  );
}
