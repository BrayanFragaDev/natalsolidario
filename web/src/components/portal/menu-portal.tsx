'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export const LINKS_PORTAL = [
  { rotulo: 'Início', href: '/' },
  { rotulo: 'Publicações', href: '/publicacoes' },
  { rotulo: 'Como doar', href: '/como-doar' },
  { rotulo: 'Seja voluntário', href: '/voluntario' },
  { rotulo: 'Transparência', href: '/transparencia' },
  { rotulo: 'Sobre', href: '/sobre' },
];

function Links({ aoNavegar, vertical }: { aoNavegar?: () => void; vertical?: boolean }) {
  const caminho = usePathname();
  return (
    <nav aria-label="Menu do portal" className={cn('flex gap-1', vertical ? 'flex-col' : 'items-center')}>
      {LINKS_PORTAL.map(({ rotulo, href }) => {
        const ativo = href === '/' ? caminho === '/' : caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={aoNavegar}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium text-natal-verde transition-colors hover:bg-natal-verde/10',
              ativo && 'bg-natal-verde/10',
            )}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function MenuPortal() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <div className="hidden lg:block">
        <Links />
      </div>
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="text-natal-verde lg:hidden" aria-label="Abrir menu" />}
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="right" className="bg-natal-creme p-4">
          <SheetHeader className="p-0">
            <SheetTitle className="font-titulo text-natal-verde">Grupo Natal Solidário</SheetTitle>
          </SheetHeader>
          <Links vertical aoNavegar={() => setAberto(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
