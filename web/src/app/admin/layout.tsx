import type { Metadata } from 'next';
import { ProvedorSessao } from '@/lib/sessao';

export const metadata: Metadata = {
  title: 'Área administrativa',
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  return <ProvedorSessao>{children}</ProvedorSessao>;
}
