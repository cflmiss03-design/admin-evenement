import { useRef, useState } from "react";
import { tenantApi } from "../lib/api.js";

// Champ d'upload d'image réutilisable (couverture d'article, et par
// l'éditeur riche pour insérer une image dans le corps du texte). Upload
// signé côté backend (POST /news/manager/upload) — jamais de clé Cloudinary
// exposée ici, voir backend-votes/src/routes/news.js.
export default function ImageUploadField({ tenantKey, value, onChange, label = "Image" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await tenantApi(tenantKey, "/news/manager/upload", {
        method: "POST",
        body: formData,
      });
      onChange(result.url);
    } catch (err) {
      setError(err.message || "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && <label className="field-label">{label}</label>}

      {value ? (
        <div className="relative mb-2 inline-block">
          <img src={value} alt="" className="h-32 w-32 rounded-lg object-cover shadow-sm" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
            aria-label="Retirer l'image"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-center text-xs text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500"
        >
          {uploading ? (
            <span className="animate-pulse">Envoi...</span>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span>Cliquer ou glisser</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
