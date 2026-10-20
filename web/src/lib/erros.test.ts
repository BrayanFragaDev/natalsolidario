import { describe, expect, it } from 'vitest';
import { mensagemDeErro } from './erros';

function erro(code: string, message = 'mensagem do servidor') {
  return Object.assign(new Error(message), { code });
}

describe('mensagemDeErro', () => {
  it.each([
    ['permission-denied', 'Você não tem permissão para esta ação.'],
    ['functions/permission-denied', 'Você não tem permissão para esta ação.'],
    ['functions/unauthenticated', 'Sua sessão expirou. Entre novamente.'],
    ['functions/already-exists', 'Já existe um usuário com este e-mail.'],
    ['auth/invalid-credential', 'E-mail ou senha incorretos.'],
    ['auth/wrong-password', 'E-mail ou senha incorretos.'],
    ['auth/user-not-found', 'E-mail ou senha incorretos.'],
    ['auth/invalid-email', 'E-mail ou senha incorretos.'],
    ['auth/user-disabled', 'Sua conta está desativada. Fale com a diretoria.'],
    ['auth/too-many-requests', 'Muitas tentativas. Aguarde alguns minutos.'],
  ])('%s', (code, esperado) => {
    expect(mensagemDeErro(erro(code))).toBe(esperado);
  });

  it('invalid-argument usa a mensagem do servidor', () => {
    expect(mensagemDeErro(erro('functions/invalid-argument', 'Informe um e-mail válido.'))).toBe(
      'Informe um e-mail válido.',
    );
  });

  it('failed-precondition usa a mensagem do servidor', () => {
    expect(
      mensagemDeErro(erro('functions/failed-precondition', 'O sistema precisa de pelo menos um administrador ativo.')),
    ).toBe('O sistema precisa de pelo menos um administrador ativo.');
  });

  it('qualquer outro erro vira mensagem genérica', () => {
    expect(mensagemDeErro(erro('functions/internal'))).toBe('Algo deu errado. Tente novamente.');
    expect(mensagemDeErro('texto solto')).toBe('Algo deu errado. Tente novamente.');
    expect(mensagemDeErro(undefined)).toBe('Algo deu errado. Tente novamente.');
  });
});
