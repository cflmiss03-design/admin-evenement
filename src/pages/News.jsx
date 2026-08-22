import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ImageUploadField from "../components/ImageUploadField.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";

const emptyForm = {
  title: "",
  excerpt: "",
  contentHtml: "",
  coverImage: "",
  tags: [],
  featured: false,
  status: "draft",
  publishAt: "",
  author: "",
};

// Statut affiché = calculé, jamais stocké tel quel (voir Article.js côté
// backend) : un article "published" avec une date de publication future EST
// l'état "Programmé".
function computeStatus(article) {
  if (article.status !== "published") return { label: "Brouillon", classes: "bg-slate-100 text-slate-600" };
  const publishAt = article.publishAt ? new Date(article.publishAt) : null;
  if (publishAt && publishAt > new Date()) {
    return {
      label: `Programmé · ${publishAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}`,
      classes: "bg-amber-100 text-amber-700",
    };
  }
  return { label: "Publié", classes: "bg-emerald-100 text-emerald-700" };
}

// Convertit un Date/ISO en valeur compatible <input type="datetime-local">
// (heure locale du navigateur, sans les secondes/millisecondes/fuseau).
function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function News() {
  const { currentTenant } = useAuth();
  const [articles, setArticles] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null); // article object, ou "new"
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      tenantApi(currentTenant, "/news/manager"),
      tenantApi(currentTenant, "/news/manager/tags"),
    ])
      .then(([items, tags]) => {
        setArticles(items);
        setAvailableTags(tags);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setError(null);
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  function openCreate() {
    setEditing("new");
    setForm(emptyForm);
    setTagInput("");
  }

  function openEdit(article) {
    setEditing(article);
    setForm({
      title: article.title || "",
      excerpt: article.excerpt || "",
      contentHtml: article.contentHtml || "",
      coverImage: article.coverImage || "",
      tags: article.tags || [],
      featured: !!article.featured,
      status: article.status || "draft",
      publishAt: toDatetimeLocal(article.publishAt),
      author: article.author || "",
    });
    setTagInput("");
  }

  function closeModal() {
    setEditing(null);
    setForm(emptyForm);
  }

  function addTag(raw) {
    const value = raw.trim();
    if (!value) return;
    setForm((f) => (f.tags.includes(value) ? f : { ...f, tags: [...f.tags, value] }));
    setTagInput("");
  }

  function removeTag(tag) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title,
        excerpt: form.excerpt,
        contentHtml: form.contentHtml,
        coverImage: form.coverImage,
        tags: form.tags,
        featured: form.featured,
        status: form.status,
        publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : null,
        author: form.author,
      };

      if (editing === "new") {
        await tenantApi(currentTenant, "/news/manager", { method: "POST", body: JSON.stringify(body) });
        setNotice("Article créé.");
      } else {
        await tenantApi(currentTenant, `/news/manager/${editing._id}`, { method: "PUT", body: JSON.stringify(body) });
        setNotice("Article mis à jour.");
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(article) {
    if (!window.confirm(`Supprimer définitivement "${article.title}" ?`)) return;
    try {
      await tenantApi(currentTenant, `/news/manager/${article._id}`, { method: "DELETE" });
      setNotice("Article supprimé.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const suggestedTags = availableTags.filter((t) => !form.tags.includes(t));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Actualités</h1>
          <p className="mt-1 text-sm text-slate-500">
            Contenu partagé par tout le site (pas propre à une catégorie).
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Nouvel article
        </button>
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Couverture</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Lecture</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((a) => {
                const status = computeStatus(a);
                return (
                  <tr key={a._id}>
                    <td className="px-4 py-3">
                      {a.coverImage ? (
                        <img src={a.coverImage} alt="" className="h-10 w-14 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-slate-100" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {a.featured && <span title="À la une" className="mr-1">⭐</span>}
                      {a.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{(a.tags || []).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{a.readingTimeMinutes} min</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(a)} className="mr-3 text-brand-600 hover:underline">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(a)} className="text-red-600 hover:underline">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Aucun article.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">
              {editing === "new" ? "Nouvel article" : "Modifier l'article"}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="field-label">Titre</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Extrait (résumé court affiché dans les listes)</label>
                <textarea
                  required
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="field-input"
                />
              </div>

              <ImageUploadField
                tenantKey={currentTenant}
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
                label="Image de couverture"
              />

              <div>
                <label className="field-label">Contenu</label>
                <RichTextEditor
                  tenantKey={currentTenant}
                  content={form.contentHtml}
                  onChange={(html) => setForm({ ...form, contentHtml: html })}
                />
              </div>

              <div>
                <label className="field-label">Tags</label>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 p-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-brand-500 hover:text-brand-800">
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => addTag(tagInput)}
                    placeholder="Ajouter un tag, Entrée pour valider"
                    className="min-w-[140px] flex-1 border-none text-sm outline-none"
                  />
                </div>
                {suggestedTags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:border-brand-300 hover:text-brand-600"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Auteur (optionnel)</label>
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="field-input"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Mettre à la une
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="field-input"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">
                    Date de publication {form.status === "published" ? "(vide = maintenant)" : "(optionnel)"}
                  </label>
                  <input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                    className="field-input"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Une date future + statut "Publié" = article programmé, visible automatiquement le moment venu.
                  </p>
                </div>
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
