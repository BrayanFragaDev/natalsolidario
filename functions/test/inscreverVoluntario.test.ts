import { TEXTO_CONSENTIMENTO } from '@natal/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/lib/admin';
import { inscrever } from '../src/voluntarios/inscrever';
import { limparFirestore } from './apoio';

const valido = {
  nome: 'Maria Souza',
  whatsapp: '(11) 98765-4321',
  email: 'maria@exemplo.com',
  cidadeBairro: 'São Paulo / Mooca',
  ajudas: ['arrecadacao', 'triagem'],
  dias: ['sab'],
  turnos: ['manha', 'tarde'],
  observacoes: 'Posso ajudar aos sábados.',
  consentimento: true,
};

beforeEach(async () => {
  await limparFirestore();
});

describe('inscrever', () => {
  it('cria o voluntário, a trava de 24 h e a auditoria, sem login', async () => {
    await expect(inscrever({ data: valido })).resolves.toEqual({ ok: true });

    const voluntarios = await db.collection('voluntarios').get();
    expect(voluntarios.size).toBe(1);
    const v = voluntarios.docs[0]!.data();
    expect(v).toMatchObject({
      nome: 'Maria Souza',
      whatsapp: '11987654321',
      email: 'maria@exemplo.com',
      ajudas: ['arrecadacao', 'triagem'],
      veiculo: null,
      status: 'novo',
      anotacoes: null,
    });
    expect(v.consentimento.texto).toBe(TEXTO_CONSENTIMENTO);
    expect((await db.doc('inscricoesRecentes/11987654321').get()).exists).toBe(true);

    const auditoria = (await db.collection('auditoria').get()).docs.map((d) => d.data());
    expect(auditoria).toEqual([
      expect.objectContaining({
        atorUid: 'publico',
        atorNome: 'Formulário público',
        acao: 'voluntario.inscrever',
        entidade: 'voluntarios',
        entidadeId: voluntarios.docs[0]!.id,
      }),
    ]);
  });

  it('segundo envio do mesmo número em menos de 24 h não duplica e responde igual', async () => {
    await inscrever({ data: valido });
    await expect(inscrever({ data: { ...valido, whatsapp: '+55 11 98765-4321' } })).resolves.toEqual({ ok: true });
    expect((await db.collection('voluntarios').get()).size).toBe(1);
  });

  it('depois de 24 h aceita novo cadastro', async () => {
    await db.doc('inscricoesRecentes/11987654321').set({ em: new Date(Date.now() - 25 * 3600 * 1000) });
    await inscrever({ data: valido });
    expect((await db.collection('voluntarios').get()).size).toBe(1);
  });

  it('entregas exige informar veículo', async () => {
    await expect(inscrever({ data: { ...valido, ajudas: ['entregas'] } })).rejects.toMatchObject({
      code: 'invalid-argument',
    });
    await inscrever({ data: { ...valido, ajudas: ['entregas'], veiculo: true } });
    expect((await db.collection('voluntarios').get()).docs[0]!.data().veiculo).toBe(true);
  });

  it.each([
    ['sem consentimento', { consentimento: false }],
    ['sem ajudas', { ajudas: [] }],
    ['dia inválido', { dias: ['xyz'] }],
    ['WhatsApp curto', { whatsapp: '123' }],
    ['observações longas', { observacoes: 'a'.repeat(501) }],
    ['nome vazio', { nome: '' }],
  ])('%s → invalid-argument', async (_caso, troca) => {
    await expect(inscrever({ data: { ...valido, ...troca } })).rejects.toMatchObject({ code: 'invalid-argument' });
    expect((await db.collection('voluntarios').get()).size).toBe(0);
  });

  it('data nulo → invalid-argument em português', async () => {
    await expect(inscrever({ data: null })).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'Dados inválidos.',
    });
  });
});
