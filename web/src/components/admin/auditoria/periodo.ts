// Brasília não tem horário de verão desde 2019: o deslocamento é fixo.
const DESLOCAMENTO_SP = '-03:00';

function meiaNoiteSP(dia: string): Date {
  return new Date(`${dia}T00:00:00${DESLOCAMENTO_SP}`);
}

// Converte os campos <input type="date"> (AAAA-MM-DD, dias de São Paulo)
// nos limites usados na consulta: em >= inicio e em < fimExclusivo.
export function limitesDoPeriodo(de: string, ate: string): { inicio: Date | null; fimExclusivo: Date | null } {
  const fim = ate ? meiaNoiteSP(ate) : null;
  fim?.setUTCDate(fim.getUTCDate() + 1);
  return { inicio: de ? meiaNoiteSP(de) : null, fimExclusivo: fim };
}
