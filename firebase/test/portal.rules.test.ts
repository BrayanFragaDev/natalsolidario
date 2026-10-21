import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import type { Perfil } from '@natal/shared';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-natal-solidario',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

const PESSOAS: Record<string, Perfil[]> = {
  adm: ['admin'],
  ed: ['editor'],
  dir: ['diretoria'],
  tes: ['tesouraria'],
  coord: ['coord_voluntarios'],
  alm: ['almoxarifado'],
};

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, perfis] of Object.entries(PESSOAS)) {
      await setDoc(doc(db, `usuarios/${uid}`), { nome: uid, email: `${uid}@x.org`, perfis, ativo: true });
    }
    await setDoc(doc(db, 'publicacoes/pub'), publicacao({ status: 'publicada', slugFixado: true, publicadoEm: new Date() }));
    await setDoc(doc(db, 'publicacoes/rasc'), publicacao({}));
    await setDoc(doc(db, 'voluntarios/v1'), { nome: 'Vol', status: 'novo' });
    await setDoc(doc(db, 'inscricoesRecentes/11987654321'), { em: new Date() });
    await setDoc(doc(db, 'documentos/aberto'), documento({ arquivado: false }));
    await setDoc(doc(db, 'documentos/arq'), documento({ arquivado: true }));
    await setDoc(doc(db, 'config/portal'), { frase: 'Natal' });
    await setDoc(doc(db, 'config/doacoes'), { necessidades: [], pontosColeta: [] });
    await setDoc(doc(db, 'config/pix'), { tipo: 'cpf', chave: '52998224725' });
  });
});

function publicacao(extra: object) {
  return {
    titulo: 'Campanha de Natal',
    slug: 'campanha-de-natal',
    categoria: 'campanha',
    resumo: 'Resumo curto',
    conteudoHtml: '<p>Texto</p>',
    capa: null,
    galeria: [],
    status: 'rascunho',
    publicadoEm: null,
    slugFixado: false,
    evento: null,
    campanha: null,
    criadoPor: 'ed',
    ...extra,
  };
}

function documento(extra: object) {
  return { titulo: 'Prestação 2025', ano: 2025, categoria: 'prestacao_contas', arquivado: false, ...extra };
}

const como = (uid: string) => env.authenticatedContext(uid).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

describe('publicacoes: leitura', () => {
  it('anônimo lê publicada e não lê rascunho', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'publicacoes/pub')));
    await assertFails(getDoc(doc(anonimo(), 'publicacoes/rasc')));
  });

  it('editor lê rascunho; almoxarifado não', async () => {
    await assertSucceeds(getDoc(doc(como('ed'), 'publicacoes/rasc')));
    await assertFails(getDoc(doc(como('alm'), 'publicacoes/rasc')));
  });
});

describe('publicacoes: escrita', () => {
  it('editor cria publicação válida; diretoria não', async () => {
    await assertSucceeds(setDoc(doc(como('ed'), 'publicacoes/nova'), publicacao({ criadoEm: serverTimestamp() })));
    await assertFails(setDoc(doc(como('dir'), 'publicacoes/nova2'), publicacao({})));
  });

  it('recusa título curto, categoria inválida e galeria acima de 20', async () => {
    await assertFails(setDoc(doc(como('ed'), 'publicacoes/x1'), publicacao({ titulo: 'ab' })));
    await assertFails(setDoc(doc(como('ed'), 'publicacoes/x2'), publicacao({ categoria: 'outra' })));
    await assertFails(setDoc(doc(como('ed'), 'publicacoes/x3'), publicacao({ resumo: 'a'.repeat(281) })));
    await assertFails(
      setDoc(doc(como('ed'), 'publicacoes/x4'), publicacao({ galeria: Array.from({ length: 21 }, () => ({})) })),
    );
  });

  it('slug fixado não muda', async () => {
    await assertFails(updateDoc(doc(como('ed'), 'publicacoes/pub'), { slug: 'outro' }));
    await assertSucceeds(updateDoc(doc(como('ed'), 'publicacoes/pub'), { titulo: 'Novo título' }));
    await assertSucceeds(updateDoc(doc(como('ed'), 'publicacoes/rasc'), { slug: 'outro' }));
  });

  it('apaga rascunho nunca publicado, mas não o que já foi publicado', async () => {
    await assertSucceeds(deleteDoc(doc(como('ed'), 'publicacoes/rasc')));
    await assertFails(deleteDoc(doc(como('ed'), 'publicacoes/pub')));
  });
});

