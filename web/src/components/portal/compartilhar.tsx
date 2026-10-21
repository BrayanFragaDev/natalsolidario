'use client';

import { Link2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function Compartilhar({ titulo }: { titulo: string }) {
  function url() {
    return window.location.href;
  }

  async function copiar() {
    await navigator.clipboard.writeText(url());
    toast.success('Link copiado.');
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.open(`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url()}`)}`, '_blank', 'noopener');
        }}
        className="inline-flex items-center gap-2 rounded-full bg-natal-verde px-4 py-2 text-sm font-medium text-white hover:bg-natal-verde/90"
      >
        <MessageCircle className="size-4" aria-hidden />
        Compartilhar no WhatsApp
      </a>
      <button
        type="button"
        onClick={() => void copiar()}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-natal-verde ring-1 ring-natal-verde/30 hover:bg-natal-verde/10"
      >
        <Link2 className="size-4" aria-hidden />
        Copiar link
      </button>
    </div>
  );
}
