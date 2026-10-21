'use client';

import { AJUDAS, DIAS, normalizarWhatsapp, TEXTO_CONSENTIMENTO, TURNOS } from '@natal/shared';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { mensagemDeErro } from '@/lib/erros';
import { functions } from '@/lib/firebase';

const inscreverVoluntario = httpsCallable(functions, 'inscreverVoluntario');

interface Dados {
  nome: string;
  whatsapp: string;
  email: string;
  cidadeBairro: string;
  ajudas: string[];
  veiculo: boolean | null;
  dias: string[];
  turnos: string[];
  observacoes: string;
  consentimento: boolean;
}

const VAZIO: Dados = {
  nome: '',
  whatsapp: '',
  email: '',
  cidadeBairro: '',
  ajudas: [],
  veiculo: null,
  dias: [],
  turnos: [],
  observacoes: '',
  consentimento: false,
};

// Mesmas regras e mensagens da Function (functions/src/voluntarios/esquemas.ts).
function validar(d: Dados): Partial<Record<keyof Dados, string>> {
  const erros: Partial<Record<keyof Dados, string>> = {};
  if (d.nome.trim().length < 2) erros.nome = 'Informe o nome.';
  if (!normalizarWhatsapp(d.whatsapp)) erros.whatsapp = 'Informe o WhatsApp com DDD.';
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) erros.email = 'Informe um e-mail válido.';
  if (d.cidadeBairro.trim().length < 2) erros.cidadeBairro = 'Informe a cidade ou o bairro.';
  if (d.ajudas.length === 0) erros.ajudas = 'Escolha como pode ajudar.';
  if (d.ajudas.includes('entregas') && d.veiculo === null) erros.veiculo = 'Informe se tem veículo para as entregas.';
  if (d.dias.length === 0) erros.dias = 'Escolha ao menos um dia.';
  if (d.turnos.length === 0) erros.turnos = 'Escolha ao menos um turno.';
  if (d.observacoes.length > 500) erros.observacoes = 'Observações com até 500 caracteres.';
  if (!d.consentimento) erros.consentimento = 'É preciso autorizar o contato para enviar o cadastro.';
  return erros;
}

const classeCampo =
  'w-full rounded-lg border border-natal-verde/25 bg-white px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-natal-verde';

function Erro({ texto }: { texto?: string }) {
  return texto ? <p className="text-sm text-natal-vermelho">{texto}</p> : null;
}

function Campo({ id, rotulo, erro, children }: { id: string; rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {rotulo}
      </label>
      {children}
      <Erro texto={erro} />
    </div>
  );
}

function Opcoes({
  legenda,
  opcoes,
  marcadas,
  aoMudar,
  erro,
}: {
  legenda: string;
  opcoes: readonly { valor: string; rotulo: string }[];
  marcadas: string[];
  aoMudar: (lista: string[]) => void;
  erro?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-natal-verde/25 has-[:checked]:bg-natal-verde has-[:checked]:text-white"
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={marcadas.includes(o.valor)}
              onChange={(e) => aoMudar(e.target.checked ? [...marcadas, o.valor] : marcadas.filter((v) => v !== o.valor))}
            />
            {o.rotulo}
          </label>
        ))}
      </div>
      <Erro texto={erro} />
    </fieldset>
  );
}

export function FormularioVoluntario() {
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<keyof Dados, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const mudar = <K extends keyof Dados>(campo: K, valor: Dados[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validar(dados);
    setErros(encontrados);
    setFalha(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      await inscreverVoluntario({
        ...dados,
        veiculo: dados.ajudas.includes('entregas') ? dados.veiculo : null,
        email: dados.email.trim() || null,
        observacoes: dados.observacoes.trim() || null,
      });
      setEnviado(true);
    } catch (e) {
      setFalha(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-natal-verde/10">
        <CheckCircle2 className="size-10 text-natal-verde" aria-hidden />
        <p className="text-lg font-medium">
          Obrigado! Recebemos seu cadastro e nossa equipe vai entrar em contato pelo WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6 rounded-2xl bg-white/60 p-6 ring-1 ring-natal-verde/10">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="vol-nome" rotulo="Nome" erro={erros.nome}>
          <input id="vol-nome" className={classeCampo} autoComplete="name" value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} />
        </Campo>
        <Campo id="vol-whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
          <input
            id="vol-whatsapp"
            className={classeCampo}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={dados.whatsapp}
            onChange={(e) => mudar('whatsapp', e.target.value)}
          />
        </Campo>
        <Campo id="vol-email" rotulo="E-mail (opcional)" erro={erros.email}>
          <input id="vol-email" type="email" className={classeCampo} autoComplete="email" value={dados.email} onChange={(e) => mudar('email', e.target.value)} />
        </Campo>
        <Campo id="vol-cidade" rotulo="Cidade / bairro" erro={erros.cidadeBairro}>
          <input id="vol-cidade" className={classeCampo} value={dados.cidadeBairro} onChange={(e) => mudar('cidadeBairro', e.target.value)} />
        </Campo>
      </div>

      <Opcoes legenda="Como pode ajudar?" opcoes={AJUDAS} marcadas={dados.ajudas} aoMudar={(v) => mudar('ajudas', v)} erro={erros.ajudas} />

      {dados.ajudas.includes('entregas') && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Tem veículo para as entregas?</legend>
          <div className="flex gap-4">
            {[
              [true, 'Sim'],
              [false, 'Não'],
            ].map(([valor, rotulo]) => (
              <label key={String(valor)} className="flex items-center gap-2">
                <input type="radio" name="veiculo" checked={dados.veiculo === valor} onChange={() => mudar('veiculo', valor as boolean)} />
                {rotulo as string}
              </label>
            ))}
          </div>
          <Erro texto={erros.veiculo} />
        </fieldset>
      )}

      <Opcoes legenda="Em quais dias?" opcoes={DIAS} marcadas={dados.dias} aoMudar={(v) => mudar('dias', v)} erro={erros.dias} />
      <Opcoes legenda="Em quais turnos?" opcoes={TURNOS} marcadas={dados.turnos} aoMudar={(v) => mudar('turnos', v)} erro={erros.turnos} />

      <Campo id="vol-obs" rotulo="Observações (opcional)" erro={erros.observacoes}>
        <textarea id="vol-obs" rows={3} maxLength={500} className={classeCampo} value={dados.observacoes} onChange={(e) => mudar('observacoes', e.target.value)} />
      </Campo>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 size-4" checked={dados.consentimento} onChange={(e) => mudar('consentimento', e.target.checked)} />
          <span>{TEXTO_CONSENTIMENTO}</span>
        </label>
        <Erro texto={erros.consentimento} />
      </div>

      {falha && (
        <p role="alert" className="rounded-lg bg-natal-vermelho/10 px-3 py-2 text-natal-vermelho">
          {falha}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-full bg-natal-vermelho px-6 py-3 font-semibold text-white hover:bg-natal-vermelho-escuro disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Enviar cadastro'}
      </button>
    </form>
  );
}
