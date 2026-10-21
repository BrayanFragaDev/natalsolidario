export default function Carregando() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12" aria-busy="true" aria-label="Carregando">
      <div className="h-10 w-2/3 animate-pulse rounded-md bg-natal-verde/10" />
      <div className="mt-6 h-40 animate-pulse rounded-xl bg-natal-verde/10" />
    </div>
  );
}
