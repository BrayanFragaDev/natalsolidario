// Pix estático no padrão BR Code (EMV QRCPS) do Banco Central.

export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

export const ROTULO_TIPO_CHAVE: Record<TipoChavePix, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave aleatória',
};

const somenteDigitos = (texto: string) => texto.replace(/\D/g, '');

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = [...base].reduce((total, d, i) => total + Number(d) * pesos[i]!, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const d1 = digitoVerificador(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(cpf.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cpf.endsWith(`${d1}${d2}`);
}

function cnpjValido(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d1 = digitoVerificador(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${d1}${d2}`);
}

export function normalizarChavePix(tipo: TipoChavePix, chave: string): string {
  const valor = chave.trim();
  switch (tipo) {
    case 'cpf':
    case 'cnpj':
      return somenteDigitos(valor);
    case 'email':
    case 'aleatoria':
      return valor.toLowerCase();
    case 'telefone': {
      const digitos = somenteDigitos(valor);
      const nacional = digitos.length >= 12 && digitos.startsWith('55') ? digitos.slice(2) : digitos;
      return `+55${nacional}`;
    }
  }
}

export function validarChavePix(tipo: TipoChavePix, chave: string): boolean {
  const valor = normalizarChavePix(tipo, chave);
  switch (tipo) {
    case 'cpf':
      return cpfValido(valor);
    case 'cnpj':
      return cnpjValido(valor);
    case 'email':
      return valor.length <= 77 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    case 'telefone':
      return /^\+55\d{10,11}$/.test(valor);
    case 'aleatoria':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(valor);
  }
}

function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

// CRC16-CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF).
function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function gerarPayloadPix(d: { chave: string; nomeRecebedor: string; cidade: string; txid?: string }): string {
  const semCrc = [
    campo('00', '01'),
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', d.chave)),
    campo('52', '0000'),
    campo('53', '986'),
    campo('58', 'BR'),
    campo('59', semAcentos(d.nomeRecebedor).slice(0, 25)),
    campo('60', semAcentos(d.cidade).slice(0, 15)),
    campo('62', campo('05', d.txid || '***')),
  ].join('');
  return `${semCrc}6304${crc16(`${semCrc}6304`)}`;
}
