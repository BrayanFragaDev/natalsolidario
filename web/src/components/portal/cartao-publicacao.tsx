import { CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatarData, formatarDataHora } from '@/lib/portal-datas';
import { ROTULO_CATEGORIA, type Publicacao } from '@/lib/tipos-portal';
import { BarraProgresso } from './barra-progresso';
import { ImagemRemota } from './imagem';

export function CartaoPublicacao({ publicacao: p }: { publicacao: Publicacao }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-natal-verde/10 transition-shadow hover:shadow-md">
      <Link href={`/publicacoes/${p.slug}`} className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-natal-vermelho">
        <div className="relative aspect-[16/9] bg-natal-verde/10">
          {p.capa && (
            <ImagemRemota
              src={p.capa.url}
              alt={p.capa.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <span className="text-xs font-semibold tracking-wide text-natal-vermelho uppercase">
            {ROTULO_CATEGORIA[p.categoria]}
          </span>
          <h3 className="font-titulo text-xl font-semibold text-natal-verde group-hover:underline">{p.titulo}</h3>
          {p.evento && (
            <p className="flex flex-col gap-1 text-sm text-natal-texto/80">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-4" aria-hidden />
                {formatarDataHora(p.evento.inicio)}
              </span>
              {p.evento.local && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {p.evento.local}
                </span>
              )}
            </p>
          )}
          <p className="line-clamp-3 text-sm text-natal-texto/80">{p.resumo}</p>
          {p.campanha && <BarraProgresso meta={p.campanha.meta} />}
          {p.publicadoEm && !p.evento && (
            <p className="mt-auto pt-2 text-xs text-natal-texto/60">{formatarData(p.publicadoEm)}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
