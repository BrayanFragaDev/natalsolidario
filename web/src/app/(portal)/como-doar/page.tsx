import { Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Pix } from '@/components/portal/pix';
import { obterConfigDoacoes, obterPix } from '@/lib/servidor/portal';

export const metadata: Metadata = {
  title: 'Como doar',
  description: 'Doe pelo Pix ou leve itens a um dos nossos pontos de coleta.',
};

export default async function ComoDoar() {
  await connection();
  const [pix, doacoes] = await Promise.all([obterPix(), obterConfigDoacoes()]);
  const necessidades = doacoes?.necessidades ?? [];
  const pontos = doacoes?.pontosColeta ?? [];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-12">
      <h1 className="font-titulo text-4xl font-semibold text-natal-verde">Como doar</h1>

      {pix && (
        <section className="flex flex-col gap-4">
          <h2 className="font-titulo text-2xl font-semibold text-natal-verde">Doe pelo Pix</h2>
          <Pix pix={pix} />
        </section>
      )}

      {necessidades.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-titulo text-2xl font-semibold text-natal-verde">O que estamos precisando</h2>
          <ul className="flex flex-wrap gap-2">
            {necessidades.map((item) => (
              <li key={item} className="rounded-full bg-natal-dourado/20 px-4 py-1.5 font-medium">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pontos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-titulo text-2xl font-semibold text-natal-verde">Pontos de coleta</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {pontos.map((p) => (
              <li key={p.nome} className="flex flex-col gap-2 rounded-2xl bg-white p-5 ring-1 ring-natal-verde/10">
                <p className="font-semibold">{p.nome}</p>
                <p className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-natal-vermelho" aria-hidden />
                  {p.endereco}
                </p>
                {p.horario && (
                  <p className="flex items-start gap-2 text-sm">
                    <Clock className="mt-0.5 size-4 shrink-0 text-natal-vermelho" aria-hidden />
                    {p.horario}
                  </p>
                )}
                {p.linkMaps && (
                  <a href={p.linkMaps} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-natal-vermelho hover:underline">
                    Como chegar
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!pix && necessidades.length === 0 && pontos.length === 0 && (
        <p className="text-natal-texto/70">Em breve publicaremos aqui as formas de doação.</p>
      )}
    </main>
  );
}
