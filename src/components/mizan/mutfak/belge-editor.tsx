import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icerik: unknown;
  onDegisim: (yeni: unknown) => void;
};

export function BelgeEditor({ icerik, onDegisim }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Yazmaya başla…" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    ],
    content: icerik as object,
    onUpdate: ({ editor }) => onDegisim(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[400px] focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const TbBtn = ({
    aktif,
    onClick,
    children,
    title,
  }: {
    aktif?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        aktif && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-card/95 px-2 py-1.5 backdrop-blur">
        <TbBtn
          title="Geri al"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn title="İleri al" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-3.5 w-3.5" />
        </TbBtn>
        <div className="mx-1 h-4 w-px bg-border" />
        <TbBtn
          title="H1"
          aktif={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="H2"
          aktif={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="H3"
          aktif={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </TbBtn>
        <div className="mx-1 h-4 w-px bg-border" />
        <TbBtn
          title="Kalın"
          aktif={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="İtalik"
          aktif={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Üstü çizili"
          aktif={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Kod"
          aktif={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" />
        </TbBtn>
        <div className="mx-1 h-4 w-px bg-border" />
        <TbBtn
          title="Madde işareti"
          aktif={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Sıralı liste"
          aktif={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Alıntı"
          aktif={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Bağlantı"
          aktif={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("URL", editor.getAttributes("link").href ?? "");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </TbBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
