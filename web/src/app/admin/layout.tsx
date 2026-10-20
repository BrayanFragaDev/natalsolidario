import type { Metadata } from 'next';
import { ProvedorSessao } from '@/lib/sessao';

// A área admin é renderizada no cliente, atrás do login; a validação de
// navegação instantânea do Cache Components não se aplica aqui.
export const instant = false;

export const metadata: Metadata = {
  title: 'Área administrativa',
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  return <ProvedorSessao>{children}</ProvedorSessao>;
}
