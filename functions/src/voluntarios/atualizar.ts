import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import { exigirPermissao, reconfirmarPermissao } from '../lib/autorizacao';
import type { Requisicao } from '../lib/requisicao';
import { esquemaUid, validar } from '../lib/validacao';

const esquemaEntrada = z
  .object(
    {
      id: esquemaUid,
      status: z.enum(['novo', 'ativo', 'inativo'], { error: 'Situação inválida.' }).optional(),
      anotacoes: z
        .union([z.string(), z.null()])
        .transform((v) => (v ? v.trim() : '') || null)
        .pipe(z.string().max(2000, { error: 'Anotações com até 2000 caracteres.' }).nullable())
        .optional(),
    },
    { error: 'Dados inválidos.' },
  )
  .refine((d) => d.status !== undefined || d.anotacoes !== undefined, { error: 'Nada para alterar.' });

export async function atualizar(req: Requisicao): Promise<{ ok: true }> {
  const ator = await exigirPermissao(req.auth, 'voluntarios:gerenciar');
  const { id, ...mudancas } = validar(esquemaEntrada, req.data);

  await db.runTransaction(async (tx) => {
    await reconfirmarPermissao(tx, ator.uid, 'voluntarios:gerenciar');
    const ref = db.doc(`voluntarios/${id}`);
    const atual = (await tx.get(ref)).data();
    if (!atual) throw new HttpsError('not-found', 'Voluntário não encontrado.');

    const campos = Object.keys(mudancas) as (keyof typeof mudancas)[];
    tx.update(ref, { ...mudancas, atualizadoEm: FieldValue.serverTimestamp() });
    registrarAuditoria(tx, ator, {
      acao: 'voluntario.atualizar',
      entidade: 'voluntarios',
      entidadeId: id,
      antes: Object.fromEntries(campos.map((c) => [c, atual[c] ?? null])),
      depois: mudancas,
    });
  });

  return { ok: true };
}
