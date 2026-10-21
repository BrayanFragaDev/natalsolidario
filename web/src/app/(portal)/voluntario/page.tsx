import type { Metadata } from 'next';
import { FormularioVoluntario } from '@/components/portal/formulario-voluntario';

export const metadata: Metadata = {
  title: 'Seja voluntário',
  description: 'Cadastre-se para ajudar nas ações do Grupo Natal Solidário.',
};

export default function Voluntario() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="font-titulo text-4xl font-semibold text-natal-verde">Seja voluntário</h1>
      <p className="text-lg text-natal-texto/80">
        Arrecadação, triagem, entregas, eventos, divulgação: tem lugar para todo mundo. Conte como você pode ajudar e
        entraremos em contato.
      </p>
      <FormularioVoluntario />
    </main>
  );
}
