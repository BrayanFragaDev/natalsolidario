import { PERFIS, type Perfil } from '@natal/shared';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

export const esquemaNome = z
  .string({ error: 'Informe o nome.' })
  .trim()
  .min(2, { error: 'O nome deve ter entre 2 e 100 caracteres.' })
  .max(100, { error: 'O nome deve ter entre 2 e 100 caracteres.' });

export const esquemaEmail = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Informe um e-mail válido.' }));

export const esquemaTelefone = z
  .union([z.string(), z.null(), z.undefined()], { error: 'Telefone inválido.' })
  .transform((valor) => (valor ? valor.trim() : null))
  .pipe(
    z
      .string()
      .regex(/^\d{10,11}$/, { error: 'O telefone deve ter DDD e número, só com dígitos (10 ou 11).' })
      .nullable(),
  );

export const esquemaPerfis: z.ZodType<Perfil[]> = z
  .array(z.enum(PERFIS, { error: 'Perfil inválido.' }), { error: 'Informe os perfis.' })
  .min(1, { error: 'Escolha pelo menos um perfil.' })
  .refine((perfis) => new Set(perfis).size === perfis.length, { error: 'Há perfis repetidos.' });

export const esquemaUid = z.string({ error: 'Usuário não informado.' }).min(1, { error: 'Usuário não informado.' });

export function validar<T>(esquema: z.ZodType<T>, entrada: unknown): T {
  const resultado = esquema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpsError('invalid-argument', resultado.error.issues[0]?.message ?? 'Dados inválidos.');
  }
  return resultado.data;
}
