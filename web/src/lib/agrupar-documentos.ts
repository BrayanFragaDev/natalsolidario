import { ROTULO_CATEGORIA_DOCUMENTO, type CategoriaDocumento, type Documento } from './tipos-portal';

const ORDEM: CategoriaDocumento[] = ['prestacao_contas', 'relatorio_atividades', 'documentos_legais', 'outros'];

export interface GrupoDocumentos {
  categoria: CategoriaDocumento;
  rotulo: string;
  anos: { ano: number; documentos: Documento[] }[];
}

export function agruparDocumentos(docs: Documento[]): GrupoDocumentos[] {
  return ORDEM.map((categoria) => {
    const daCategoria = docs.filter((d) => d.categoria === categoria);
    const anos = [...new Set(daCategoria.map((d) => d.ano))].sort((a, b) => b - a);
    return {
      categoria,
      rotulo: ROTULO_CATEGORIA_DOCUMENTO[categoria],
      anos: anos.map((ano) => ({ ano, documentos: daCategoria.filter((d) => d.ano === ano) })),
    };
  }).filter((g) => g.anos.length > 0);
}
