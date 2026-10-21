export const AJUDAS = [
  { valor: 'arrecadacao', rotulo: 'Arrecadação' },
  { valor: 'triagem', rotulo: 'Triagem e embalagem' },
  { valor: 'entregas', rotulo: 'Entregas' },
  { valor: 'eventos', rotulo: 'Eventos' },
  { valor: 'divulgacao', rotulo: 'Divulgação e redes sociais' },
  { valor: 'outro', rotulo: 'Outro' },
] as const;

export const DIAS = [
  { valor: 'seg', rotulo: 'Segunda' },
  { valor: 'ter', rotulo: 'Terça' },
  { valor: 'qua', rotulo: 'Quarta' },
  { valor: 'qui', rotulo: 'Quinta' },
  { valor: 'sex', rotulo: 'Sexta' },
  { valor: 'sab', rotulo: 'Sábado' },
  { valor: 'dom', rotulo: 'Domingo' },
] as const;

export const TURNOS = [
  { valor: 'manha', rotulo: 'Manhã' },
  { valor: 'tarde', rotulo: 'Tarde' },
  { valor: 'noite', rotulo: 'Noite' },
] as const;

export const STATUS_VOLUNTARIO = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'ativo', rotulo: 'Ativo' },
  { valor: 'inativo', rotulo: 'Inativo' },
] as const;

export type Ajuda = (typeof AJUDAS)[number]['valor'];
export type Dia = (typeof DIAS)[number]['valor'];
export type Turno = (typeof TURNOS)[number]['valor'];
export type StatusVoluntario = (typeof STATUS_VOLUNTARIO)[number]['valor'];

export const TEXTO_CONSENTIMENTO =
  'Autorizo o Grupo Natal Solidário a usar estes dados para entrar em contato sobre ações voluntárias, conforme a LGPD.';

// Aceita máscara e o código do país; devolve DDD + número (10 ou 11 dígitos).
export function normalizarWhatsapp(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, '');
  if (digitos.length >= 12 && digitos.startsWith('55')) digitos = digitos.slice(2);
  return /^\d{10,11}$/.test(digitos) ? digitos : null;
}
