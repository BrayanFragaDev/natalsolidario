import Link from 'next/link';
import { connection } from 'next/server';
import { linkWhatsapp } from '@/lib/portal-links';
import { obterConfigPortal } from '@/lib/servidor/portal';

const INSTAGRAM_PADRAO = 'https://www.instagram.com/grupo_natal_solidario/';

export async function Rodape() {
  await connection();
  const config = await obterConfigPortal();
  const instagram = config?.instagram || INSTAGRAM_PADRAO;
  const whatsapp = config ? linkWhatsapp(config.whatsapp) : null;

  return (
    <footer className="mt-16 bg-natal-verde text-natal-creme">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-titulo text-lg font-semibold">Grupo Natal Solidário</p>
          {config?.cnpj && <p className="mt-2 text-sm opacity-80">CNPJ {config.cnpj}</p>}
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Instagram
            </a>
          </li>
          {whatsapp && (
            <li>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:underline">
                WhatsApp
              </a>
            </li>
          )}
          {config?.email && (
            <li>
              <a href={`mailto:${config.email}`} className="hover:underline">
                {config.email}
              </a>
            </li>
          )}
        </ul>
        <div className="text-sm sm:text-right">
          <Link href="/admin/login" className="opacity-60 hover:opacity-100 hover:underline">
            Área restrita
          </Link>
        </div>
      </div>
    </footer>
  );
}
