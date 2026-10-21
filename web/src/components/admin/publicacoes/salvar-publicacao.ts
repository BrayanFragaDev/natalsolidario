import { slugComSufixo } from '@natal/shared';
import { serverTimestamp, type FieldValue } from 'firebase/firestore';
import type { CategoriaPublicacao, Midia } from '@/lib/tipos-portal';

export interface FormPublicacao {
  titulo: string;
  categoria: CategoriaPublicacao;
  resumo: string;
  conteudoHtml: string;
  capa: Midia | null;
  galeria: Midia[];
  // Valores dos inputs datetime-local / date, no horário de São Paulo.
  evento: { inicio: string; fim: string; local: string; enderecoMaps: string };
  campanha: { inicio: string; fim: string; temMeta: boolean; descricao: string; alvo: number; atual: number };
}

export const FORM_VAZIO: FormPublicacao = {
  titulo: '',
  categoria: 'noticia',
  resumo: '',
  conteudoHtml: '',
  capa: null,
  galeria: [],
  evento: { inicio: '', fim: '', local: '', enderecoMaps: '' },
  campanha: { inicio: '', fim: '', temMeta: false, descricao: '', alvo: 0, atual: 0 },
};

export type AcaoPublicacao = 'rascunho' | 'publicar' | 'despublicar';

export interface EstadoAtual {
  publicadoEm: Date | null;
  slugFixado: boolean;
  slug: string;
}

// Brasília não tem horário de verão desde 2019: o deslocamento é fixo.
const emSaoPaulo = (dataHora: string) => new Date(`${dataHora}${dataHora.length === 10 ? 'T00:00' : ''}:00-03:00`);

const partesSP = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Inverso de emSaoPaulo: valor para <input type="datetime-local"> ou <input type="date">.
export function dataParaInput(d: Date, comHora: boolean): string {
  const p = Object.fromEntries(partesSP.formatToParts(d).map((x) => [x.type, x.value]));
  const dia = `${p.year}-${p.month}-${p.day}`;
  return comHora ? `${dia}T${p.hour}:${p.minute}` : dia;
}

// Mesmos limites das regras do Firestore (publicacaoValida); devolve a primeira mensagem de erro.
export function validarPublicacao(f: FormPublicacao): string | null {
  const titulo = f.titulo.trim();
  if (titulo.length < 3 || titulo.length > 140) return 'O título deve ter entre 3 e 140 caracteres.';
  const resumo = f.resumo.trim();
  if (!resumo || resumo.length > 280) return 'Escreva um resumo de até 280 caracteres.';
  if (f.capa && !f.capa.alt.trim()) return 'Descreva a imagem de capa.';
  if (f.galeria.some((foto) => !foto.alt.trim())) return 'Descreva todas as fotos da galeria.';
  if (f.categoria === 'evento' && !f.evento.inicio) return 'Informe a data e o horário do evento.';
  if (f.categoria === 'campanha') {
    const { inicio, fim, temMeta, descricao, alvo, atual } = f.campanha;
    if (!inicio || !fim) return 'Informe o início e o fim da campanha.';
    if (fim < inicio) return 'O fim da campanha deve ser igual ou posterior ao início.';
    if (temMeta && (!descricao.trim() || !Number.isInteger(alvo) || alvo <= 0)) {
      return 'A meta precisa de uma descrição e de um alvo maior que zero.';
    }
    if (temMeta && (!Number.isInteger(atual) || atual < 0)) return 'O valor arrecadado não pode ser negativo.';
  }
  return null;
}

export async function escolherSlug(base: string, existe: (slug: string) => Promise<boolean>): Promise<string> {
  for (let n = 1; n <= 50; n++) {
    const candidato = n === 1 ? base : slugComSufixo(base, n);
    if (!(await existe(candidato))) return candidato;
  }
  throw new Error('Não foi possível gerar um endereço único para esta publicação. Ajuste o título.');
}

export function dadosParaGravar(
  form: FormPublicacao,
  acao: AcaoPublicacao,
  atual: EstadoAtual,
): Record<string, unknown> & { publicadoEm?: FieldValue | null } {
  const publicar = acao === 'publicar';
  const { evento, campanha } = form;
  return {
    titulo: form.titulo.trim(),
    categoria: form.categoria,
    resumo: form.resumo.trim(),
    conteudoHtml: form.conteudoHtml,
    capa: form.capa,
    galeria: form.galeria,
    slug: atual.slug,
    status: publicar ? 'publicada' : 'rascunho',
    // O slug é fixado na primeira publicação para não quebrar links já compartilhados.
    slugFixado: atual.slugFixado || publicar,
    // Depois da primeira publicação a data fica com o valor do servidor (as regras exigem que não mude).
    ...(atual.publicadoEm ? {} : { publicadoEm: publicar ? serverTimestamp() : null }),
    evento:
      form.categoria === 'evento'
        ? {
            inicio: emSaoPaulo(evento.inicio),
            fim: evento.fim ? emSaoPaulo(evento.fim) : null,
            local: evento.local.trim(),
            enderecoMaps: evento.enderecoMaps.trim() || null,
          }
        : null,
    campanha:
      form.categoria === 'campanha'
        ? {
            inicio: emSaoPaulo(campanha.inicio),
            fim: emSaoPaulo(campanha.fim),
            meta: campanha.temMeta
              ? { descricao: campanha.descricao.trim(), alvo: campanha.alvo, atual: campanha.atual }
              : null,
          }
        : null,
  };
}
