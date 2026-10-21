'use client';

import { collection, doc, getDoc, type DocumentData } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormularioPublicacao } from '@/components/admin/publicacoes/formulario-publicacao';
import { dataParaInput, FORM_VAZIO, type EstadoAtual, type FormPublicacao } from '@/components/admin/publicacoes/salvar-publicacao';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { usePermissao } from '@/lib/sessao';

type Carregado = { id: string; novo: boolean; form: FormPublicacao; estado: EstadoAtual & { status: 'rascunho' | 'publicada' } };

const data = (v: { toDate?: () => Date } | null | undefined) => v?.toDate?.() ?? null;

function paraFormulario(p: DocumentData): FormPublicacao {
  const evento = p.evento;
  const campanha = p.campanha;
  return {
    titulo: p.titulo ?? '',
    categoria: p.categoria ?? 'noticia',
    resumo: p.resumo ?? '',
    conteudoHtml: p.conteudoHtml ?? '',
    capa: p.capa ?? null,
    galeria: p.galeria ?? [],
    evento: evento
      ? {
          inicio: dataParaInput(data(evento.inicio)!, true),
          fim: data(evento.fim) ? dataParaInput(data(evento.fim)!, true) : '',
          local: evento.local ?? '',
          enderecoMaps: evento.enderecoMaps ?? '',
        }
      : FORM_VAZIO.evento,
    campanha: campanha
      ? {
          inicio: dataParaInput(data(campanha.inicio)!, false),
          fim: dataParaInput(data(campanha.fim)!, false),
          temMeta: !!campanha.meta,
          descricao: campanha.meta?.descricao ?? '',
          alvo: campanha.meta?.alvo ?? 0,
          atual: campanha.meta?.atual ?? 0,
        }
      : FORM_VAZIO.campanha,
  };
}

export default function EditarPublicacao() {
  const pode = usePermissao('publicacoes:editar');
  const { id } = useParams<{ id: string }>();
  const [carregado, setCarregado] = useState<Carregado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pode) return;
    if (id === 'novo') {
      // O id é gerado antes do primeiro upload, para as imagens já irem para a pasta certa.
      queueMicrotask(() =>
        setCarregado({
          id: doc(collection(db, 'publicacoes')).id,
          novo: true,
          form: FORM_VAZIO,
          estado: { slug: '', slugFixado: false, publicadoEm: null, status: 'rascunho' },
        }),
      );
      return;
    }
    getDoc(doc(db, 'publicacoes', id))
      .then((snap) => {
        const p = snap.data();
        if (!p) {
          setErro('Publicação não encontrada.');
          return;
        }
        setCarregado({
          id,
          novo: false,
          form: paraFormulario(p),
          estado: { slug: p.slug, slugFixado: p.slugFixado === true, publicadoEm: data(p.publicadoEm), status: p.status },
        });
      })
      .catch((e) => setErro(mensagemDeErro(e)));
  }, [id, pode]);

  if (!pode) return <p className="text-muted-foreground">Você não tem permissão para editar publicações.</p>;
  if (erro) return <p role="alert" className="text-destructive">{erro}</p>;
  if (!carregado) return <Skeleton className="h-96 w-full max-w-3xl" />;

  return (
    <FormularioPublicacao
      key={carregado.id}
      id={carregado.id}
      novo={carregado.novo}
      inicial={carregado.form}
      estadoInicial={carregado.estado}
    />
  );
}
