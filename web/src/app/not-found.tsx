import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-natal-creme px-4 py-24 text-center text-natal-texto">
      <p className="font-titulo text-6xl font-semibold text-natal-vermelho">404</p>
      <h1 className="font-titulo text-2xl font-semibold text-natal-verde">Página não encontrada</h1>
      <p className="max-w-md text-natal-texto/70">O conteúdo que você procura pode ter sido removido ou o endereço está incorreto.</p>
      <Link href="/" className="rounded-full bg-natal-vermelho px-5 py-2 font-semibold text-white hover:bg-natal-vermelho-escuro">
        Voltar ao início
      </Link>
    </main>
  );
}
