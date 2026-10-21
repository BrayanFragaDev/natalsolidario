const FUSO = 'America/Sao_Paulo';

// 'en-CA' formata como AAAA-MM-DD, que pode ser comparado como texto.
const diaSP = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO });
const dataSP = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, dateStyle: 'short' });
const horaSP = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });

// O período vale por dias inteiros de São Paulo, incluindo o último.
export function campanhaAtiva(c: { inicio: Date; fim: Date }, agora: Date): boolean {
  const hoje = diaSP.format(agora);
  return diaSP.format(c.inicio) <= hoje && hoje <= diaSP.format(c.fim);
}

export function eventoEhFuturo(e: { inicio: Date }, agora: Date): boolean {
  return e.inicio.getTime() > agora.getTime();
}

export function progressoCampanha(meta: { alvo: number; atual: number } | null): number | null {
  if (!meta || meta.alvo <= 0) return null;
  return Math.min(100, Math.max(0, Math.floor((meta.atual / meta.alvo) * 100)));
}

export function formatarData(d: Date): string {
  return dataSP.format(d);
}

export function formatarDataHora(d: Date): string {
  return `${dataSP.format(d)} às ${horaSP.format(d)}`;
}
