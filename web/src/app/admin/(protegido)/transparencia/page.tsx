'use client';

import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { FileUp } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mensagemDeErro } from '@/lib/erros';
import { db } from '@/lib/firebase';
import { usePermissao, useSessao } from '@/lib/sessao';
import { ROTULO_CATEGORIA_DOCUMENTO, type CategoriaDocumento, type Documento } from '@/lib/tipos-portal';
import { enviarArquivo } from '@/lib/upload';

const LIMITE_MB = 20;
const classeSelect = 'h-9 rounded-md border border-input bg-transparent px-3 text-sm';
const anoAtual = new Date().getFullYear();

function FormularioDocumento() {
  const { usuario } = useSessao();
  const [titulo, setTitulo] = useState('');
  const [ano, setAno] = useState(anoAtual);
  const [categoria, setCategoria] = useState<CategoriaDocumento>('prestacao_contas');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [chave, setChave] = useState(0);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 3 || titulo.trim().length > 140) return toast.error('O título deve ter entre 3 e 140 caracteres.');
    if (!Number.isInteger(ano) || ano < 2000 || ano > anoAtual + 1) return toast.error(`Informe um ano entre 2000 e ${anoAtual + 1}.`);
    if (!arquivo || arquivo.type !== 'application/pdf') return toast.error('Escolha um arquivo PDF.');
    if (arquivo.size > LIMITE_MB * 1024 * 1024) return toast.error(`O PDF precisa ter até ${LIMITE_MB} MB.`);

    setEnviando(true);
    try {
      const ref = doc(collection(db, 'documentos'));
      const enviado = await enviarArquivo(`transparencia/${ref.id}.pdf`, arquivo, 'application/pdf');
      await setDoc(ref, {
        titulo: titulo.trim(),
        ano,
        categoria,
        arquivo: { ...enviado, tamanho: arquivo.size },
        arquivado: false,
        criadoPor: usuario?.uid,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
      toast.success('Documento publicado. Pode levar até 5 minutos para aparecer no site.');
      setTitulo('');
      setArquivo(null);
      setChave((c) => c + 1);
    } catch (erro) {
      toast.error(mensagemDeErro(erro));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="doc-titulo">Título</Label>
        <Input id="doc-titulo" maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="doc-ano">Ano</Label>
        <Input id="doc-ano" type="number" min={2000} max={anoAtual + 1} value={ano} onChange={(e) => setAno(Number(e.target.value))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="doc-categoria">Categoria</Label>
        <select id="doc-categoria" className={classeSelect} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}>
          {Object.entries(ROTULO_CATEGORIA_DOCUMENTO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="doc-arquivo">Arquivo PDF (até {LIMITE_MB} MB)</Label>
        <Input key={chave} id="doc-arquivo" type="file" accept="application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
      </div>
      <Button type="submit" disabled={enviando} className="self-start">
        <FileUp />
        {enviando ? 'Enviando…' : 'Publicar documento'}
      </Button>
    </form>
  );
}

export default function PaginaTransparencia() {
  const pode = usePermissao('transparencia:editar');
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pode) return;
    return onSnapshot(
      query(collection(db, 'documentos'), orderBy('ano', 'desc')),
      (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Documento, 'id'>) }))),
      (e) => setErro(mensagemDeErro(e)),
    );
  }, [pode]);

  async function alternarArquivo(d: Documento) {
    try {
      await updateDoc(doc(db, 'documentos', d.id), { arquivado: !d.arquivado, atualizadoEm: serverTimestamp() });
      toast.success(d.arquivado ? 'Documento restaurado.' : 'Documento arquivado: ele sai do site.');
    } catch (e) {
      toast.error(mensagemDeErro(e));
    }
  }

  if (!pode) return <p className="text-muted-foreground">Você não tem permissão para editar a transparência.</p>;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Transparência</h1>
      <FormularioDocumento />
      {erro ? (
        <p role="alert" className="text-destructive">{erro}</p>
      ) : docs === null ? (
        <Skeleton className="h-40 w-full" />
      ) : docs.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum documento publicado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <a href={d.arquivo.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{d.titulo}</a>
                  </TableCell>
                  <TableCell>{ROTULO_CATEGORIA_DOCUMENTO[d.categoria]}</TableCell>
                  <TableCell>{d.ano}</TableCell>
                  <TableCell>
                    <Badge variant={d.arquivado ? 'secondary' : 'outline'}>{d.arquivado ? 'Arquivado' : 'No site'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void alternarArquivo(d)}>
                      {d.arquivado ? 'Restaurar' : 'Arquivar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
