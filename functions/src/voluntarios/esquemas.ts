import { AJUDAS, DIAS, normalizarWhatsapp, TURNOS } from '@natal/shared';
import { z } from 'zod';
import { esquemaEmail, esquemaNome } from '../lib/validacao';

const valores = <T extends { valor: string }>(lista: readonly T[]) =>
  lista.map((item) => item.valor) as [T['valor'], ...T['valor'][]];

export const esquemaWhatsapp = z
  .string({ error: 'Informe o WhatsApp.' })
  .transform((valor, ctx) => {
    const numero = normalizarWhatsapp(valor);
    if (!numero) {
      ctx.addIssue({ code: 'custom', message: 'Informe o WhatsApp com DDD.' });
      return z.NEVER;
    }
    return numero;
  });

const listaNaoVazia = <T extends string>(opcoes: [T, ...T[]], mensagem: string) =>
  z
    .array(z.enum(opcoes, { error: mensagem }), { error: mensagem })
    .min(1, { error: mensagem })
    .transform((lista) => [...new Set(lista)]);

const opcional = (max: number, mensagem: string) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v ? v.trim() : '') || null)
    .pipe(z.string().max(max, { error: mensagem }).nullable());

export const esquemaInscricao = z
  .object(
    {
      nome: esquemaNome,
      whatsapp: esquemaWhatsapp,
      email: z
        .union([z.literal(''), z.null(), z.undefined(), esquemaEmail])
        .transform((v) => v || null),
      cidadeBairro: z
        .string({ error: 'Informe a cidade ou o bairro.' })
        .trim()
        .min(2, { error: 'Informe a cidade ou o bairro.' })
        .max(100, { error: 'Cidade/bairro com até 100 caracteres.' }),
      ajudas: listaNaoVazia(valores(AJUDAS), 'Escolha como pode ajudar.'),
      veiculo: z.boolean().nullish(),
      dias: listaNaoVazia(valores(DIAS), 'Escolha ao menos um dia.'),
      turnos: listaNaoVazia(valores(TURNOS), 'Escolha ao menos um turno.'),
      observacoes: opcional(500, 'Observações com até 500 caracteres.'),
      consentimento: z.literal(true, { error: 'É preciso autorizar o contato para enviar o cadastro.' }),
    },
    { error: 'Dados inválidos.' },
  )
  .superRefine((d, ctx) => {
    if (d.ajudas.includes('entregas') && typeof d.veiculo !== 'boolean') {
      ctx.addIssue({ code: 'custom', path: ['veiculo'], message: 'Informe se tem veículo para as entregas.' });
    }
  })
  .transform((d) => ({ ...d, veiculo: d.ajudas.includes('entregas') ? (d.veiculo ?? null) : null }));

export type Inscricao = z.infer<typeof esquemaInscricao>;
