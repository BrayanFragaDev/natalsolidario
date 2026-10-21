import { temPermissao, type Perfil, type Permissao } from '@natal/shared';
import {
  FileText,
  HandHeart,
  History,
  LayoutDashboard,
  Newspaper,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface ItemMenu {
  rotulo: string;
  href: string;
  icone: LucideIcon;
  // Basta uma das permissões da lista.
  permissao: Permissao | Permissao[];
}

// Cada subprojeto acrescenta seus módulos aqui.
export const ITENS_MENU: ItemMenu[] = [
  { rotulo: 'Painel', href: '/admin', icone: LayoutDashboard, permissao: 'admin:acessar' },
  { rotulo: 'Publicações', href: '/admin/publicacoes', icone: Newspaper, permissao: 'publicacoes:editar' },
  { rotulo: 'Voluntários', href: '/admin/voluntarios', icone: HandHeart, permissao: 'voluntarios:ver' },
  { rotulo: 'Transparência', href: '/admin/transparencia', icone: FileText, permissao: 'transparencia:editar' },
  { rotulo: 'Portal', href: '/admin/portal', icone: Settings, permissao: ['portal:configurar', 'doacoes:editar'] },
  { rotulo: 'Usuários', href: '/admin/usuarios', icone: Users, permissao: 'usuarios:ver' },
  { rotulo: 'Auditoria', href: '/admin/auditoria', icone: History, permissao: 'auditoria:ver' },
];

export function podeVerItem(perfis: Perfil[], item: ItemMenu): boolean {
  const lista = Array.isArray(item.permissao) ? item.permissao : [item.permissao];
  return lista.some((p) => temPermissao(perfis, p));
}

export function itensVisiveis(perfis: Perfil[]): ItemMenu[] {
  return ITENS_MENU.filter((item) => podeVerItem(perfis, item));
}
