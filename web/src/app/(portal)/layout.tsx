import { Suspense } from 'react';
import { Cabecalho, CabecalhoEsqueleto } from '@/components/portal/cabecalho';
import { Rodape } from '@/components/portal/rodape';

export default function LayoutPortal({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-natal-creme text-natal-texto">
      <Suspense fallback={<CabecalhoEsqueleto />}>
        <Cabecalho />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Suspense>
        <Rodape />
      </Suspense>
    </div>
  );
}