describe('voluntarios', () => {
  it('anônimo, editor e tesouraria não leem', async () => {
    await assertFails(getDoc(doc(anonimo(), 'voluntarios/v1')));
    await assertFails(getDoc(doc(como('ed'), 'voluntarios/v1')));
    await assertFails(getDoc(doc(como('tes'), 'voluntarios/v1')));
  });

  it('diretoria, coordenação e admin leem', async () => {
    for (const uid of ['dir', 'coord', 'adm']) await assertSucceeds(getDoc(doc(como(uid), 'voluntarios/v1')));
  });

  it('ninguém escreve direto; inscricoesRecentes é inacessível', async () => {
    await assertFails(setDoc(doc(anonimo(), 'voluntarios/v2'), { nome: 'X' }));
    await assertFails(updateDoc(doc(como('coord'), 'voluntarios/v1'), { status: 'ativo' }));
    await assertFails(getDoc(doc(como('adm'), 'inscricoesRecentes/11987654321')));
  });
});

describe('documentos', () => {
  it('anônimo lê só não arquivado', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'documentos/aberto')));
    await assertFails(getDoc(doc(anonimo(), 'documentos/arq')));
  });

  it('tesouraria cria e arquiva; editor não cria; ninguém apaga', async () => {
    await assertSucceeds(setDoc(doc(como('tes'), 'documentos/novo'), documento({})));
    await assertSucceeds(updateDoc(doc(como('tes'), 'documentos/aberto'), { arquivado: true }));
    await assertFails(setDoc(doc(como('ed'), 'documentos/novo2'), documento({})));
    await assertFails(setDoc(doc(como('tes'), 'documentos/novo3'), documento({ categoria: 'xyz' })));
    await assertFails(deleteDoc(doc(como('adm'), 'documentos/aberto')));
  });
});

describe('config', () => {
  it('anônimo lê as três configs', async () => {
    for (const id of ['portal', 'doacoes', 'pix']) await assertSucceeds(getDoc(doc(anonimo(), `config/${id}`)));
  });

  it('só admin grava portal; editor grava doações; ninguém grava pix', async () => {
    await assertSucceeds(updateDoc(doc(como('adm'), 'config/portal'), { frase: 'Feliz Natal' }));
    await assertFails(updateDoc(doc(como('ed'), 'config/portal'), { frase: 'x' }));
    await assertSucceeds(updateDoc(doc(como('ed'), 'config/doacoes'), { necessidades: ['Arroz'] }));
    await assertFails(updateDoc(doc(como('dir'), 'config/doacoes'), { necessidades: ['x'] }));
    await assertFails(updateDoc(doc(como('adm'), 'config/pix'), { chave: 'outra' }));
  });

  it('documento de config fora da lista é negado', async () => {
    await assertFails(setDoc(doc(como('adm'), 'config/outro'), { a: 1 }));
  });
});

describe('correções da revisão', () => {
  it('não desfixa o slug para trocá-lo depois (I1)', async () => {
    await assertFails(updateDoc(doc(como('ed'), 'publicacoes/pub'), { slugFixado: false }));
  });

  it('não zera publicadoEm de publicação já publicada (I2)', async () => {
    await assertFails(updateDoc(doc(como('ed'), 'publicacoes/pub'), { publicadoEm: null }));
    await assertFails(updateDoc(doc(como('ed'), 'publicacoes/pub'), { publicadoEm: new Date('2020-01-01') }));
  });

  it('rascunho nunca publicado pode receber publicadoEm (primeira publicação)', async () => {
    await assertSucceeds(
      updateDoc(doc(como('ed'), 'publicacoes/rasc'), { status: 'publicada', slugFixado: true, publicadoEm: serverTimestamp() }),
    );
  });

  it('evento e campanha exigem datas (M1)', async () => {
    await assertFails(
      setDoc(doc(como('ed'), 'publicacoes/ev1'), publicacao({ categoria: 'evento', evento: { local: 'Praça' } })),
    );
    await assertSucceeds(
      setDoc(
        doc(como('ed'), 'publicacoes/ev2'),
        publicacao({ categoria: 'evento', evento: { inicio: new Date(), fim: null, local: 'Praça', enderecoMaps: null } }),
      ),
    );
    await assertFails(
      setDoc(doc(como('ed'), 'publicacoes/c1'), publicacao({ campanha: { inicio: new Date(), meta: null } })),
    );
  });

  it('ano do documento entre 2000 e o ano seguinte (M1)', async () => {
    await assertFails(setDoc(doc(como('tes'), 'documentos/velho'), documento({ ano: 1999 })));
    await assertFails(setDoc(doc(como('tes'), 'documentos/futuro'), documento({ ano: new Date().getFullYear() + 2 })));
  });
});
