import { describe, expect, it } from 'vitest';
import type { Documento } from './tipos-portal';
import { agruparDocumentos } from './agrupar-documentos';

const doc = (id: string, categoria: Documento['categoria'], ano: number): Documento => ({
  id,
  titulo: id,
  ano,
  categoria,
  arquivo: { url: `https://x/${id}.pdf`, caminho: `transparencia/${id}.pdf`, tamanho: 1 },
  arquivado: false,
});

describe('agruparDocumentos', () => {
  it('agrupa por categoria na ordem fixa e por ano decrescente', () => {
    const grupos = agruparDocumentos([
      doc('outro', 'outros', 2024),
      doc('pc25', 'prestacao_contas', 2025),
      doc('pc26', 'prestacao_contas', 2026),
      doc('pc26b', 'prestacao_contas', 2026),
    ]);
    expect(grupos.map((g) => g.categoria)).toEqual(['prestacao_contas', 'outros']);
    expect(grupos[0]!.rotulo).toBe('Prestação de contas');
    expect(grupos[0]!.anos.map((a) => a.ano)).toEqual([2026, 2025]);
    expect(grupos[0]!.anos[0]!.documentos.map((d) => d.id)).toEqual(['pc26', 'pc26b']);
  });

  it('lista vazia não gera grupos', () => {
    expect(agruparDocumentos([])).toEqual([]);
  });
});
