const LADO_MAXIMO = 1600;
const QUALIDADE = 0.82;

export function dimensoesReduzidas(
  largura: number,
  altura: number,
  ladoMaximo = LADO_MAXIMO,
): { largura: number; altura: number } {
  const escala = Math.min(1, ladoMaximo / Math.max(largura, altura));
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, QUALIDADE));
}

// Reduz a foto no navegador antes do upload: economiza Storage e deixa o portal leve no celular.
export async function reduzirImagem(arquivo: File, ladoMaximo = LADO_MAXIMO): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const { largura, altura } = dimensoesReduzidas(bitmap.width, bitmap.height, ladoMaximo);
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const webp = await paraBlob(canvas, 'image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await paraBlob(canvas, 'image/jpeg');
  if (!jpeg) throw new Error('Não foi possível processar a imagem.');
  return jpeg;
}
