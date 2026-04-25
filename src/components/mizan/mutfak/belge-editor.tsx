import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Code2,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
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
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Placeholder.configure({ placeholder: "Yazmaya başla… (\"/\" komut için)" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    ],
    content: icerik as object,
    onUpdate: ({ editor }) => onDegisim(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[60vh] focus:outline-none [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li_>_label]:mr-2 [&_ul[data-type='taskList']_li_>_label_input]:mt-1.5",
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
    <div className="relative">
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
        <TbBtn
          title="Altı çizili"
          aktif={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Görev listesi"
          aktif={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Kod bloğu"
          aktif={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Yatay çizgi"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3.5 w-3.5" />
        </TbBtn>
        <div className="mx-1 h-4 w-px bg-border" />
        <TbBtn
          title="Sola hizala"
          aktif={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Ortala"
          aktif={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </TbBtn>
        <TbBtn
          title="Sağa hizala"
          aktif={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </TbBtn>
      </div>
      <SlashMenu editor={editor} />
      <EditorContent editor={editor} />
      <div className="pointer-events-none sticky bottom-2 ml-auto mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1 text-[10px] tabular-nums text-muted-foreground shadow-sm backdrop-blur">
        <span>{editor.storage.characterCount?.words?.() ?? 0} sözcük</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{editor.storage.characterCount?.characters?.() ?? 0} karakter</span>
      </div>
    </div>
  );
}

/**
 * Slash menü: boş satırda "/" yazınca açılır, ok tuşları ile gezilir, Enter ile uygulanır.
 * ProseMirror suggestion plugin yerine basit DOM yaklaşımı.
 */
function SlashMenu({ editor }: { editor: Editor }) {
  const [acik, setAcik] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const [filter, setFilter] = React.useState("");
  const [secili, setSecili] = React.useState(0);

  const komutlar = React.useMemo(
    () => [
      { ad: "Başlık 1", anahtar: "h1", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleHeading({ level: 1 }).run() },
      { ad: "Başlık 2", anahtar: "h2", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleHeading({ level: 2 }).run() },
      { ad: "Başlık 3", anahtar: "h3", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleHeading({ level: 3 }).run() },
      { ad: "Madde listesi", anahtar: "liste", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleBulletList().run() },
      { ad: "Sıralı liste", anahtar: "sıralı", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleOrderedList().run() },
      { ad: "Görev listesi", anahtar: "görev", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleTaskList().run() },
      { ad: "Alıntı", anahtar: "alıntı", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleBlockquote().run() },
      { ad: "Kod bloğu", anahtar: "kod", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).toggleCodeBlock().run() },
      { ad: "Yatay çizgi", anahtar: "çizgi", uygula: () => editor.chain().focus().deleteRange(rangeFromSlash(editor)).setHorizontalRule().run() },
    ],
    [editor],
  );

  const filtreli = komutlar.filter((k) => {
    const f = filter.toLowerCase();
    if (!f) return true;
    return k.ad.toLowerCase().includes(f) || k.anahtar.includes(f);
  });

  React.useEffect(() => {
    const onUpdate = () => {
      const { state, view } = editor;
      const { from, $from } = state.selection;
      const text = $from.parent.textBetween(0, $from.parentOffset, "\n", " ");
      const m = text.match(/(?:^|\s)\/([^/\s]*)$/);
      if (m) {
        const coords = view.coordsAtPos(from);
        const wrapper = view.dom.parentElement?.getBoundingClientRect();
        if (wrapper) {
          setPos({
            top: coords.bottom - wrapper.top + 4,
            left: coords.left - wrapper.left,
          });
        }
        setFilter(m[1]);
        setAcik(true);
        setSecili(0);
      } else {
        setAcik(false);
      }
    };
    editor.on("transaction", onUpdate);
    return () => {
      editor.off("transaction", onUpdate);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSecili((s) => Math.min(s + 1, filtreli.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSecili((s) => Math.max(0, s - 1));
      } else if (e.key === "Enter" && filtreli[secili]) {
        e.preventDefault();
        filtreli[secili].uygula();
        setAcik(false);
      } else if (e.key === "Escape") {
        setAcik(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [acik, filtreli, secili]);

  if (!acik || filtreli.length === 0) return null;

  return (
    <div
      style={{ top: pos.top, left: pos.left }}
      className="absolute z-20 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl"
    >
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        Blok ekle
      </div>
      {filtreli.map((k, i) => (
        <button
          key={k.ad}
          onMouseDown={(e) => {
            e.preventDefault();
            k.uygula();
            setAcik(false);
          }}
          onMouseEnter={() => setSecili(i)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
            i === secili ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
          )}
        >
          {k.ad}
        </button>
      ))}
    </div>
  );
}

function rangeFromSlash(editor: Editor): { from: number; to: number } {
  const { state } = editor;
  const { $from, from } = state.selection;
  const text = $from.parent.textBetween(0, $from.parentOffset, "\n", " ");
  const m = text.match(/(?:^|\s)\/([^/\s]*)$/);
  if (!m) return { from, to: from };
  return { from: from - m[0].trimStart().length, to: from };
}
