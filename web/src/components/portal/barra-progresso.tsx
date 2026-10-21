import { progressoCampanha } from '@/lib/portal-datas';
import type { MetaCampanha } from '@/lib/tipos-portal';

export function BarraProgresso({ meta }: { meta: MetaCampanha | null }) {
  const percentual = progressoCampanha(meta);
  if (percentual === null || !meta) return null;
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        aria-label={`Meta: ${meta.alvo} ${meta.descricao}`}
        className="h-3 overflow-hidden rounded-full bg-natal-verde/15"
      >
        <div className="h-full rounded-full bg-natal-dourado" style={{ width: `${percentual}%` }} />
      </div>
      <p className="text-sm text-natal-texto/80">
        {meta.atual} de {meta.alvo} {meta.descricao} · {percentual}%
      </p>
    </div>
  );
}
