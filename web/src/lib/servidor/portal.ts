import 'server-only';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { cacheLife } from 'next/cache';
import type {
  CategoriaPublicacao,
  ConfigDoacoes,
  ConfigPix,
  ConfigPortal,
  Documento,
  Publicacao,
} from '@/lib/tipos-portal';
import { dbServidor } from './admin';

// Leituras públicas do portal: sempre filtram o que está publicado e ficam em
// cache por 5 minutos. Com PORTAL_SEM_CACHE=true (E2E) as páginas usam as
// versões sem cache, para enxergar cada alteração na hora.
const SEM_CACHE = process.env.PORTAL_SEM_CACHE === 'true';

function vidaCache() {
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
}

const data = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : null);

function paraPublicacao(id: string, d: DocumentData): Publicacao {
  return {
    id,
    titulo: d.titulo,
    slug: d.slug,
    categoria: d.categoria,
    resumo: d.resumo ?? '',
    conteudoHtml: d.conteudoHtml ?? '',
    capa: d.capa ?? null,
    galeria: d.galeria ?? [],
    status: d.status,
    publicadoEm: data(d.publicadoEm),
    evento: d.evento
      ? {
          inicio: data(d.evento.inicio)!,
          fim: data(d.evento.fim),
          local: d.evento.local ?? '',
          enderecoMaps: d.evento.enderecoMaps ?? null,
        }
      : null,
    campanha: d.campanha
      ? { inicio: data(d.campanha.inicio)!, fim: data(d.campanha.fim)!, meta: d.campanha.meta ?? null }
      : null,
  };
}

const publicadas = () => dbServidor.collection('publicacoes').where('status', '==', 'publicada');

interface OpcoesLista {
  categoria?: CategoriaPublicacao;
  pagina: number;
  porPagina: number;
}

async function listarPublicacoesDireto(o: OpcoesLista): Promise<{ itens: Publicacao[]; haMais: boolean }> {
  let consulta = publicadas();
  if (o.categoria) consulta = consulta.where('categoria', '==', o.categoria);
  const snap = await consulta
    .orderBy('publicadoEm', 'desc')
    .offset((o.pagina - 1) * o.porPagina)
    .limit(o.porPagina + 1)
    .get();
  const itens = snap.docs.map((d) => paraPublicacao(d.id, d.data()));
  return { itens: itens.slice(0, o.porPagina), haMais: itens.length > o.porPagina };
}

// Campanhas e eventos são poucos; o filtro por data fica na página (portal-datas.ts),
// para a data não entrar na chave do cache.
async function listarPorCategoriaDireto(categoria: CategoriaPublicacao, limite: number): Promise<Publicacao[]> {
  const snap = await publicadas().where('categoria', '==', categoria).orderBy('publicadoEm', 'desc').limit(limite).get();
  return snap.docs.map((d) => paraPublicacao(d.id, d.data()));
}

async function obterPublicacaoPorSlugDireto(slug: string): Promise<Publicacao | null> {
  const snap = await publicadas().where('slug', '==', slug).limit(1).get();
  const doc = snap.docs[0];
  return doc ? paraPublicacao(doc.id, doc.data()) : null;
}

async function listarDocumentosDireto(): Promise<Documento[]> {
  const snap = await dbServidor.collection('documentos').where('arquivado', '==', false).get();
  return snap.docs.map((d) => {
    const v = d.data();
    return { id: d.id, titulo: v.titulo, ano: v.ano, categoria: v.categoria, arquivo: v.arquivo, arquivado: false };
  });
}

async function config<T>(id: string): Promise<T | null> {
  const snap = await dbServidor.doc(`config/${id}`).get();
  return snap.exists ? (snap.data() as T) : null;
}

async function obterConfigPortalDireto(): Promise<ConfigPortal | null> {
  const c = await config<Partial<ConfigPortal>>('portal');
  return c
    ? {
        logo: c.logo ?? null,
        frase: c.frase ?? '',
        numeros: c.numeros ?? [],
        whatsapp: c.whatsapp ?? '',
        email: c.email ?? '',
        instagram: c.instagram ?? '',
        cnpj: c.cnpj ?? '',
        sobreHtml: c.sobreHtml ?? '',
      }
    : null;
}

async function obterConfigDoacoesDireto(): Promise<ConfigDoacoes | null> {
  const c = await config<Partial<ConfigDoacoes>>('doacoes');
  return c ? { necessidades: c.necessidades ?? [], pontosColeta: c.pontosColeta ?? [] } : null;
}

async function obterPixDireto(): Promise<ConfigPix | null> {
  const c = await config<ConfigPix & { atualizadoEm?: unknown }>('pix');
  return c ? { tipo: c.tipo, chave: c.chave, nomeRecebedor: c.nomeRecebedor, cidade: c.cidade } : null;
}

async function listarPorCategoriaEmCache(categoria: CategoriaPublicacao, limite: number): Promise<Publicacao[]> {
  'use cache';
  vidaCache();
  return listarPorCategoriaDireto(categoria, limite);
}
export const listarPorCategoria = SEM_CACHE ? listarPorCategoriaDireto : listarPorCategoriaEmCache;

async function obterPublicacaoPorSlugEmCache(slug: string): Promise<Publicacao | null> {
  'use cache';
  vidaCache();
  return obterPublicacaoPorSlugDireto(slug);
}
export const obterPublicacaoPorSlug = SEM_CACHE ? obterPublicacaoPorSlugDireto : obterPublicacaoPorSlugEmCache;

async function listarDocumentosEmCache(): Promise<Documento[]> {
  'use cache';
  vidaCache();
  return listarDocumentosDireto();
}
export const listarDocumentos = SEM_CACHE ? listarDocumentosDireto : listarDocumentosEmCache;

async function obterConfigPortalEmCache(): Promise<ConfigPortal | null> {
  'use cache';
  vidaCache();
  return obterConfigPortalDireto();
}
export const obterConfigPortal = SEM_CACHE ? obterConfigPortalDireto : obterConfigPortalEmCache;

async function obterConfigDoacoesEmCache(): Promise<ConfigDoacoes | null> {
  'use cache';
  vidaCache();
  return obterConfigDoacoesDireto();
}
export const obterConfigDoacoes = SEM_CACHE ? obterConfigDoacoesDireto : obterConfigDoacoesEmCache;

async function obterPixEmCache(): Promise<ConfigPix | null> {
  'use cache';
  vidaCache();
  return obterPixDireto();
}
export const obterPix = SEM_CACHE ? obterPixDireto : obterPixEmCache;

async function listarPublicacoesEmCache(o: OpcoesLista): Promise<{ itens: Publicacao[]; haMais: boolean }> {
  'use cache';
  vidaCache();
  return listarPublicacoesDireto(o);
}
export const listarPublicacoes = SEM_CACHE ? listarPublicacoesDireto : listarPublicacoesEmCache;
