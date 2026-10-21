import { TEXTO_CONSENTIMENTO } from '@natal/shared';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import type { Requisicao } from '../lib/requisicao';
import { validar } from '../lib/validacao';
import { esquemaInscricao } from './esquemas';

const JANELA_MS = 24 * 60 * 60 * 1000;
const ATOR_PUBLICO = { uid: 'publico', nome: 'Formulário público' };

// Pública (sem login). O App Check e a trava de 24 h por WhatsApp contêm o spam.
// A resposta é a mesma com ou sem gravação, para não revelar números já cadastrados.
export async function inscrever(req: Requisicao): Promise<{ ok: true }> {
  const { email, observacoes, ...dados } = validar(esquemaInscricao, req.data);

  await db.runTransaction(async (tx) => {
    const trava = db.doc(`inscricoesRecentes/${dados.whatsapp}`);
    const ultima = (await tx.get(trava)).data()?.em as Timestamp | undefined;
    if (ultima && Date.now() - ultima.toMillis() < JANELA_MS) return;

    const ref = db.collection('voluntarios').doc();
    const voluntario = { ...dados, email, observacoes, status: 'novo', anotacoes: null };
    tx.create(ref, {
      ...voluntario,
      consentimento: { em: FieldValue.serverTimestamp(), texto: TEXTO_CONSENTIMENTO },
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    });
    tx.set(trava, { em: FieldValue.serverTimestamp() });
    registrarAuditoria(tx, ATOR_PUBLICO, {
      acao: 'voluntario.inscrever',
      entidade: 'voluntarios',
      entidadeId: ref.id,
      antes: null,
      depois: voluntario,
    });
  });

  return { ok: true };
}
