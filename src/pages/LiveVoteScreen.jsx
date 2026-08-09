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

// Absence de vote pendant ce délai -> bascule en diaporama plein écran des
// photos. Le moindre vote (réel ou changement de votes fictifs) fait
// revenir au classement immédiatement (voir handling du websocket).
const IDLE_THRESHOLD_MS = 15000;
// Durée d'affichage de chaque photo dans le diaporama, fondu compris.
const SLIDE_DURATION_MS = 5000;
const FADE_DURATION_MS = 700;

export default function LiveVoteScreen() {
  const { tenantKey } = useParams();
  const tenant = getTenant(tenantKey);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [idle, setIdle] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideVisible, setSlideVisible] = useState(true);
  // Cadrage plein écran : commence sur le haut de la photo (visages non
  // coupés, contrairement à un cadrage centré) puis descend lentement vers
  // le bas pendant l'affichage — effet "Ken Burns" discret.
  const [panDown, setPanDown] = useState(false);

  const lastActivityRef = useRef(Date.now());

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
          // Un vote vient d'arriver : retour immédiat au classement, même
          // en plein milieu du diaporama.
          lastActivityRef.current = Date.now();
          setIdle(false);
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

  // Surveille l'inactivité (aucun vote depuis IDLE_THRESHOLD_MS) pour
  // basculer en diaporama — vérifié chaque seconde plutôt qu'avec un seul
  // timer différé, pour que chaque nouveau vote puisse repousser la
  // bascule sans avoir à recréer un timer à chaque message.
  useEffect(() => {
    const interval = setInterval(() => {
      setIdle(Date.now() - lastActivityRef.current >= IDLE_THRESHOLD_MS);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const ranked = useMemo(
    () => [...candidates].sort((a, b) => (b.realVotes || 0) - (a.realVotes || 0)),
    [candidates]
  );
  const maxVotes = Math.max(1, ranked[0]?.realVotes || 0);

  // Fait avancer le diaporama pendant l'inactivité — fondu sortant puis
  // changement de photo puis fondu entrant.
  useEffect(() => {
    if (!idle || ranked.length === 0) return;
    const interval = setInterval(() => {
      setSlideVisible(false);
      setTimeout(() => {
        setSlideIndex((i) => (i + 1) % ranked.length);
        setSlideVisible(true);
      }, FADE_DURATION_MS);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, [idle, ranked.length]);

  useEffect(() => {
    if (idle) setSlideVisible(true);
  }, [idle]);

  // Relance le panoramique haut -> bas à chaque nouvelle photo : on repart
  // du haut (état non transitionné) puis, une fois affiché, on déclenche la
  // transition vers le bas sur la durée du slide.
  useEffect(() => {
    if (!idle) return;
    setPanDown(false);
    const t = setTimeout(() => setPanDown(true), 50);
    return () => clearTimeout(t);
  }, [slideIndex, idle]);

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-2xl">Événement inconnu : "{tenantKey}"</p>
      </div>
    );
  }

  if (idle && ranked.length > 0) {
    const c = ranked[slideIndex % ranked.length];
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <div
          className="absolute inset-0 transition-opacity ease-in-out"
          style={{ opacity: slideVisible ? 1 : 0, transitionDuration: `${FADE_DURATION_MS}ms` }}
        >
          <img
            src={c.photoUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: panDown ? "center 35%" : "center top",
              transition: `object-position ${SLIDE_DURATION_MS}ms linear`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
        </div>
        <div
          className="absolute inset-x-0 bottom-0 px-10 pb-14 transition-opacity ease-in-out sm:px-16"
          style={{ opacity: slideVisible ? 1 : 0, transitionDuration: `${FADE_DURATION_MS}ms` }}
        >
          <p className="text-sm uppercase tracking-[0.4em] text-amber-400">{tenant.label}</p>
          <h2 className="mt-2 text-5xl font-black text-white sm:text-7xl">
            {c.firstName} {c.lastName}
          </h2>
          <p className="mt-2 text-xl text-white/60">Candidate n°{c.orderNumber}</p>
        </div>
        <div className="absolute right-6 top-6 flex items-center gap-2 text-sm text-white/40">
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`} />
          {connected ? "En direct" : "Reconnexion..."}
        </div>
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
                  className={`h-20 w-20 flex-shrink-0 rounded-full border-4 object-cover object-top ${isLeader ? "border-amber-400" : "border-white/10"}`}
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
