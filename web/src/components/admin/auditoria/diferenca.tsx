import { calcularDiferenca } from './calcular-diferenca';

function formatar(valor: unknown): string {
  if (valor === undefined) return '—';
  if (valor === null) return 'vazio';
  if (Array.isArray(valor)) return valor.join(', ') || 'vazio';
  if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

export function Diferenca({
  antes,
  depois,
}: {
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
}) {
  const diferencas = calcularDiferenca(antes, depois);
  if (diferencas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>;
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {diferencas.map((d) => (
        <div key={d.campo} className="contents">
          <dt className="font-medium">{d.campo}</dt>
          <dd>
            <span className="text-muted-foreground line-through">{formatar(d.antes)}</span>
            {' → '}
            <span>{formatar(d.depois)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
