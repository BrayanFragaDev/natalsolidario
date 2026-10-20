'use client';

import { PERFIS, ROTULO_PERFIL, type Perfil } from '@natal/shared';
import { Checkbox } from '@/components/ui/checkbox';

export function SeletorPerfis({ valor, aoMudar }: { valor: Perfil[]; aoMudar: (perfis: Perfil[]) => void }) {
  function alternar(perfil: Perfil, marcado: boolean) {
    aoMudar(marcado ? [...valor, perfil] : valor.filter((p) => p !== perfil));
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Perfis</legend>
      {PERFIS.map((perfil) => (
        <label key={perfil} className="flex items-center gap-2 text-sm">
          <Checkbox checked={valor.includes(perfil)} onCheckedChange={(marcado) => alternar(perfil, marcado)} />
          {ROTULO_PERFIL[perfil]}
        </label>
      ))}
    </fieldset>
  );
}
