import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoPublicacao } from '@/components/portal/cartao-publicacao';
import { listarPublicacoes } from '@/lib/servidor/portal';
import { ROTULO_CATEGORIA, type CategoriaPublicacao } from '@/lib/tipos-portal';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Publicações' };

const POR_PAGINA = 12;
const CATEGORIAS = Object.keys(ROTULO_CATEGORIA) as CategoriaPublicacao[];

function href(categoria: CategoriaPublicacao | undefined, pagina: number) {
  const params = new URLSearchParams();
  if (categoria) params.set('categoria', categoria);
  if (pagina > 1) params.set('pagina', String(pagina));
  const qs = params.toString();
  return qs ? `/publicacoes?${qs}` : '/publicacoes';
}

export default async function Publicacoes({ searchParams }: PageProps<'/publicacoes'>) {
  const params = await searchParams;
  const categoria = CATEGORIAS.find((c) => c === params.categoria);
  const pagina = Math.max(1, Number.parseInt(String(params.pagina ?? '1'), 10) || 1);
  const { itens, haMais } = await listarPublicacoes({ categoria, pagina, porPagina: POR_PAGINA });

  const filtros: [CategoriaPublicacao | undefined, string][] = [
    [undefined, 'Todas'],
    ...CATEGORIAS.map((c): [CategoriaPublicacao, string] => [c, `${ROTULO_CATEGORIA[c]}s`]),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-titulo text-4xl font-semibold text-natal-verde">Publicações</h1>
      <nav aria-label="Filtrar por categoria" className="mt-6 flex flex-wrap gap-2">
        {filtros.map(([c, rotulo]) => (
          <Link
            key={rotulo}
            href={href(c, 1)}
            aria-current={c === categoria ? 'page' : undefined}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-natal-verde/30',
              c === categoria ? 'bg-natal-verde text-white' : 'text-natal-verde hover:bg-natal-verde/10',
            )}
          >
            {rotulo}
          </Link>
        ))}
      </nav>

      {itens.length === 0 ? (
        <p className="mt-12 text-natal-texto/70">Nenhuma publicação por aqui ainda.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((p) => (
            <CartaoPublicacao key={p.id} publicacao={p} />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-between">
        {pagina > 1 ? (
          <Link href={href(categoria, pagina - 1)} className="font-medium text-natal-vermelho hover:underline">
            ← Mais recentes
          </Link>
        ) : (
          <span />
        )}
        {haMais && (
          <Link href={href(categoria, pagina + 1)} className="font-medium text-natal-vermelho hover:underline">
            Mais antigas →
          </Link>
        )}
      </div>
    </main>
  );
}
