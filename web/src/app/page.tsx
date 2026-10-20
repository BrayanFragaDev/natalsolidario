// Página provisória: o portal público é o subprojeto 2.
export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Grupo Natal Solidário</h1>
      <p className="max-w-md text-muted-foreground">
        Nosso site está em construção. Enquanto isso, acompanhe nossas ações pelo Instagram.
      </p>
      <a
        href="https://www.instagram.com/grupo_natal_solidario/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline underline-offset-4"
      >
        @grupo_natal_solidario
      </a>
    </main>
  );
}
