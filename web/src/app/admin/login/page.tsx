import { Suspense } from 'react';
import { FormularioLogin } from './formulario-login';

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}
