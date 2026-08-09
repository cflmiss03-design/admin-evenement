import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getTenant } from "../lib/tenants.js";

// Page publique, sans connexion — faite pour être ouverte en plein écran sur
// l'ordinateur branché au vidéoprojecteur le jour de la finale. N'utilise
// jamais tenantApi() (qui ajoute un token) : les votes sont déjà publics
// (affichés sur chaque page candidate du site public), donc un simple fetch
// suffit et évite toute dépendance à une session admin qui pourrait expirer
// en plein direct.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const ORIGIN = RAW_BASE.replace(/\/api\/?$/, "");
const WS_ORIGIN = ORIGIN.replace(/^http/, "ws");

// Re-fetch périodique en plus du websocket : filet de sécurité pour une
// page destinée à tourner sans surveillance pendant des heures (une
// reconnexion websocket manquée ne doit jamais figer durablement l'écran).
const REFRESH_INTERVAL_MS = 20000;

export default function LiveVoteScreen() {
  const { tenantKey } = useParams();
  const tenant = getTenant(tenantKey);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const load = useRef(null);
  load.current = () => {
    if (!tenant) return;
    fetch(`${ORIGIN}${tenant.apiPrefix}/candidates`)
      .then((r) => r.json())
      .then((data) => setCandidates(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (!tenant) return;
    load.current();
    const interval = setInterval(() => load.current(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    let ws;
    let reconnectTimeout;
    let cancelled = false;

    function connect() {
      ws = new WebSocket(WS_ORIGIN);
      ws.onopen = () => !cancelled && setConnected(true);
      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // realVotes (jamais totalVotes, qui inclurait les votes fictifs) —
          // voir websocket.js / transaction.service.js côté serveur.
          if (msg.type !== "VOTES_UPDATED" || msg.realVotes === undefined) return;
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === msg.candidateId
                ? { ...c, realVotes: msg.realVotes, totalVotes: msg.totalVotes }
                : c
            )
          );
        } catch {
          // message invalide, ignoré
        }
      };
    }
    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [tenant]);

  const ranked = useMemo(
    () => [...candidates].sort((a, b) => (b.realVotes || 0) - (a.realVotes || 0)),
    [candidates]
  );
  const maxVotes = Math.max(1, ranked[0]?.realVotes || 0);

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-2xl">Événement inconnu : "{tenantKey}"</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">Vote en direct</p>
            <h1 className="text-4xl font-black sm:text-5xl">{tenant.label}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`} />
            {connected ? "En direct" : "Reconnexion..."}
          </div>
        </div>

        {error && <p className="mb-6 text-red-400">{error}</p>}

        <div className="space-y-5">
          {ranked.map((c, i) => {
            const votes = c.realVotes || 0;
            const pct = Math.max(3, Math.round((votes / maxVotes) * 100));
            const isLeader = i === 0 && votes > 0;
            return (
              <div key={c.id} className="flex items-center gap-5">
                <div className={`w-14 flex-shrink-0 text-right text-3xl font-black ${isLeader ? "text-amber-400" : "text-white/40"}`}>
                  {i + 1}
                </div>
                <img
                  src={c.photoUrl}
                  alt=""
                  className={`h-20 w-20 flex-shrink-0 rounded-full border-4 object-cover ${isLeader ? "border-amber-400" : "border-white/10"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <span className="truncate text-2xl font-bold">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className={`flex-shrink-0 text-3xl font-black tabular-nums ${isLeader ? "text-amber-400" : "text-white"}`}>
                      {votes.toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="h-7 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isLeader
                          ? "bg-gradient-to-r from-amber-500 to-yellow-300"
                          : "bg-gradient-to-r from-slate-500 to-slate-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {ranked.length === 0 && !error && (
            <p className="text-center text-xl text-white/50">Chargement...</p>
          )}
        </div>
      </div>
    </div>
  );
}
