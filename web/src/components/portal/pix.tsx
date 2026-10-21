'use client';

import { gerarPayloadPix, ROTULO_TIPO_CHAVE } from '@natal/shared';
import { Copy } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ConfigPix } from '@/lib/tipos-portal';

function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(texto).then(() => toast.success('Copiado!'))}
      className="inline-flex items-center gap-2 rounded-full bg-natal-verde px-4 py-2 text-sm font-medium text-white hover:bg-natal-verde/90"
    >
      <Copy className="size-4" aria-hidden />
      {rotulo}
    </button>
  );
}

export function Pix({ pix }: { pix: ConfigPix }) {
  const payload = useMemo(
    () => gerarPayloadPix({ chave: pix.chave, nomeRecebedor: pix.nomeRecebedor, cidade: pix.cidade }),
    [pix],
  );
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(payload, { margin: 1, width: 280, color: { dark: '#1f5135', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [payload]);

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-natal-verde/10 sm:flex-row sm:items-center">
      <div className="mx-auto size-[220px] shrink-0 sm:mx-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no navegador como data URL */}
        {qr && <img src={qr} alt="QR Code do Pix" width={220} height={220} />}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <p>
          <span className="text-sm text-natal-texto/70">Recebedor</span>
          <br />
          <strong>{pix.nomeRecebedor}</strong>
        </p>
        <p>
          <span className="text-sm text-natal-texto/70">Chave ({ROTULO_TIPO_CHAVE[pix.tipo]})</span>
          <br />
          <strong className="break-all" data-testid="chave-pix">
            {pix.chave}
          </strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={pix.chave} rotulo="Copiar chave" />
          <BotaoCopiar texto={payload} rotulo="Copiar Pix copia e cola" />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-natal-texto/70">Ver código Pix copia e cola</summary>
          <code className="mt-2 block break-all rounded bg-natal-creme p-2" data-testid="pix-copia-e-cola">
            {payload}
          </code>
        </details>
      </div>
    </div>
  );
}
