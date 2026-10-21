import { normalizarChavePix, normalizarWhatsapp } from '@natal/shared';
import type { ConfigPix } from './tipos-portal';

const PAGINA_MAXIMA = 100;
const IMAGEM_PADRAO = '/og-padrao.png';

export function linkWhatsapp(numero: string): string | null {
  const nacional = normalizarWhatsapp(numero);
  return nacional ? `https://wa.me/55${nacional}` : null;
}

// Limita a paginação: cada página vira uma entrada de cache e o offset é cobrado por leitura.
export function paginaValida(param: string | string[] | undefined): number {
  const valor = Number.parseInt(String(Array.isArray(param) ? param[0] : (param ?? '1')), 10);
  return Math.min(PAGINA_MAXIMA, Math.max(1, Number.isFinite(valor) ? valor : 1));
}

// WhatsApp e Facebook não exibem SVG na prévia de links.
export function imagemPrevia(capa: string | null, logo: string | null): string {
  if (capa) return capa;
  if (logo && !new URL(logo, 'https://x').pathname.toLowerCase().endsWith('.svg')) return logo;
  return IMAGEM_PADRAO;
}

export function pixNormalizado(pix: ConfigPix): ConfigPix {
  return { ...pix, chave: normalizarChavePix(pix.tipo, pix.chave) };
}
