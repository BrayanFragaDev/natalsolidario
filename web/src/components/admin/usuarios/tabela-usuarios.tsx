'use client';

import { ROTULO_PERFIL } from '@natal/shared';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mensagemDeErro } from '@/lib/erros';
import { functions } from '@/lib/firebase';
import { DialogoPerfis } from './dialogo-perfis';
import type { UsuarioLista } from './filtrar-usuarios';

const desativarUsuario = httpsCallable<{ uid: string }, { ok: true }>(functions, 'desativarUsuario');
const reativarUsuario = httpsCallable<{ uid: string }, { ok: true }>(functions, 'reativarUsuario');

export function TabelaUsuarios({ usuarios, podeGerenciar }: { usuarios: UsuarioLista[]; podeGerenciar: boolean }) {
  const [editando, setEditando] = useState<UsuarioLista | null>(null);
  const [desativando, setDesativando] = useState<UsuarioLista | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function executar(uid: string, acao: typeof desativarUsuario, sucesso: string) {
    setOcupado(uid);
    try {
      await acao({ uid });
      toast.success(sucesso);
    } catch (e) {
      toast.error(mensagemDeErro(e));
    } finally {
      setOcupado(null);
    }
  }

  if (usuarios.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfis</TableHead>
              <TableHead>Situação</TableHead>
              {podeGerenciar && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.uid}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.perfis.map((p) => (
                      <Badge key={p} variant="secondary">
                        {ROTULO_PERFIL[p]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? 'outline' : 'destructive'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </TableCell>
                {podeGerenciar && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditando(u)}>
                        Editar perfis
                      </Button>
                      {u.ativo ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={ocupado === u.uid}
                          onClick={() => setDesativando(u)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={ocupado === u.uid}
                          onClick={() => void executar(u.uid, reativarUsuario, `${u.nome} foi reativado(a).`)}
                        >
                          Reativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editando && <DialogoPerfis usuario={editando} aoFechar={() => setEditando(null)} />}

      <AlertDialog open={!!desativando} onOpenChange={(abrir) => !abrir && setDesativando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar {desativando?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>A pessoa perde o acesso imediatamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (desativando) {
                  void executar(desativando.uid, desativarUsuario, `${desativando.nome} foi desativado(a).`);
                }
                setDesativando(null);
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
