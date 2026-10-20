import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import { exigirPermissao, reconfirmarPermissao } from '../lib/autorizacao';
import type { Requisicao } from '../lib/requisicao';
import { esquemaUid, validar } from '../lib/validacao';
import { garantirOutroAdminAtivo } from './guardaUltimoAdmin';

const esquemaEntrada = z.object({ uid: esquemaUid });

async function alterarSituacao(req: Requisicao, ativo: boolean): Promise<{ ok: true }> {
  const ator = await exigirPermissao(req.auth, 'usuarios:gerenciar');
  const { uid } = validar(esquemaEntrada, req.data);

  await db.runTransaction(async (tx) => {
    await reconfirmarPermissao(tx, ator.uid, 'usuarios:gerenciar');
    const ref = db.doc(`usuarios/${uid}`);
    const snap = await tx.get(ref);
    const atual = snap.data();
    if (!atual) throw new HttpsError('not-found', 'Usuário não encontrado.');

    if (!ativo && atual.ativo === true && (atual.perfis ?? []).includes('admin')) {
      await garantirOutroAdminAtivo(tx, uid);
    }

    tx.update(ref, { ativo, atualizadoEm: FieldValue.serverTimestamp() });
    registrarAuditoria(tx, ator, {
      acao: ativo ? 'usuario.reativar' : 'usuario.desativar',
      entidade: 'usuarios',
      entidadeId: uid,
      antes: { ativo: atual.ativo === true },
      depois: { ativo },
    });
  });

  await auth.updateUser(uid, { disabled: !ativo });
  if (!ativo) await auth.revokeRefreshTokens(uid);
  return { ok: true };
}

export function desativar(req: Requisicao): Promise<{ ok: true }> {
  return alterarSituacao(req, false);
}

export function reativar(req: Requisicao): Promise<{ ok: true }> {
  return alterarSituacao(req, true);
}
