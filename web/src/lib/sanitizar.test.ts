import { describe, expect, it } from 'vitest';
import { sanitizarHtml } from './sanitizar';

describe('sanitizarHtml', () => {
  it('remove script, eventos, javascript:, iframe, img e style', () => {
    const limpo = sanitizarHtml(
      '<p style="color:red" onclick="x()">Oi</p><script>alert(1)</script>' +
        '<img src=x onerror=alert(1)><a href="javascript:alert(1)">link</a><iframe src="https://x.org"></iframe>',
    );
    expect(limpo).not.toMatch(/script|onerror|onclick|javascript:|iframe|<img|style=/i);
    expect(limpo).toContain('<p>Oi</p>');
  });

  it('mantém a formatação permitida e protege links', () => {
    const limpo = sanitizarHtml(
      '<h2>Título</h2><ul><li><strong>a</strong></li></ul><blockquote><em>b</em></blockquote>' +
        '<a href="https://x.org" target="_blank">site</a><a href="mailto:a@b.org">mail</a>',
    );
    expect(limpo).toContain('<h2>Título</h2>');
    expect(limpo).toContain('<ul><li><strong>a</strong></li></ul>');
    expect(limpo).toContain('<blockquote><em>b</em></blockquote>');
    expect(limpo).toContain('<a href="https://x.org" target="_blank" rel="noopener noreferrer">site</a>');
    expect(limpo).toContain('href="mailto:a@b.org"');
  });
});
