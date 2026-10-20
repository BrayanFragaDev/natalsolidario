export const PERFIS = [
  'admin',
  'diretoria',
  'tesouraria',
  'editor',
  'almoxarifado',
  'coord_voluntarios',
  'membro',
] as const;

export type Perfil = (typeof PERFIS)[number];

export const ROTULO_PERFIL: Record<Perfil, string> = {
  admin: 'Administrador',
  diretoria: 'Diretoria',
  tesouraria: 'Tesouraria',
  editor: 'Editor',
  almoxarifado: 'Almoxarifado',
  coord_voluntarios: 'Coordenação de voluntários',
  membro: 'Membro da comunidade',
};

export type Permissao = 'admin:acessar' | 'usuarios:ver' | 'usuarios:gerenciar' | 'auditoria:ver';

// Fonte única das permissões. As regras do Firestore (firebase/firestore.rules)
// reproduzem esta tabela e são testadas contra ela.
export const PERMISSOES_POR_PERFIL: Record<Perfil, readonly Permissao[]> = {
  admin: ['admin:acessar', 'usuarios:ver', 'usuarios:gerenciar', 'auditoria:ver'],
  diretoria: ['admin:acessar', 'usuarios:ver', 'auditoria:ver'],
  tesouraria: ['admin:acessar'],
  editor: ['admin:acessar'],
  almoxarifado: ['admin:acessar'],
  coord_voluntarios: ['admin:acessar'],
  membro: [],
};

export function ehPerfil(valor: unknown): valor is Perfil {
  return typeof valor === 'string' && (PERFIS as readonly string[]).includes(valor);
}

export function temPermissao(perfis: readonly string[], permissao: Permissao): boolean {
  return perfis.some((p) => ehPerfil(p) && PERMISSOES_POR_PERFIL[p].includes(permissao));
}
