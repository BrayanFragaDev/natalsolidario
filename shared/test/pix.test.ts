import { describe, expect, it } from 'vitest';
import { gerarPayloadPix, normalizarChavePix, validarChavePix } from '../src/pix';

function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

describe('gerarPayloadPix', () => {
  it('reproduz o exemplo do Manual do BR Code do Banco Central', () => {
    expect(
      gerarPayloadPix({
        chave: '123e4567-e12b-12d1-a456-426655440000',
        nomeRecebedor: 'Fulano de Tal',
        cidade: 'BRASILIA',
      }),
    ).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    );
  });

  it('remove acentos, corta nome (25) e cidade (15) e mantém o CRC válido', () => {
    const payload = gerarPayloadPix({
      chave: 'doe@ong.org',
      nomeRecebedor: 'Associação Natal Solidário de São Paulo',
      cidade: 'São José dos Campos do Sul',
    });
    expect(payload).toContain('5925Associacao Natal Solidari');
    expect(payload).toContain('6015Sao Jose dos Ca');
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });
});

describe('validarChavePix', () => {
  it.each([
    ['cpf', '529.982.247-25', true],
    ['cpf', '111.111.111-11', false],
    ['cnpj', '11.222.333/0001-81', true],
    ['cnpj', '11.222.333/0001-80', false],
    ['email', 'Doe@Ong.org', true],
    ['email', 'doe@', false],
    ['telefone', '+5511987654321', true],
    ['telefone', '11987654321', true],
    ['telefone', '1198765', false],
    ['aleatoria', '3f8e2a1c-9b7d-4e6f-8a5b-1c2d3e4f5a6b', true],
    ['aleatoria', 'abc', false],
  ] as const)('%s %s → %s', (tipo, chave, esperado) => {
    expect(validarChavePix(tipo, chave)).toBe(esperado);
  });
});

describe('normalizarChavePix', () => {
  it('normaliza por tipo', () => {
    expect(normalizarChavePix('cpf', '529.982.247-25')).toBe('52998224725');
    expect(normalizarChavePix('cnpj', '11.222.333/0001-81')).toBe('11222333000181');
    expect(normalizarChavePix('email', ' Doe@Ong.org ')).toBe('doe@ong.org');
    expect(normalizarChavePix('telefone', '(11) 98765-4321')).toBe('+5511987654321');
    expect(normalizarChavePix('telefone', '+55 11 98765-4321')).toBe('+5511987654321');
    expect(normalizarChavePix('aleatoria', '3F8E2A1C-9B7D-4E6F-8A5B-1C2D3E4F5A6B')).toBe(
      '3f8e2a1c-9b7d-4e6f-8a5b-1c2d3e4f5a6b',
    );
  });
});
