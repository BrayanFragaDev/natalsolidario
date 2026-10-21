import { describe, expect, it } from 'vitest';
import { PERFIS, PERMISSOES_POR_PERFIL, ROTULO_PERFIL, ehPerfil, temPermissao } from '../src/index';

describe('matriz de permissões', () => {
  it('lista os sete perfis na ordem da especificação', () => {
    expect(PERFIS).toEqual([
      'admin', 'diretoria', 'tesouraria', 'editor', 'almoxarifado', 'coord_voluntarios', 'membro',
    ]);
  });

  it('admin tem todas as permissões', () => {
    expect([...PERMISSOES_POR_PERFIL.admin].sort()).toEqual([
      'admin:acessar',
      'auditoria:ver',
      'doacoes:editar',
      'portal:configurar',
      'publicacoes:editar',
      'transparencia:editar',
      'usuarios:gerenciar',
      'usuarios:ver',
      'voluntarios:gerenciar',
      'voluntarios:ver',
    ]);
  });

  it('diretoria vê usuários e auditoria, mas não gerencia usuários', () => {
    expect(temPermissao(['diretoria'], 'admin:acessar')).toBe(true);
    expect(temPermissao(['diretoria'], 'usuarios:ver')).toBe(true);
    expect(temPermissao(['diretoria'], 'auditoria:ver')).toBe(true);
    expect(temPermissao(['diretoria'], 'usuarios:gerenciar')).toBe(false);
  });

  it.each(['almoxarifado'] as const)(
    '%s só acessa o admin',
    (perfil) => {
      expect(PERMISSOES_POR_PERFIL[perfil]).toEqual(['admin:acessar']);
    },
  );

  it('membro não tem permissão administrativa', () => {
    expect(PERMISSOES_POR_PERFIL.membro).toEqual([]);
    expect(temPermissao(['membro'], 'admin:acessar')).toBe(false);
  });

  it('une as permissões de vários perfis', () => {
    expect(temPermissao(['membro', 'diretoria'], 'usuarios:ver')).toBe(true);
  });

  it('ignora perfis desconhecidos e lista vazia', () => {
    expect(temPermissao(['hacker'], 'admin:acessar')).toBe(false);
    expect(temPermissao([], 'admin:acessar')).toBe(false);
  });

  it('reconhece apenas perfis válidos', () => {
    expect(ehPerfil('admin')).toBe(true);
    expect(ehPerfil('root')).toBe(false);
    expect(ehPerfil(undefined)).toBe(false);
  });

  it('tem rótulo em português para cada perfil', () => {
    expect(ROTULO_PERFIL.admin).toBe('Administrador');
    expect(ROTULO_PERFIL.coord_voluntarios).toBe('Coordenação de voluntários');
    expect(ROTULO_PERFIL.membro).toBe('Membro da comunidade');
    expect(Object.keys(ROTULO_PERFIL)).toHaveLength(PERFIS.length);
  });
});

describe('permissões do portal (subprojeto 2)', () => {
  it('editor publica e cuida das doações, mas não vê voluntários', () => {
    expect(temPermissao(['editor'], 'publicacoes:editar')).toBe(true);
    expect(temPermissao(['editor'], 'doacoes:editar')).toBe(true);
    expect(temPermissao(['editor'], 'voluntarios:ver')).toBe(false);
  });

  it('diretoria vê voluntários e edita transparência, sem gerenciar voluntários', () => {
    expect(temPermissao(['diretoria'], 'voluntarios:ver')).toBe(true);
    expect(temPermissao(['diretoria'], 'transparencia:editar')).toBe(true);
    expect(temPermissao(['diretoria'], 'voluntarios:gerenciar')).toBe(false);
  });

  it('tesouraria só acessa o admin e a transparência', () => {
    expect([...PERMISSOES_POR_PERFIL.tesouraria].sort()).toEqual(['admin:acessar', 'transparencia:editar']);
  });

  it('coordenação de voluntários vê e gerencia voluntários', () => {
    expect([...PERMISSOES_POR_PERFIL.coord_voluntarios].sort()).toEqual(
      ['admin:acessar', 'voluntarios:gerenciar', 'voluntarios:ver'],
    );
  });

  it('só admin configura o portal; almoxarifado não ganha nada novo', () => {
    for (const perfil of PERFIS) {
      expect(temPermissao([perfil], 'portal:configurar')).toBe(perfil === 'admin');
    }
    expect(PERMISSOES_POR_PERFIL.almoxarifado).toEqual(['admin:acessar']);
  });
});
