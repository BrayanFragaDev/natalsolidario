import { describe, expect, it } from 'vitest';
import { dadosParaGravar, dataParaInput, escolherSlug, FORM_VAZIO, validarPublicacao, type FormPublicacao } from './salvar-publicacao';

const form = (extra: Partial<FormPublicacao> = {}): FormPublicacao => ({
  ...FORM_VAZIO,
  titulo: 'Campanha Brinquedos',
  resumo: 'Arrecadação de brinquedos',
  categoria: 'campanha',
  campanha: { inicio: '2026-12-01', fim: '2026-12-24', temMeta: true, descricao: 'brinquedos', alvo: 500, atual: 250 },
  ...extra,
});

const nunca = { publicadoEm: null, slugFixado: false, slug: 'campanha-brinquedos' };

describe('escolherSlug', () => {
  it('pula slugs já usados', async () => {
    await expect(escolherSlug('natal', (s) => Promise.resolve(['natal', 'natal-2'].includes(s)))).resolves.toBe('natal-3');
    await expect(escolherSlug('livre', () => Promise.resolve(false))).resolves.toBe('livre');
  });
});

describe('dadosParaGravar', () => {
  it('publicar fixa o slug e define publicadoEm', () => {
    const d = dadosParaGravar(form(), 'publicar', nunca);
    expect(d).toMatchObject({ status: 'publicada', slugFixado: true, slug: 'campanha-brinquedos' });
    expect(d.publicadoEm).not.toBeNull();
  });

  it('depois de publicada não reenvia publicadoEm (a data do servidor fica intacta)', () => {
    const primeira = new Date('2026-11-01T12:00:00Z');
    const d = dadosParaGravar(form(), 'publicar', { publicadoEm: primeira, slugFixado: true, slug: 'x' });
    expect(d).not.toHaveProperty('publicadoEm');
  });

  it('despublicar volta a rascunho e mantém slug e data', () => {
    const primeira = new Date('2026-11-01T12:00:00Z');
    const d = dadosParaGravar(form(), 'despublicar', { publicadoEm: primeira, slugFixado: true, slug: 'x' });
    expect(d).toMatchObject({ status: 'rascunho', slug: 'x', slugFixado: true });
    expect(d).not.toHaveProperty('publicadoEm');
  });

  it('rascunho nunca publicado fica com publicadoEm nulo', () => {
    expect(dadosParaGravar(form(), 'rascunho', nunca)).toMatchObject({ status: 'rascunho', publicadoEm: null, slugFixado: false });
  });

  it('campanha: datas em São Paulo e meta numérica', () => {
    const d = dadosParaGravar(form(), 'rascunho', nunca);
    expect(d.campanha).toEqual({
      inicio: new Date('2026-12-01T03:00:00Z'),
      fim: new Date('2026-12-24T03:00:00Z'),
      meta: { descricao: 'brinquedos', alvo: 500, atual: 250 },
    });
    expect(d.evento).toBeNull();
  });

  it('campanha sem meta grava meta nula', () => {
    const f = form();
    const d = dadosParaGravar({ ...f, campanha: { ...f.campanha, temMeta: false } }, 'rascunho', nunca);
    expect((d.campanha as { meta: unknown }).meta).toBeNull();
  });

  it('notícia descarta dados de evento e campanha do formulário', () => {
    const d = dadosParaGravar(
      form({ categoria: 'noticia', evento: { inicio: '2026-12-20T19:00', fim: '', local: 'Praça', enderecoMaps: '' } }),
      'rascunho',
      nunca,
    );
    expect(d.evento).toBeNull();
    expect(d.campanha).toBeNull();
  });

  it('evento: início em São Paulo, fim e mapa opcionais', () => {
    const d = dadosParaGravar(
      form({ categoria: 'evento', evento: { inicio: '2026-12-20T19:00', fim: '', local: 'Praça', enderecoMaps: '' } }),
      'rascunho',
      nunca,
    );
    expect(d.evento).toEqual({ inicio: new Date('2026-12-20T22:00:00Z'), fim: null, local: 'Praça', enderecoMaps: null });
  });

  it('remove espaços do título e do resumo', () => {
    expect(dadosParaGravar(form({ titulo: '  Natal  ', resumo: ' r ' }), 'rascunho', nunca)).toMatchObject({
      titulo: 'Natal',
      resumo: 'r',
    });
  });
});

describe('dataParaInput', () => {
  it('converte para o valor dos inputs em São Paulo', () => {
    expect(dataParaInput(new Date('2026-12-20T22:00:00Z'), true)).toBe('2026-12-20T19:00');
    expect(dataParaInput(new Date('2026-12-25T02:30:00Z'), false)).toBe('2026-12-24');
  });

  it('ida e volta preserva o valor', () => {
    const d = dadosParaGravar(
      form({ categoria: 'evento', evento: { inicio: '2026-12-20T19:00', fim: '', local: 'Praça', enderecoMaps: '' } }),
      'rascunho',
      nunca,
    );
    expect(dataParaInput((d.evento as { inicio: Date }).inicio, true)).toBe('2026-12-20T19:00');
  });
});

describe('validarPublicacao', () => {
  it('aceita campanha válida', () => {
    expect(validarPublicacao(form())).toBeNull();
  });

  it.each([
    ['título curto', form({ titulo: 'ab' }), 'O título deve ter entre 3 e 140 caracteres.'],
    ['resumo vazio', form({ resumo: ' ' }), 'Escreva um resumo de até 280 caracteres.'],
    ['capa sem descrição', form({ capa: { url: 'u', caminho: 'c', alt: '' } }), 'Descreva a imagem de capa.'],
    ['foto sem descrição', form({ galeria: [{ url: 'u', caminho: 'c', alt: ' ' }] }), 'Descreva todas as fotos da galeria.'],
    [
      'evento sem início',
      form({ categoria: 'evento', evento: { inicio: '', fim: '', local: '', enderecoMaps: '' } }),
      'Informe a data e o horário do evento.',
    ],
    [
      'campanha com fim antes do início',
      form({ campanha: { inicio: '2026-12-10', fim: '2026-12-01', temMeta: false, descricao: '', alvo: 0, atual: 0 } }),
      'O fim da campanha deve ser igual ou posterior ao início.',
    ],
    [
      'meta com alvo zero',
      form({ campanha: { inicio: '2026-12-01', fim: '2026-12-24', temMeta: true, descricao: 'kits', alvo: 0, atual: 0 } }),
      'A meta precisa de uma descrição e de um alvo maior que zero.',
    ],
  ])('%s', (_caso, f, mensagem) => {
    expect(validarPublicacao(f)).toBe(mensagem);
  });
});
