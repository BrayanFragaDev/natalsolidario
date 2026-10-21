import { CalendarDays, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BarraProgresso } from '@/components/portal/barra-progresso';
import { Compartilhar } from '@/components/portal/compartilhar';
import { ImagemRemota } from '@/components/portal/imagem';
import { formatarData, formatarDataHora } from '@/lib/portal-datas';
import { sanitizarHtml } from '@/lib/sanitizar';
import { obterConfigPortal, obterPublicacaoPorSlug } from '@/lib/servidor/portal';
import { ROTULO_CATEGORIA } from '@/lib/tipos-portal';

export async function generateMetadata({ params }: PageProps<'/publicacoes/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [p, config] = await Promise.all([obterPublicacaoPorSlug(slug), obterConfigPortal()]);
  if (!p) return { title: 'Publicação não encontrada' };
  const imagem = p.capa?.url ?? config?.logo?.url ?? '/og-padrao.png';
  return {
    title: p.titulo,
    description: p.resumo,
    openGraph: { title: p.titulo, description: p.resumo, type: 'article', images: [imagem] },
    twitter: { card: 'summary_large_image', title: p.titulo, description: p.resumo, images: [imagem] },
  };
}

export default async function PaginaPublicacao({ params }: PageProps<'/publicacoes/[slug]'>) {
  const { slug } = await params;
  const p = await obterPublicacaoPorSlug(slug);
  if (!p) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-semibold tracking-wide text-natal-vermelho uppercase">{ROTULO_CATEGORIA[p.categoria]}</p>
      <h1 className="mt-2 font-titulo text-4xl leading-tight font-semibold text-natal-verde sm:text-5xl">{p.titulo}</h1>
      {p.publicadoEm && <p className="mt-3 text-sm text-natal-texto/60">Publicado em {formatarData(p.publicadoEm)}</p>}

      {p.capa && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-natal-verde/10">
          <ImagemRemota src={p.capa.url} alt={p.capa.alt} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      )}

      {p.evento && (
        <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-white p-5 ring-1 ring-natal-verde/10">
          <p className="flex items-center gap-2 font-medium">
            <CalendarDays className="size-5 text-natal-vermelho" aria-hidden />
            {formatarDataHora(p.evento.inicio)}
            {p.evento.fim && ` até ${formatarDataHora(p.evento.fim)}`}
          </p>
          {p.evento.local && (
            <p className="flex items-center gap-2">
              <MapPin className="size-5 text-natal-vermelho" aria-hidden />
              {p.evento.enderecoMaps ? (
                <a href={p.evento.enderecoMaps} target="_blank" rel="noopener noreferrer" className="underline">
                  {p.evento.local}
                </a>
              ) : (
                p.evento.local
              )}
            </p>
          )}
        </div>
      )}

      {p.campanha && (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-natal-verde/10">
          <p className="font-medium">
            De {formatarData(p.campanha.inicio)} a {formatarData(p.campanha.fim)}
          </p>
          <BarraProgresso meta={p.campanha.meta} />
        </div>
      )}

      <div
        className="conteudo-publicacao mt-8"
        dangerouslySetInnerHTML={{ __html: sanitizarHtml(p.conteudoHtml) }}
      />

      {p.galeria.length > 0 && (
        <section aria-label="Galeria de fotos" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {p.galeria.map((foto) => (
            <a key={foto.caminho} href={foto.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-xl bg-natal-verde/10">
              <ImagemRemota src={foto.url} alt={foto.alt} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
            </a>
          ))}
        </section>
      )}

      <div className="mt-10 border-t border-natal-verde/10 pt-6">
        <Compartilhar titulo={p.titulo} />
      </div>
    </main>
  );
}
