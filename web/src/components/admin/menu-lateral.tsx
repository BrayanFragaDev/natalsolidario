'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSessao } from '@/lib/sessao';
import { itensVisiveis } from './itens-menu';

export function MenuLateral({ aoNavegar }: { aoNavegar?: () => void }) {
  const { perfil } = useSessao();
  const caminho = usePathname();
  const itens = itensVisiveis(perfil?.perfis ?? []);

  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-1">
      {itens.map(({ rotulo, href, icone: Icone }) => {
        const ativo = href === '/admin' ? caminho === href : caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={aoNavegar}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
              ativo && 'bg-muted text-foreground',
              !ativo && 'text-muted-foreground',
            )}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
