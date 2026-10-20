import { temPermissao, type Perfil, type Permissao } from '@natal/shared';
import { History, LayoutDashboard, Users, type LucideIcon } from 'lucide-react';

export interface ItemMenu {
  rotulo: string;
  href: string;
  icone: LucideIcon;
  permissao: Permissao;
}

// Cada subprojeto acrescenta seus módulos aqui.
export const ITENS_MENU: ItemMenu[] = [
  { rotulo: 'Painel', href: '/admin', icone: LayoutDashboard, permissao: 'admin:acessar' },
  { rotulo: 'Usuários', href: '/admin/usuarios', icone: Users, permissao: 'usuarios:ver' },
  { rotulo: 'Auditoria', href: '/admin/auditoria', icone: History, permissao: 'auditoria:ver' },
];

export function itensVisiveis(perfis: Perfil[]): ItemMenu[] {
  return ITENS_MENU.filter((item) => temPermissao(perfis, item.permissao));
}
