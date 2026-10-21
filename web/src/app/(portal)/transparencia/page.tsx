import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { agruparDocumentos } from '@/lib/agrupar-documentos';
import { listarDocumentos } from '@/lib/servidor/portal';

export const metadata: Metadata = {
  title: 'Transparência',
  description: 'Prestações de contas, relatórios e documentos do Grupo Natal Solidário.',
};

function tamanho(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function Transparencia() {
  await connection();
  const grupos = agruparDocumentos(await listarDocumentos());

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-titulo text-4xl font-semibold text-natal-verde">Transparência</h1>
        <p className="text-lg text-natal-texto/80">Prestamos contas de cada doação recebida.</p>
      </div>

      {grupos.length === 0 && <p className="text-natal-texto/70">Os documentos serão publicados aqui em breve.</p>}

      {grupos.map((grupo) => (
        <section key={grupo.categoria} className="flex flex-col gap-4">
          <h2 className="font-titulo text-2xl font-semibold text-natal-verde">{grupo.rotulo}</h2>
          {grupo.anos.map(({ ano, documentos }) => (
            <div key={ano} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-natal-texto/60">{ano}</h3>
              <ul className="flex flex-col gap-2">
                {documentos.map((d) => (
                  <li key={d.id}>
                    <a
                      href={d.arquivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-natal-verde/10 hover:ring-natal-verde/40"
                    >
                      <FileText className="size-5 shrink-0 text-natal-vermelho" aria-hidden />
                      <span className="flex-1 font-medium">{d.titulo}</span>
                      <span className="text-sm text-natal-texto/60">PDF · {tamanho(d.arquivo.tamanho)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
