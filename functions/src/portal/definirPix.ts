import { normalizarChavePix, textoValidoPix, validarChavePix, type TipoChavePix } from '@natal/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../lib/admin';
import { registrarAuditoria } from '../lib/auditoria';
import { exigirPermissao, reconfirmarPermissao } from '../lib/autorizacao';
import type { Requisicao } from '../lib/requisicao';
import { validar } from '../lib/validacao';

const MENSAGEM_CHAVE: Record<TipoChavePix, string> = {
  cpf: 'CPF inválido.',
  cnpj: 'CNPJ inválido.',
  email: 'E-mail inválido.',
  telefone: 'Telefone inválido. Use DDD e número.',
  aleatoria: 'Chave aleatória inválida.',
};

const texto = (max: number, rotulo: string) =>
  z
    .string({ error: `Informe ${rotulo}.` })
    .trim()
    .min(1, { error: `Informe ${rotulo}.` })
    .max(max, { error: `${rotulo[0]!.toUpperCase()}${rotulo.slice(1)} com até ${max} caracteres.` });

const esquemaEntrada = z
  .object(
    {
      tipo: z.enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'], { error: 'Tipo de chave inválido.' }),
      chave: z.string({ error: 'Informe a chave.' }),
      nomeRecebedor: texto(25, 'o nome do recebedor'),
      cidade: texto(15, 'a cidade'),
    },
    { error: 'Dados inválidos.' },
  )
  .superRefine((d, ctx) => {
    if (!validarChavePix(d.tipo, d.chave)) ctx.addIssue({ code: 'custom', message: MENSAGEM_CHAVE[d.tipo] });
    // O BR Code só leva ASCII: um texto feito só de emojis/símbolos ficaria vazio.
    if (!textoValidoPix(d.nomeRecebedor)) {
      ctx.addIssue({ code: 'custom', message: 'Use letras e números no nome do recebedor.' });
    }
    if (!textoValidoPix(d.cidade)) ctx.addIssue({ code: 'custom', message: 'Use letras e números na cidade.' });
  })
  .transform((d) => ({ ...d, chave: normalizarChavePix(d.tipo, d.chave) }));

// A chave Pix decide para onde vão as doações: só o admin altera, sempre com auditoria.
export async function definirPixHandler(req: Requisicao): Promise<{ ok: true }> {
  const ator = await exigirPermissao(req.auth, 'portal:configurar');
  const pix = validar(esquemaEntrada, req.data);

  await db.runTransaction(async (tx) => {
    await reconfirmarPermissao(tx, ator.uid, 'portal:configurar');
    const ref = db.doc('config/pix');
    const atual = (await tx.get(ref)).data();
    tx.set(ref, { ...pix, atualizadoEm: FieldValue.serverTimestamp() });
    registrarAuditoria(tx, ator, {
      acao: 'pix.definir',
      entidade: 'config',
      entidadeId: 'pix',
      antes: atual
        ? { tipo: atual.tipo, chave: atual.chave, nomeRecebedor: atual.nomeRecebedor, cidade: atual.cidade }
        : null,
      depois: pix,
    });
  });

  return { ok: true };
}
