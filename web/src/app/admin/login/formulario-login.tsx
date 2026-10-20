'use client';

import { temPermissao, type Perfil } from '@natal/shared';
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mensagemDeErro } from '@/lib/erros';
import { auth, db } from '@/lib/firebase';
import { usePermissao } from '@/lib/sessao';

const SEM_CONVITE = 'Acesso não autorizado. Peça um convite à diretoria.';
const SEM_PERFIL = 'Seu perfil não tem acesso à área administrativa.';

// O login com Google cria a conta no Auth mesmo sem convite; por isso
// confirmamos o cadastro em usuarios/{uid} logo após entrar.
async function verificarAcesso(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  const dados = snap.data();
  if (!dados || dados.ativo !== true) return SEM_CONVITE;
  if (!temPermissao((dados.perfis ?? []) as Perfil[], 'admin:acessar')) return SEM_PERFIL;
  return null;
}

export function FormularioLogin() {
  const router = useRouter();
  const motivo = useSearchParams().get('motivo');
  const podeAcessar = usePermissao('admin:acessar');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(motivo === 'sem-acesso' ? SEM_PERFIL : null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (podeAcessar) router.replace('/admin');
  }, [podeAcessar, router]);

  async function entrar(acao: () => Promise<{ user: { uid: string } }>) {
    setEnviando(true);
    setErro(null);
    setAviso(null);
    try {
      const { user } = await acao();
      const recusa = await verificarAcesso(user.uid);
      if (recusa) {
        await signOut(auth);
        setErro(recusa);
      }
    } catch (e) {
      if ((e as { code?: string }).code !== 'auth/popup-closed-by-user') setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    void entrar(() => signInWithEmailAndPassword(auth, email.trim(), senha));
  }

  async function esqueciSenha() {
    setErro(null);
    if (!email.trim()) {
      setErro('Digite seu e-mail no campo acima.');
      return;
    }
    // Mesma mensagem com ou sem conta, para não revelar quem está cadastrado.
    await sendPasswordResetEmail(auth, email.trim()).catch(() => undefined);
    setAviso('Se o e-mail estiver cadastrado, você receberá um link.');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Área administrativa</CardTitle>
        <CardDescription>Grupo Natal Solidário</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={aoEnviar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
          {aviso && (
            <p role="status" className="text-sm text-muted-foreground">
              {aviso}
            </p>
          )}
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <Button
          variant="outline"
          disabled={enviando}
          onClick={() => void entrar(() => signInWithPopup(auth, new GoogleAuthProvider()))}
        >
          Entrar com Google
        </Button>
        <Button variant="link" className="self-center" onClick={() => void esqueciSenha()}>
          Esqueci minha senha
        </Button>
      </CardContent>
    </Card>
  );
}
