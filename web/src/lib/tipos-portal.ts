import type { TipoChavePix } from '@natal/shared';

export type CategoriaPublicacao = 'noticia' | 'campanha' | 'evento';

export const ROTULO_CATEGORIA: Record<CategoriaPublicacao, string> = {
  noticia: 'Notícia',
  campanha: 'Campanha',
  evento: 'Evento',
};

export interface Midia {
  url: string;
  caminho: string;
  alt: string;
}

export interface MetaCampanha {
  descricao: string;
  alvo: number;
  atual: number;
}

export interface Publicacao {
  id: string;
  titulo: string;
  slug: string;
  categoria: CategoriaPublicacao;
  resumo: string;
  conteudoHtml: string;
  capa: Midia | null;
  galeria: Midia[];
  status: 'rascunho' | 'publicada';
  publicadoEm: Date | null;
  evento: { inicio: Date; fim: Date | null; local: string; enderecoMaps: string | null } | null;
  campanha: { inicio: Date; fim: Date; meta: MetaCampanha | null } | null;
}

export type CategoriaDocumento = 'prestacao_contas' | 'relatorio_atividades' | 'documentos_legais' | 'outros';

export const ROTULO_CATEGORIA_DOCUMENTO: Record<CategoriaDocumento, string> = {
  prestacao_contas: 'Prestação de contas',
  relatorio_atividades: 'Relatórios de atividades',
  documentos_legais: 'Estatuto e documentos legais',
  outros: 'Outros',
};

export interface Documento {
  id: string;
  titulo: string;
  ano: number;
  categoria: CategoriaDocumento;
  arquivo: { url: string; caminho: string; tamanho: number };
  arquivado: boolean;
}

export interface ConfigPortal {
  logo: { url: string; caminho: string } | null;
  frase: string;
  numeros: { rotulo: string; valor: string }[];
  whatsapp: string;
  email: string;
  instagram: string;
  cnpj: string;
  sobreHtml: string;
}

export interface PontoColeta {
  nome: string;
  endereco: string;
  horario: string;
  linkMaps: string | null;
}

export interface ConfigDoacoes {
  necessidades: string[];
  pontosColeta: PontoColeta[];
}

export interface ConfigPix {
  tipo: TipoChavePix;
  chave: string;
  nomeRecebedor: string;
  cidade: string;
}
