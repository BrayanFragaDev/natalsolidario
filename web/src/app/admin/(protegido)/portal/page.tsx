'use client';

import { useState } from 'react';
import { AbaDoacoes } from '@/components/admin/portal/aba-doacoes';
import { AbaGeral } from '@/components/admin/portal/aba-geral';
import { AbaPix } from '@/components/admin/portal/aba-pix';
import { usePermissao } from '@/lib/sessao';
import { cn } from '@/lib/utils';

type Aba = 'geral' | 'pix' | 'doacoes';

export default function PaginaPortal() {
  const configurar = usePermissao('portal:configurar');
  const doacoes = usePermissao('doacoes:editar');
  const abas = (
    [
      ['geral', 'Geral', configurar],
      ['pix', 'Pix', configurar],
      ['doacoes', 'Doações', doacoes],
    ] as const
  ).filter(([, , pode]) => pode);
  const [escolhida, setEscolhida] = useState<Aba | null>(null);
  const atual = escolhida ?? abas[0]?.[0] ?? null;

  if (!atual) return <p className="text-muted-foreground">Você não tem permissão para configurar o portal.</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Portal</h1>
      <div role="tablist" aria-label="Configurações do portal" className="flex gap-1 border-b">
        {abas.map(([id, rotulo]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={atual === id}
            onClick={() => setEscolhida(id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium',
              atual === id ? 'border-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {atual === 'geral' && <AbaGeral />}
        {atual === 'pix' && <AbaPix />}
        {atual === 'doacoes' && <AbaDoacoes />}
      </div>
    </div>
  );
}
