import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import { exigirPermissao, reconfirmarPermissao } from '../lib/autorizacao';
import { enviarConvite } from '../lib/email';
import type { Requisicao } from '../lib/requisicao';
import { esquemaEmail, esquemaNome, esquemaPerfis, esquemaTelefone, validar } from '../lib/validacao';

const esquemaEntrada = z.object({
  nome: esquemaNome,
  email: esquemaEmail,
  telefone: esquemaTelefone,
  perfis: esquemaPerfis,
});

// Um login com Google sem convite cria a conta no Auth sem documento em
// usuarios. Essa conta é adotada no convite; só há conflito se já houver cadastro.
async function obterConta(email: string, nome: string): Promise<{ uid: string; criada: boolean }> {
  try {
    const { uid } = await auth.createUser({ email, displayName: nome });
    return { uid, criada: true };
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/email-already-exists') throw e;
  }
  const { uid } = await auth.getUserByEmail(email);
  if ((await db.doc(`usuarios/${uid}`).get()).exists) {
    throw new HttpsError('already-exists', 'Já existe um usuário com este e-mail.');
  }
  await auth.updateUser(uid, { displayName: nome, disabled: false });
  return { uid, criada: false };
}

export async function convidar(req: Requisicao): Promise<{ uid: string; linkConvite: string | null }> {
  const ator = await exigirPermissao(req.auth, 'usuarios:gerenciar');
  const { nome, email, telefone, perfis } = validar(esquemaEntrada, req.data);

  const { uid, criada } = await obterConta(email, nome);

  try {
    await auth.setCustomUserClaims(uid, { perfis });
    const usuario = { nome, email, telefone, perfis, ativo: true, criadoPor: ator.uid };
    await db.runTransaction(async (tx) => {
      await reconfirmarPermissao(tx, ator.uid, 'usuarios:gerenciar');
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
    // Sem o documento, a conta criada aqui ficaria órfã. Uma conta adotada
    // já existia antes do convite e é mantida.
    if (criada) await auth.deleteUser(uid).catch(() => undefined);
    throw e;
  }

  const link = await auth.generatePasswordResetLink(email);
  const enviado = await enviarConvite(email, nome, link);
  return { uid, linkConvite: enviado ? null : link };
}
