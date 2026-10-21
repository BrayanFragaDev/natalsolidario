import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// As regras do Storage validam permissão, tipo e tamanho; aqui só enviamos.
export async function enviarArquivo(caminho: string, dados: Blob, tipo: string): Promise<{ url: string; caminho: string }> {
  const destino = ref(storage, caminho);
  await uploadBytes(destino, dados, { contentType: tipo });
  return { url: await getDownloadURL(destino), caminho };
}
