import { describe, expect, it } from 'vitest';
import { imagemPrevia, linkWhatsapp, paginaValida, pixNormalizado } from './portal-links';

describe('linkWhatsapp (M4)', () => {
  it('aceita número com ou sem +55 e máscara', () => {
    expect(linkWhatsapp('+55 11 98765-4321')).toBe('https://wa.me/5511987654321');
    expect(linkWhatsapp('(11) 98765-4321')).toBe('https://wa.me/5511987654321');
  });

  it('número inválido não gera link', () => {
    expect(linkWhatsapp('123')).toBeNull();
    expect(linkWhatsapp('')).toBeNull();
  });
});

describe('paginaValida (M5)', () => {
  it('limita entre 1 e 100', () => {
    expect(paginaValida(undefined)).toBe(1);
    expect(paginaValida('abc')).toBe(1);
    expect(paginaValida('-3')).toBe(1);
    expect(paginaValida('7')).toBe(7);
    expect(paginaValida('99999')).toBe(100);
    expect(paginaValida(['2', '3'])).toBe(2);
  });
});

describe('imagemPrevia (M7)', () => {
  it('prefere a capa, depois o logo raster, senão a imagem padrão', () => {
    expect(imagemPrevia('https://x/capa.webp', 'https://x/logo.png')).toBe('https://x/capa.webp');
    expect(imagemPrevia(null, 'https://x/logo-1.png')).toBe('https://x/logo-1.png');
    expect(imagemPrevia(null, 'https://x/portal%2Flogo-1.svg?alt=media&token=t')).toBe('/og-padrao.png');
    expect(imagemPrevia(null, null)).toBe('/og-padrao.png');
  });
});

describe('pixNormalizado (I4)', () => {
  it('a prévia usa a chave como ela será gravada', () => {
    expect(pixNormalizado({ tipo: 'cpf', chave: '529.982.247-25', nomeRecebedor: 'A', cidade: 'B' }).chave).toBe('52998224725');
    expect(pixNormalizado({ tipo: 'telefone', chave: '(11) 98765-4321', nomeRecebedor: 'A', cidade: 'B' }).chave).toBe(
      '+5511987654321',
    );
  });
});
