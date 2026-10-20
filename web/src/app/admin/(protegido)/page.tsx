'use client';

import Link from 'next/link';
import { itensVisiveis } from '@/components/admin/itens-menu';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessao } from '@/lib/sessao';

export default function Painel() {
  const { perfil } = useSessao();
  const atalhos = itensVisiveis(perfil?.perfis ?? []).filter((item) => item.href !== '/admin');
  const primeiroNome = perfil?.nome.split(' ')[0] ?? '';

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, {primeiroNome}</h1>
      {atalhos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {atalhos.map(({ rotulo, href, icone: Icone }) => (
            <Link key={href} href={href} className="rounded-xl focus-visible:outline-2">
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Icone className="size-5 text-muted-foreground" aria-hidden />
                  <CardTitle>{rotulo}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Os módulos do seu perfil aparecerão aqui conforme forem lançados.</p>
      )}
    </div>
  );
}
