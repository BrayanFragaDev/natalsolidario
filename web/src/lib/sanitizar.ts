import sanitize from 'sanitize-html';

// O texto das publicações vem de um editor visual, mas é gravado pelo cliente:
// tudo o que vai para o portal passa por esta lista fixa.
export function sanitizarHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ['p', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'br'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
    },
  });
}
