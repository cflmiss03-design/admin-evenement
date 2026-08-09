import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const OVERRIDE_LABELS = {
  none: "Désactivé — comportement normal (piloté par les dates)",
  force_open: "Forcer l'ouverture — les votes restent ouverts quoi que disent les dates",
  force_closed: "Forcer l'arrêt — les votes sont bloqués immédiatement, quoi que disent les dates",
};

export default function VotingPeriod() {
  const { currentTenant, isAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [overrideMode, setOverrideMode] = useState("none");
  const [overrideMessage, setOverrideMessage] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [checkinCode, setCheckinCode] = useState("");
  const [feePercent, setFeePercent] = useState("");
  const [voteLaborPercent, setVoteLaborPercent] = useState("");
  const [ticketLaborPercent, setTicketLaborPercent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    tenantApi(currentTenant, "/manager/ticket-claims/settings")
      .then((data) => {
        setSettings(data);
        // Dates/heures renvoyées en heure du Bénin (WAT) — voir watTime.js
        // côté serveur, qui stocke l'instant UTC exact correspondant.
        setStartDate(data.votingStartDate || "");
        setStartTime(data.votingStartTime || "");
        setEndDate(data.votingEndDate || "");
        setEndTime(data.votingEndTime || "");
        setOverrideMode(data.voteOverrideMode || "none");
        setOverrideMessage(data.voteOverrideMessage || "");
        setClaimEmail(data.claimNotificationEmail || "");
        setCheckinCode(data.ticketCheckinCode || "");
        // Absent de la réponse pour un compte PROMOTEUR (jamais exposé) —
        // reste alors à "" sans erreur.
        if (data.voteFraisTransaction !== undefined) {
          setFeePercent(String(data.voteFraisTransaction));
        }
        // Contrairement aux frais de transaction, ces pourcentages sont
        // renvoyés aussi bien à l'ADMIN qu'au PROMOTEUR.
        setVoteLaborPercent(String(data.voteLaborPercent ?? 0));
        setTicketLaborPercent(String(data.ticketLaborPercent ?? 0));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  async function handleSaveDates(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Validation : si les deux bornes sont renseignées, le début doit être
    // strictement avant la fin (comparaison lexicale valide car "YYYY-MM-DD"
    // + "HH:mm" sont des formats à largeur fixe, donc triables comme du texte).
    if (startDate && endDate) {
      const startVal = `${startDate}T${startTime || "00:00"}`;
      const endVal = `${endDate}T${endTime || "00:00"}`;
      if (startVal >= endVal) {
        setError("La date/heure de début doit être avant la date/heure de fin.");
        return;
      }
    }

    setSaving(true);
    try {
      await tenantApi(currentTenant, "/manager/ticket-claims/settings", {
        method: "PUT",
        body: JSON.stringify({
          votingStartDate: startDate || null,
          votingStartTime: startDate ? startTime || "00:00" : null,
          votingEndDate: endDate || null,
          votingEndTime: endDate ? endTime || "00:00" : null,
        }),
      });
      setNotice("Période de vote mise à jour.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOverride(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (overrideMode !== "none" && !overrideMessage.trim()) {
      setError("Un court texte est requis lorsque le bouton spécial est actif (affiché à la place de la barre de progression).");
      return;
    }

    setSaving(true);
    try {
      await tenantApi(currentTenant, "/manager/ticket-claims/settings", {
        method: "PUT",
        body: JSON.stringify({
          voteOverrideMode: overrideMode,
          voteOverrideMessage: overrideMessage.trim() || null,
        }),
      });
      setNotice("Bouton spécial mis à jour.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAdminSettings(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await tenantApi(currentTenant, "/manager/ticket-claims/settings", {
        method: "PUT",
        body: JSON.stringify({ claimNotificationEmail: claimEmail || null, ticketCheckinCode: checkinCode || null }),
      });
      setNotice("Réglages mis à jour.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFee(e) {
    e.preventDefault();
    const value = Number(feePercent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError("Le pourcentage doit être un nombre entre 0 et 100.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await tenantApi(currentTenant, "/manager/ticket-claims/settings", {
        method: "PUT",
        body: JSON.stringify({ voteFraisTransaction: value }),
      });
      setNotice("Frais de transaction mis à jour.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLabor(e) {
    e.preventDefault();
    const voteValue = Number(voteLaborPercent);
    const ticketValue = Number(ticketLaborPercent);
    if (!Number.isFinite(voteValue) || voteValue < 0 || voteValue > 100 || !Number.isFinite(ticketValue) || ticketValue < 0 || ticketValue > 100) {
      setError("Les deux pourcentages doivent être des nombres entre 0 et 100.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await tenantApi(currentTenant, "/manager/ticket-claims/settings", {
        method: "PUT",
        body: JSON.stringify({ voteLaborPercent: voteValue, ticketLaborPercent: ticketValue }),
      });
      setNotice("Pourcentages main d'œuvre mis à jour.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Période de vote</h1>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          {!isAdmin && overrideMode !== "none" && (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <p className="font-semibold">
                {overrideMode === "force_open" ? "Bouton spécial actif : votes forcés ouverts" : "Bouton spécial actif : votes forcés fermés"}
              </p>
              <p className="mt-1">{overrideMessage}</p>
              <p className="mt-2 text-xs text-amber-600">Réglable uniquement par un administrateur — les dates ci-dessous sont ignorées tant que ce bouton est actif.</p>
            </div>
          )}

          <form onSubmit={handleSaveDates} className="panel-card">
            <p className="mb-1 text-sm font-semibold text-slate-900">Dates de vote</p>
            <p className="mb-4 text-xs text-slate-500">
              Saisies en heure du Bénin (WAT) — la bascule se fait au même instant pour tous les visiteurs, quel que soit leur fuseau horaire.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Début des votes</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="field-input"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="field-input w-28"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Fin des votes</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="field-input"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="field-input w-28"
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Heure laissée vide = 00h00 (Bénin).</p>
            <button type="submit" disabled={saving} className="btn-primary mt-4">
              {saving ? "Enregistrement..." : "Enregistrer les dates"}
            </button>
          </form>

          {isAdmin && (
            <form onSubmit={handleSaveOverride} className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
              <p className="mb-1 text-sm font-semibold text-slate-900">Bouton spécial (admin uniquement)</p>
              <p className="mb-4 text-xs text-slate-500">
                Prioritaire sur les dates ci-dessus : force l'ouverture ou l'arrêt des votes indépendamment de la période définie.
                Un court texte est obligatoire dès qu'il est actif — il remplace entièrement la barre de progression sur le site public
                (ex : « Vote spécial jour de finale »).
              </p>
              <div className="space-y-2">
                {Object.entries(OVERRIDE_LABELS).map(([value, label]) => (
                  <label key={value} className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="voteOverrideMode"
                      value={value}
                      checked={overrideMode === value}
                      onChange={(e) => setOverrideMode(e.target.value)}
                      className="mt-0.5"
                    />
                    <span className={value !== "none" ? "font-medium" : ""}>{label}</span>
                  </label>
                ))}
              </div>
              {overrideMode !== "none" && (
                <div className="mt-4">
                  <label className="field-label">Texte affiché à la place de la barre de progression</label>
                  <input
                    value={overrideMessage}
                    onChange={(e) => setOverrideMessage(e.target.value)}
                    placeholder="Ex : Vote spécial jour de finale"
                    className="field-input"
                    maxLength={140}
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer le bouton spécial"}
              </button>
            </form>
          )}

          {isAdmin && (
            <form onSubmit={handleSaveAdminSettings} className="panel-card mt-6">
              <p className="mb-4 text-sm font-semibold text-slate-900">Réglages billetterie (admin)</p>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Email de notification des réclamations</label>
                  <input
                    type="email"
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Code de check-in des billets</label>
                  <input
                    value={checkinCode}
                    onChange={(e) => setCheckinCode(e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary mt-4">
                {saving ? "Enregistrement..." : "Enregistrer les réglages"}
              </button>
            </form>
          )}

          {isAdmin && (
            <form onSubmit={handleSaveFee} className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
              <p className="mb-1 text-sm font-semibold text-slate-900">Frais de transaction — vote (admin uniquement)</p>
              <p className="mb-4 text-xs text-slate-500">
                Pourcentage ajouté au prix officiel du vote au moment du paiement (FedaPay + taxes).
                Jamais affiché publiquement ni visible par un compte promoteur — n'entre jamais dans les calculs de revenu.
              </p>
              <div className="max-w-[160px]">
                <label className="field-label">Pourcentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="field-input"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer les frais"}
              </button>
            </form>
          )}

          {isAdmin && (
            <form onSubmit={handleSaveLabor} className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
              <p className="mb-1 text-sm font-semibold text-slate-900">Pourcentage main d'œuvre (admin uniquement)</p>
              <p className="mb-4 text-xs text-slate-500">
                Commission prélevée par l'entreprise — un pourcentage distinct pour les votes et pour les tickets.
                Contrairement aux frais de transaction, ces pourcentages et le revenu net qui en résulte sont visibles par le compte promoteur.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Votes (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={voteLaborPercent}
                    onChange={(e) => setVoteLaborPercent(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Tickets (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ticketLaborPercent}
                    onChange={(e) => setTicketLaborPercent(e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer les commissions"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
