import { useEffect, useMemo, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { title: "", selected: {} }; // selected: { [candidateId]: noteString }

function candidateLabel(c) {
  return `${c.firstName} ${c.lastName}`.trim();
}

export default function Epreuves() {
  const { currentTenant } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [epreuves, setEpreuves] = useState([]);
  const [reveal, setReveal] = useState(null); // { revealedCandidateIds, finalRevealed, ranking }
  const [revealActionId, setRevealActionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      tenantApi(currentTenant, "/manager"),
      tenantApi(currentTenant, "/manager/epreuves"),
      tenantApi(currentTenant, "/manager/reveal"),
    ])
      .then(([cands, eps, revealState]) => {
        setCandidates([...cands].sort((a, b) => a.orderNumber - b.orderNumber));
        setEpreuves(eps);
        setReveal(revealState);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  const candidateById = useMemo(() => new Map(candidates.map((c) => [c.id || c._id, c])), [candidates]);

  // Aperçu admin du classement total, toutes épreuves confondues (brouillons
  // inclus) — pour vérifier avant de publier. La page publique, elle,
  // n'agrège que les épreuves publiées (voir results.routes.js).
  const previewRanking = useMemo(() => {
    const totals = new Map();
    for (const ep of epreuves) {
      for (const s of ep.scores) {
        const key = s.candidateId;
        totals.set(key, (totals.get(key) || 0) + s.note);
      }
    }
    return [...totals.entries()]
      .map(([candidateId, total]) => ({ candidateId, total, candidate: candidateById.get(candidateId) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);
  }, [epreuves, candidateById]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(ep) {
    const selected = {};
    for (const s of ep.scores) selected[s.candidateId] = String(s.note);
    setEditingId(ep._id);
    setForm({ title: ep.title, selected });
    setShowForm(true);
  }

  function toggleCandidate(id) {
    setForm((f) => {
      const next = { ...f.selected };
      if (id in next) delete next[id];
      else next[id] = "";
      return { ...f, selected: next };
    });
  }

  function setNote(id, value) {
    setForm((f) => ({ ...f, selected: { ...f.selected, [id]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const title = form.title.trim();
    if (!title) return setError("Le titre de l'épreuve est requis.");

    const entries = Object.entries(form.selected);
    if (entries.length === 0) return setError("Sélectionnez au moins une candidate avec sa note.");

    const scores = [];
    for (const [candidateId, noteStr] of entries) {
      const note = Number(noteStr);
      if (noteStr === "" || !Number.isFinite(note) || note < 0) {
        return setError(`Note manquante ou invalide pour ${candidateLabel(candidateById.get(candidateId) || {})}.`);
      }
      scores.push({ candidateId, note });
    }

    setSaving(true);
    try {
      if (editingId) {
        await tenantApi(currentTenant, `/manager/epreuves/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ title, scores }),
        });
        setNotice("Épreuve mise à jour.");
      } else {
        await tenantApi(currentTenant, "/manager/epreuves", {
          method: "POST",
          body: JSON.stringify({ title, scores }),
        });
        setNotice("Épreuve créée (brouillon — pas encore publiée).");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(ep) {
    setError(null);
    try {
      await tenantApi(currentTenant, `/manager/epreuves/${ep._id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ published: !ep.published }),
      });
      setNotice(ep.published ? "Épreuve dépubliée." : "Épreuve publiée — visible sur la page publique.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(ep) {
    if (!window.confirm(`Supprimer définitivement l'épreuve "${ep.title}" ?`)) return;
    setError(null);
    try {
      await tenantApi(currentTenant, `/manager/epreuves/${ep._id}`, { method: "DELETE" });
      setNotice("Épreuve supprimée.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleReveal(candidateId, revealed) {
    setRevealActionId(candidateId);
    setError(null);
    try {
      const result = await tenantApi(currentTenant, `/manager/reveal/${candidateId}`, {
        method: "PATCH",
        body: JSON.stringify({ revealed }),
      });
      setReveal((r) => ({ ...r, revealedCandidateIds: result.revealedCandidateIds }));
      setNotice(revealed ? "Candidate révélée — visible sur la page publique." : "Candidate masquée à nouveau.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRevealActionId(null);
    }
  }

  async function toggleFinalReveal(finalRevealed) {
    if (
      finalRevealed &&
      !window.confirm("Afficher le classement complet (top 7) sur la page publique maintenant ?")
    ) {
      return;
    }
    setError(null);
    try {
      const result = await tenantApi(currentTenant, "/manager/reveal/final", {
        method: "PATCH",
        body: JSON.stringify({ finalRevealed }),
      });
      setReveal((r) => ({ ...r, finalRevealed: result.finalRevealed }));
      setNotice(finalRevealed ? "Classement complet affiché publiquement." : "Retour au mode révélation candidate par candidate.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetReveal() {
    if (!window.confirm("Réinitialiser la proclamation ? Toutes les candidates redeviennent masquées (les notes des épreuves ne sont pas touchées).")) return;
    setError(null);
    try {
      await tenantApi(currentTenant, "/manager/reveal", { method: "DELETE" });
      setNotice("Proclamation réinitialisée.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedCount = Object.keys(form.selected).length;
  const revealedSet = new Set((reveal?.revealedCandidateIds || []).map(String));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Résultats officiels — Épreuves</h1>
          <p className="text-sm text-slate-500">
            Créez une épreuve, notez les candidates concernées, puis publiez pour l'afficher sur la page publique.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Nouvelle épreuve</button>
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Épreuve</th>
                  <th className="px-4 py-3">Participantes</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {epreuves.map((ep) => (
                  <tr key={ep._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{ep.title}</td>
                    <td className="px-4 py-3">{ep.scores.length}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ep.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {ep.published ? "Publiée" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(ep)} className="mr-3 text-brand-600 hover:underline">Modifier</button>
                      <button
                        onClick={() => togglePublish(ep)}
                        className={`mr-3 ${ep.published ? "text-amber-600 hover:underline" : "text-emerald-600 hover:underline"}`}
                      >
                        {ep.published ? "Dépublier" : "Publier"}
                      </button>
                      <button onClick={() => remove(ep)} className="text-red-600 hover:underline">Supprimer</button>
                    </td>
                  </tr>
                ))}
                {epreuves.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Aucune épreuve créée pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {previewRanking.length > 0 && (
            <div className="panel-card mt-8">
              <p className="mb-1 text-sm font-semibold text-slate-900">Aperçu du classement (top 7)</p>
              <p className="mb-4 text-xs text-slate-500">
                Toutes épreuves confondues, brouillons inclus — pour vérifier avant de publier. La page publique n'affiche que les épreuves publiées.
              </p>
              <ol className="space-y-2">
                {previewRanking.map((entry, i) => (
                  <li key={entry.candidateId} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-right font-bold text-slate-400">{i + 1}.</span>
                    <span className="flex-1 font-medium text-slate-900">
                      {entry.candidate ? candidateLabel(entry.candidate) : "Candidate inconnue"}
                    </span>
                    <span className="font-bold text-brand-600">{entry.total} pts</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {reveal && reveal.ranking.length > 0 && (
            <div className="panel-card mt-8 border-2 border-amber-200 bg-amber-50/40">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">🏆 Proclamation en direct</p>
                  <p className="text-xs text-slate-500">
                    Basé uniquement sur les épreuves publiées. Révélez les candidates une par une, dans l'ordre annoncé par le jury.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={resetReveal} className="btn-secondary text-xs">Réinitialiser</button>
                  {reveal.finalRevealed ? (
                    <button onClick={() => toggleFinalReveal(false)} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                      Revenir en mode révélation
                    </button>
                  ) : (
                    <button onClick={() => toggleFinalReveal(true)} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                      Afficher le classement complet
                    </button>
                  )}
                </div>
              </div>

              {reveal.finalRevealed && (
                <p className="mt-3 rounded-md bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800">
                  Le classement complet est actuellement affiché publiquement.
                </p>
              )}

              <ol className="mt-4 space-y-2">
                {reveal.ranking.map((entry) => {
                  const isRevealed = revealedSet.has(entry.candidateId);
                  return (
                    <li key={entry.candidateId} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                      <span className="w-6 text-right font-bold text-slate-400">{entry.rank}.</span>
                      <span className="flex-1 font-medium text-slate-900">{entry.candidateName}</span>
                      <span className="font-bold text-brand-600">{entry.total} pts</span>
                      <button
                        disabled={revealActionId === entry.candidateId || reveal.finalRevealed}
                        onClick={() => toggleReveal(entry.candidateId, !isRevealed)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40 ${
                          isRevealed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {isRevealed ? "✓ Révélée" : "Révéler"}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">
              {editingId ? "Modifier l'épreuve" : "Nouvelle épreuve"}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Titre de l'épreuve</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex : Tenue de soirée"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Candidates concernées et notes ({selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""})</label>
                <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-slate-300 px-3 py-2">
                  {candidates.map((c) => {
                    const id = c.id || c._id;
                    const checked = id in form.selected;
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <label className="flex flex-1 items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={checked} onChange={() => toggleCandidate(id)} />
                          {candidateLabel(c)}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          disabled={!checked}
                          value={form.selected[id] ?? ""}
                          onChange={(e) => setNote(id, e.target.value)}
                          placeholder="Note"
                          className="field-input w-24 disabled:opacity-40"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer l'épreuve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
