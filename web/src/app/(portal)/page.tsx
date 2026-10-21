import { HandHeart } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { BotaoDoar } from '@/components/portal/cabecalho';
import { CartaoPublicacao } from '@/components/portal/cartao-publicacao';
import { campanhaAtiva, eventoEhFuturo } from '@/lib/portal-datas';
import { listarPorCategoria, listarPublicacoes, obterConfigPortal } from '@/lib/servidor/portal';

function Secao({ titulo, children, verTodos }: { titulo: string; children: React.ReactNode; verTodos?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-titulo text-3xl font-semibold text-natal-verde">{titulo}</h2>
        {verTodos && (
          <Link href={verTodos} className="text-sm font-medium text-natal-vermelho hover:underline">
            Ver todas
          </Link>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default async function Inicio() {
  await connection();
  const agora = new Date();
  const [config, campanhas, eventos, noticias] = await Promise.all([
    obterConfigPortal(),
    listarPorCategoria('campanha', 20),
    listarPorCategoria('evento', 50),
    listarPublicacoes({ categoria: 'noticia', pagina: 1, porPagina: 6 }),
  ]);
  const ativas = campanhas.filter((c) => c.campanha && campanhaAtiva(c.campanha, agora));
  const proximos = eventos
    .filter((e) => e.evento && eventoEhFuturo(e.evento, agora))
    .sort((a, b) => a.evento!.inicio.getTime() - b.evento!.inicio.getTime())
    .slice(0, 3);

  return (
    <main>
      <section className="bg-natal-verde text-natal-creme">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:py-24">
          <h1 className="max-w-3xl font-titulo text-4xl leading-tight font-semibold sm:text-6xl">
            {config?.frase || 'Levando o Natal a quem mais precisa.'}
          </h1>
          <div className="flex flex-wrap gap-3">
            <BotaoDoar className="px-6 py-3 text-base" />
            <Link
              href="/voluntario"
              className="inline-flex items-center gap-2 rounded-full bg-natal-creme px-6 py-3 text-base font-semibold text-natal-verde hover:bg-white"
            >
              <HandHeart className="size-5" aria-hidden />
              Quero ser voluntário
            </Link>
          </div>
        </div>
      </section>

      {config && config.numeros.length > 0 && (
        <section className="border-b border-natal-dourado/40 bg-white">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4">
            {config.numeros.map((n) => (
              <div key={n.rotulo}>
                <dt className="text-sm text-natal-texto/70">{n.rotulo}</dt>
                <dd className="font-titulo text-3xl font-semibold text-natal-vermelho">{n.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {ativas.length > 0 && (
        <Secao titulo="Campanhas em andamento" verTodos="/publicacoes?categoria=campanha">
          {ativas.map((p) => (
            <CartaoPublicacao key={p.id} publicacao={p} />
          ))}
        </Secao>
      )}

      {proximos.length > 0 && (
        <Secao titulo="Próximos eventos" verTodos="/publicacoes?categoria=evento">
          {proximos.map((p) => (
            <CartaoPublicacao key={p.id} publicacao={p} />
          ))}
        </Secao>
      )}

      {noticias.itens.length > 0 && (
        <Secao titulo="Últimas notícias" verTodos="/publicacoes?categoria=noticia">
          {noticias.itens.map((p) => (
            <CartaoPublicacao key={p.id} publicacao={p} />
          ))}
        </Secao>
      )}
    </main>
  );
}
