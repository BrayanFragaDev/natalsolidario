export interface Diferenca {
  campo: string;
  antes: unknown;
  depois: unknown;
}

function iguais(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function calcularDiferenca(
  antes: Record<string, unknown> | null,
  depois: Record<string, unknown> | null,
): Diferenca[] {
  const campos = [...new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})])].sort();
  return campos
    .map((campo) => ({ campo, antes: antes?.[campo], depois: depois?.[campo] }))
    .filter((d) => !iguais(d.antes, d.depois));
}
