import type { Metadata } from 'next';
import { connection } from 'next/server';
import { sanitizarHtml } from '@/lib/sanitizar';
import { obterConfigPortal } from '@/lib/servidor/portal';

export const metadata: Metadata = { title: 'Sobre' };

export default async function Sobre() {
  await connection();
  const config = await obterConfigPortal();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="font-titulo text-4xl font-semibold text-natal-verde">Quem somos</h1>
      {config?.sobreHtml ? (
        <div className="conteudo-publicacao" dangerouslySetInnerHTML={{ __html: sanitizarHtml(config.sobreHtml) }} />
      ) : (
        <p className="text-natal-texto/70">Em breve contaremos aqui a nossa história.</p>
      )}
    </main>
  );
}
