import { Gift } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { obterConfigPortal } from '@/lib/servidor/portal';
import { ImagemRemota } from './imagem';
import { MenuPortal } from './menu-portal';

export function BotaoDoar({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/como-doar"
      className={`inline-flex items-center gap-2 rounded-full bg-natal-vermelho px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-natal-vermelho-escuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-natal-vermelho ${className}`}
    >
      <Gift className="size-4" aria-hidden />
      Doe agora
    </Link>
  );
}

export function CabecalhoEsqueleto() {
  return <div className="h-16 border-b border-natal-verde/10" />;
}

export async function Cabecalho() {
  await connection();
  const config = await obterConfigPortal();

  return (
    <header className="sticky top-0 z-40 border-b border-natal-verde/10 bg-natal-creme/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Grupo Natal Solidário — início">
          {config?.logo ? (
            <ImagemRemota src={config.logo.url} alt="" width={40} height={40} className="size-10 object-contain" priority />
          ) : null}
          <span className="font-titulo text-lg font-semibold text-natal-verde">Natal Solidário</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <MenuPortal />
          <BotaoDoar />
        </div>
      </div>
    </header>
  );
}
