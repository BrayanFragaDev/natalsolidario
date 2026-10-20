import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import { exigirPermissao } from '../lib/autorizacao';
import { enviarConvite } from '../lib/email';
import type { Requisicao } from '../lib/requisicao';
import { esquemaEmail, esquemaNome, esquemaPerfis, esquemaTelefone, validar } from '../lib/validacao';

const esquemaEntrada = z.object({
  nome: esquemaNome,
  email: esquemaEmail,
  telefone: esquemaTelefone,
  perfis: esquemaPerfis,
});

export async function convidar(req: Requisicao): Promise<{ uid: string; linkConvite: string | null }> {
  const ator = await exigirPermissao(req.auth, 'usuarios:gerenciar');
  const { nome, email, telefone, perfis } = validar(esquemaEntrada, req.data);

  let uid: string;
  try {
    ({ uid } = await auth.createUser({ email, displayName: nome }));
  } catch (e) {
    if ((e as { code?: string }).code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Já existe um usuário com este e-mail.');
    }
    throw e;
  }

  try {
    await auth.setCustomUserClaims(uid, { perfis });
    const usuario = { nome, email, telefone, perfis, ativo: true, criadoPor: ator.uid };
    await db.runTransaction(async (tx) => {
      tx.create(db.doc(`usuarios/${uid}`), {
        ...usuario,
        criadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      });
      registrarAuditoria(tx, ator, {
        acao: 'usuario.convidar',
        entidade: 'usuarios',
        entidadeId: uid,
        antes: null,
        depois: usuario,
      });
    });
  } catch (e) {
    // Sem o documento, a conta ficaria órfã e bloquearia um novo convite.
    await auth.deleteUser(uid).catch(() => undefined);
    throw e;
  }

  const link = await auth.generatePasswordResetLink(email);
  const enviado = await enviarConvite(email, nome, link);
  return { uid, linkConvite: enviado ? null : link };
}
