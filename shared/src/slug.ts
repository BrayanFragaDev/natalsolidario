const LIMITE = 80;

function aparar(slug: string): string {
  return slug.slice(0, LIMITE).replace(/-+$/, '');
}

export function gerarSlug(titulo: string): string {
  return aparar(
    titulo
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  );
}

export function slugComSufixo(base: string, n: number): string {
  const sufixo = `-${n}`;
  return `${aparar(base.slice(0, LIMITE - sufixo.length))}${sufixo}`;
}
