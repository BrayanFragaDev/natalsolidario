const MENSAGENS: Record<string, string> = {
  'permission-denied': 'Você não tem permissão para esta ação.',
  unauthenticated: 'Sua sessão expirou. Entre novamente.',
  'already-exists': 'Já existe um usuário com este e-mail.',
  // Com a proteção contra enumeração de e-mails o Auth devolve só invalid-credential;
  // sem ela (e no emulador), os códigos específicos abaixo.
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail ou senha incorretos.',
  'auth/user-disabled': 'Sua conta está desativada. Fale com a diretoria.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
};

// Erros cuja mensagem vem do servidor já em português.
const USA_MENSAGEM_DO_SERVIDOR = new Set(['invalid-argument', 'failed-precondition', 'not-found']);

const GENERICA = 'Algo deu errado. Tente novamente.';

export function mensagemDeErro(e: unknown): string {
  if (typeof e !== 'object' || e === null || !('code' in e) || typeof e.code !== 'string') {
    return GENERICA;
  }
  // Erros das Functions chegam como "functions/<código>"; os do Firestore, sem prefixo.
  const codigo = e.code.replace(/^(functions|firestore)\//, '');
  if (USA_MENSAGEM_DO_SERVIDOR.has(codigo) && e instanceof Error && e.message) {
    return e.message;
  }
  return MENSAGENS[codigo] ?? GENERICA;
}
