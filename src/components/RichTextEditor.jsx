import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { tenantApi } from "../lib/api.js";

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// Éditeur WYSIWYG riche pour le corps des articles Actualité (TipTap).
// L'upload d'image (bouton 🖼️ de la barre d'outils) passe par le même
// endpoint signé que la couverture — voir ImageUploadField.jsx.
export default function RichTextEditor({ tenantKey, content, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Rédigez le contenu de l'article..." }),
    ],
    content: content || "",
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
      },
    },
  });

  async function handleImageFile(file) {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await tenantApi(tenantKey, "/news/manager/upload", {
        method: "POST",
        body: formData,
      });
      editor.chain().focus().setImage({ src: result.url }).run();
    } catch (err) {
      window.alert(err.message || "Échec de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  }

  function setLink() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien :", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-brand-500">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <ToolbarButton title="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>G</strong>
        </ToolbarButton>
        <ToolbarButton title="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarButton title="Titre H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton title="Titre H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarButton title="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •≡
        </ToolbarButton>
        <ToolbarButton title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1≡
        </ToolbarButton>
        <ToolbarButton title="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarButton title="Lien" active={editor.isActive("link")} onClick={setLink}>
          🔗
        </ToolbarButton>
        <ToolbarButton title="Insérer une image" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? "..." : "🖼️"}
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarButton title="Annuler" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </ToolbarButton>
        <ToolbarButton title="Rétablir" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageFile(e.target.files?.[0])}
      />
    </div>
  );
}
