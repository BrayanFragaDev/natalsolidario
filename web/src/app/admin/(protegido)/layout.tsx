'use client';

import { signOut } from 'firebase/auth';
import { LogOut, Menu, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MenuLateral } from '@/components/admin/menu-lateral';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { usePermissao, useSessao } from '@/lib/sessao';

export default function LayoutProtegido({ children }: LayoutProps<'/admin'>) {
  const router = useRouter();
  const { carregando, usuario, perfil } = useSessao();
  const podeAcessar = usePermissao('admin:acessar');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (carregando || podeAcessar) return;
    router.replace(usuario ? '/admin/login?motivo=sem-acesso' : '/admin/login');
  }, [carregando, podeAcessar, usuario, router]);

  if (carregando || !podeAcessar) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6" aria-busy="true" aria-label="Carregando">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-1">
      <aside className="hidden w-60 shrink-0 border-r p-4 md:block">
        <p className="mb-6 px-3 text-sm font-semibold">Natal Solidário</p>
        <MenuLateral />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="p-4">
              <SheetHeader className="p-0">
                <SheetTitle>Natal Solidário</SheetTitle>
              </SheetHeader>
              <MenuLateral aoNavegar={() => setMenuAberto(false)} />
            </SheetContent>
          </Sheet>

          <span className="ml-auto truncate text-sm text-muted-foreground">{perfil?.nome}</span>
          <Button variant="ghost" size="sm" render={<Link href="/admin/perfil" />}>
            <UserRound />
            <span className="hidden sm:inline">Meu perfil</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void signOut(auth)}>
            <LogOut />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
