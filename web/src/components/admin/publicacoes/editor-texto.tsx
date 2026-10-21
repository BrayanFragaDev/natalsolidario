'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Só os elementos que sanitizarHtml (web/src/lib/sanitizar.ts) deixa passar.
function Barra({ editor }: { editor: Editor }) {
  const botoes = [
    { rotulo: 'Título', icone: Heading2, ativo: editor.isActive('heading', { level: 2 }), acao: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { rotulo: 'Subtítulo', icone: Heading3, ativo: editor.isActive('heading', { level: 3 }), acao: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { rotulo: 'Negrito', icone: Bold, ativo: editor.isActive('bold'), acao: () => editor.chain().focus().toggleBold().run() },
    { rotulo: 'Itálico', icone: Italic, ativo: editor.isActive('italic'), acao: () => editor.chain().focus().toggleItalic().run() },
    { rotulo: 'Lista', icone: List, ativo: editor.isActive('bulletList'), acao: () => editor.chain().focus().toggleBulletList().run() },
    { rotulo: 'Lista numerada', icone: ListOrdered, ativo: editor.isActive('orderedList'), acao: () => editor.chain().focus().toggleOrderedList().run() },
    { rotulo: 'Citação', icone: Quote, ativo: editor.isActive('blockquote'), acao: () => editor.chain().focus().toggleBlockquote().run() },
    {
      rotulo: 'Link',
      icone: Link2,
      ativo: editor.isActive('link'),
      acao: () => {
        const atual = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Endereço do link (https://…). Deixe vazio para remover.', atual ?? 'https://');
        if (url === null) return;
        if (!url.trim()) editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      },
    },
  ];
  return (
    <div className="flex flex-wrap gap-1 border-b p-1" role="toolbar" aria-label="Formatação">
      {botoes.map(({ rotulo, icone: Icone, ativo, acao }) => (
        <Button
          key={rotulo}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={rotulo}
          aria-pressed={ativo}
          className={cn(ativo && 'bg-muted')}
          onClick={acao}
        >
          <Icone />
        </Button>
      ))}
    </div>
  );
}

export function EditorTexto({ valor, aoMudar, rotulo }: { valor: string; aoMudar: (html: string) => void; rotulo: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, protocols: ['http', 'https', 'mailto'] },
      }),
    ],
    content: valor,
    editorProps: {
      attributes: { class: 'conteudo-publicacao min-h-48 p-3 text-base focus:outline-none', 'aria-label': rotulo },
    },
    onUpdate: ({ editor: e }) => aoMudar(e.getHTML()),
  });

  return (
    <div className="rounded-md border border-input">
      {editor && <Barra editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
