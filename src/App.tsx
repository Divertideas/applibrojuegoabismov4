import { useEffect, useMemo, useState } from "react";

/**
 * Panel del Investigador – versión sin Tailwind, con CSS propio
 * Pensado para verse como app móvil (columna estrecha, tarjetas, botones redondeados).
 */

// ===================== Datos base =====================
const BASE_STATS = ["fuerza", "habilidad", "conocimiento", "observacion"] as const;
export type StatKey = (typeof BASE_STATS)[number];

export type CharacterDef = {
  id: "detective" | "bibliotecaria" | "sacerdote";
  nombre: string;
  habilidad?: string;
  descripcion?: string;
  stats: Record<StatKey, number>;
};

export type Item = {
  id: string;
  nombre: string;
  descripcion?: string;
  efectos?: Partial<Record<StatKey, number>>;
  tag?: string;
};

const PERSONAJES: CharacterDef[] = [
  {
    id: "detective",
    nombre: "Detective",
    habilidad: "Suma una pista extra cada vez que ganas pistas.",
    stats: { fuerza: 4, habilidad: 2, conocimiento: 1, observacion: 3 },
  },
  {
    id: "bibliotecaria",
    nombre: "Bibliotecaria",
    habilidad: "Puedes repetir una tirada de Conocimiento y quedarte con el mejor resultado.",
    stats: { fuerza: 1, habilidad: 1, conocimiento: 3, observacion: 3 },
  },
  {
    id: "sacerdote",
    nombre: "Sacerdote",
    habilidad: "La primera vez que tu cordura llegue a cero, tira un dado y suma el resultado a tu cordura.",
    stats: { fuerza: 2, habilidad: 2, conocimiento: 2, observacion: 3 },
  },
];

const ITEMS_DB: Item[] = [
  { id: "extractor_esencia_caotica", nombre: "Extractor de esencia caótica", descripcion: "Objeto especial (efecto narrativo)." },
  { id: "cuerno_diablillo", nombre: "Cuerno de diablillo", descripcion: "+2 a tu base de Fuerza mientras lo lleves.", efectos: { fuerza: 2 }, tag: "arma" },
  { id: "llave_sacrilega", nombre: "Llave sacrílega", descripcion: "Objeto especial (efecto narrativo)." },
  { id: "pocion_treboles", nombre: "Poción de tréboles", descripcion: "Superas automáticamente cualquier tirada. Se descarta tras usarla.", tag: "consumible" },
  { id: "pocion_sabiduria", nombre: "Poción de sabiduría", descripcion: "+3 a tu tirada de Conocimiento (una sola tirada). Se descarta tras usarla.", tag: "consumible" },
  { id: "pocion_reflejos", nombre: "Poción de reflejos", descripcion: "+3 a una tirada de Habilidad/Agilidad (una sola tirada). Se descarta tras usarla.", tag: "consumible" },
  { id: "elixir_fortaleza", nombre: "Elixir de fortaleza", descripcion: "Usa tu característica más alta para cualquier tirada. Se descarta tras usarlo.", tag: "consumible" },
  { id: "elixir_drenaje", nombre: "Elixir de drenaje", descripcion: "El objetivo de éxito se reduce a la mitad. Se descarta tras usarlo.", tag: "consumible" },
  { id: "llave_tentacular", nombre: "Llave tentacular", descripcion: "Objeto especial (efecto narrativo)." },

  // Página 2
  { id: "pendulo", nombre: "Péndulo", descripcion: "+2 a tu base de Observación mientras lo lleves.", efectos: { observacion: 2 } },
  { id: "conjuro_suerte", nombre: "Conjuro de suerte", descripcion: "Vuelve a tirar los dados. Se descarta tras usarlo.", tag: "consumible" },
  { id: "elixir_verde_cordura", nombre: "Elixir restaurador", descripcion: "Recupera +4 de Cordura. Se descarta tras usarlo.", tag: "consumible" },
  { id: "florete", nombre: "Florete", descripcion: "+2 a tu base de Fuerza mientras lo lleves.", efectos: { fuerza: 2 }, tag: "arma" },
  { id: "muneco_vudu", nombre: "Muñeco vudú", descripcion: "Ganas un combate automáticamente. Se descarta tras usarlo.", tag: "consumible" },
  { id: "amuleto", nombre: "Amuleto", descripcion: "+1 a tu base de Conocimiento mientras lo lleves.", efectos: { conocimiento: 1 } },
  { id: "tijeras_podar", nombre: "Tijeras de podar", descripcion: "+1 a tu base de Fuerza mientras las lleves.", efectos: { fuerza: 1 }, tag: "arma" },
  { id: "flores_jardin", nombre: "Flores de jardín", descripcion: "+3 de Cordura. Se descarta tras usarlo.", tag: "consumible" },
  { id: "elixir_drenaje_espiritual", nombre: "Elixir de drenaje espiritual", descripcion: "El objetivo de éxito se reduce a la mitad. Se descarta tras usarlo.", tag: "consumible" },

  // Página 3
  { id: "pistola_bendecida", nombre: "Pistola bendecida", descripcion: "En ataque de Fuerza puedes volver a tirar el dado y quedarte con el NUEVO resultado." , tag: "arma" },
  { id: "coctel_molotov", nombre: "Cóctel molotov", descripcion: "+3 a un ataque de Fuerza. Se descarta tras usarlo.", tag: "consumible" },
  { id: "cuchillo", nombre: "Cuchillo", descripcion: "+1 a tu base de Fuerza mientras lo lleves.", efectos: { fuerza: 1 }, tag: "arma" },
  { id: "vela", nombre: "Vela", descripcion: "+3 a tu base de Observación durante una tirada. Se descarta tras usarla.", tag: "consumible" },
  { id: "anillo_rapidez", nombre: "Anillo de rapidez", descripcion: "+1 a tu base de Habilidad/Agilidad mientras lo lleves.", efectos: { habilidad: 1 } },
  { id: "elixir_intercambio", nombre: "Elixir de intercambio", descripcion: "Intercambia qué característica usas para una tirada.", tag: "consumible" },
  { id: "farol", nombre: "Farol", descripcion: "+1 pista EXTRA cada vez que ese personaje gana pistas (pasivo mientras lo lleves)." },
  { id: "grimorio", nombre: "Grimorio", descripcion: "En una prueba de Conocimiento puedes volver a tirar y DEBES quedarte con el nuevo resultado." },
];

export type InvestigatorState = {
  id: CharacterDef["id"] | "";
  baseStats: Record<StatKey, number>;
  modStats: Record<StatKey, number>;
  inventory: string[];
  cordura: number;
  pistas: number;
};

type AppStatePersist = {
  teamSize: 1 | 2;
  party: InvestigatorState[];
  fragmentos: number;
  caras: number;
  historial: number[];
};

// ===================== Utils =====================
const STORAGE_KEY = "librojuego-app-v7";

function loadState<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function saveState(state: any) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function emptyInvestigator(): InvestigatorState {
  return {
    id: "",
    baseStats: { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 },
    modStats: { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 },
    inventory: [],
    cordura: 10,
    pistas: 0,
  };
}

export function normalizeStats(s?: Partial<Record<StatKey, number>>): Record<StatKey, number> {
  const base = { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 };
  if (!s) return base;
  const r: Record<StatKey, number> = { ...base } as any;
  for (const k of BASE_STATS) r[k] = Number.isFinite(s[k] as number) ? (s[k] as number) : 0;
  return r;
}

export function totalStats(
  base: Record<StatKey, number>,
  mods: Record<StatKey, number>,
  items: Record<StatKey, number>
): Record<StatKey, number> {
  const res: Record<StatKey, number> = { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 };
  BASE_STATS.forEach((k) => {
    const t = (base[k] || 0) + (mods[k] || 0) + (items[k] || 0);
    res[k] = Math.max(0, t);
  });
  return res;
}

function getCharacterDef(id: InvestigatorState["id"]) {
  return PERSONAJES.find((c) => c.id === id);
}

function computeItemMods(invIds: string[]): Record<StatKey, number> {
  const acc: Record<StatKey, number> = { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 };
  for (const id of invIds) {
    const it = ITEMS_DB.find((x) => x.id === id);
    if (!it?.efectos) continue;
    for (const k of Object.keys(it.efectos) as StatKey[]) acc[k] += it.efectos[k] || 0;
  }
  return acc;
}

// ===================== Componente principal =====================
export default function App() {
  const [teamSize, setTeamSize] = useState<1 | 2>(1);
  const [party, setParty] = useState<InvestigatorState[]>([emptyInvestigator()]);
  const [fragmentos, setFragmentos] = useState<number>(0);
  const [caras, setCaras] = useState<number>(6);
  const [rodando, setRodando] = useState<boolean>(false);
  const [resultado, setResultado] = useState<number | null>(null);
  const [penultimo, setPenultimo] = useState<number | null>(null);
  const [historial, setHistorial] = useState<number[]>([]);

  // Cargar estado
  useEffect(() => {
    const fallback: AppStatePersist = {
      teamSize: 1,
      party: [emptyInvestigator()],
      fragmentos: 0,
      caras: 6,
      historial: [],
    };
    const s = loadState<AppStatePersist>(fallback);

    const size = s.teamSize === 2 ? 2 : 1;

    let p = s.party && Array.isArray(s.party) ? s.party.slice(0, size) : [emptyInvestigator()];
    if (p.length < size) p = [...p, emptyInvestigator()].slice(0, size);

    p = p.map((inv) => ({
      ...inv,
      cordura: Math.max(0, inv.cordura ?? 10),
      pistas: Math.max(0, inv.pistas ?? 0),
      baseStats: normalizeStats(inv.baseStats),
      modStats: normalizeStats(inv.modStats),
      inventory: Array.isArray(inv.inventory) ? inv.inventory : [],
    }));

    setTeamSize(size);
    setParty(p);
    setFragmentos(Math.max(0, s.fragmentos ?? 0));
    setCaras(Math.max(2, s.caras ?? 6));

    const hist = (s.historial ?? []).slice(0, 2);
    setHistorial(hist);
    setResultado(hist[0] ?? null);
    setPenultimo(hist[1] ?? null);
  }, []);

  // Guardar estado
  useEffect(() => {
    const toSave: AppStatePersist = {
      teamSize,
      party,
      fragmentos,
      caras,
      historial,
    };
    saveState(toSave);
  }, [teamSize, party, fragmentos, caras, historial]);

  function setSlotCharacter(slot: 0 | 1, newId: InvestigatorState["id"]) {
    setParty((prev) => {
      const p = [...prev];
      const pj = getCharacterDef(newId);
      const base = pj ? pj.stats : { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 };
      const initialPistas = newId === "bibliotecaria" ? 4 : 0;
      p[slot] = {
        id: newId,
        baseStats: { ...base },
        modStats: { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 },
        inventory: [],
        cordura: 10,
        pistas: initialPistas,
      };
      return p;
    });
  }

  function addItem(slot: 0 | 1, itemId: string) {
    if (!itemId) return;
    setParty((prev) => {
      const p = [...prev];
      const inv = new Set(p[slot].inventory);
      inv.add(itemId);
      p[slot] = { ...p[slot], inventory: Array.from(inv) };
      return p;
    });
  }

  function removeItem(slot: 0 | 1, itemId: string) {
    setParty((prev) => {
      const p = [...prev];
      p[slot] = { ...p[slot], inventory: p[slot].inventory.filter((x) => x !== itemId) };
      return p;
    });
  }

  function incPistas(slot: 0 | 1) {
    setParty((prev) => {
      const p = [...prev];
      const hasFarol = p[slot].inventory.includes("farol");
      const delta = 1 + (hasFarol ? 1 : 0);
      p[slot] = { ...p[slot], pistas: Math.max(0, p[slot].pistas + delta) };
      return p;
    });
  }
  function decPistas(slot: 0 | 1) {
    setParty((prev) => {
      const p = [...prev];
      p[slot] = { ...p[slot], pistas: Math.max(0, p[slot].pistas - 1) };
      return p;
    });
  }
  function incCordura(slot: 0 | 1) {
    setParty((prev) => {
      const p = [...prev];
      p[slot] = { ...p[slot], cordura: Math.max(0, p[slot].cordura + 1) };
      return p;
    });
  }
  function decCordura(slot: 0 | 1) {
    setParty((prev) => {
      const p = [...prev];
      p[slot] = { ...p[slot], cordura: Math.max(0, p[slot].cordura - 1) };
      return p;
    });
  }

  function adjustMod(slot: 0 | 1, k: StatKey, delta: -1 | 1) {
    setParty((prev) => {
      const p = [...prev];
      const me = p[slot];
      const items = computeItemMods(me.inventory);
      const minMod = -((me.baseStats[k] || 0) + (items[k] || 0));
      const next = (me.modStats[k] || 0) + delta;
      p[slot] = { ...me, modStats: { ...me.modStats, [k]: Math.max(minMod, next) } };
      return p;
    });
  }

  async function rollDice() {
    setRodando(true);
    setPenultimo(resultado);
    setResultado(null);

    const rand = () => 1 + Math.floor(Math.random() * Math.max(2, caras || 6));
    await new Promise((r) => setTimeout(r, 650));
    const final = rand();
    setResultado(final);
    setHistorial([final, resultado ?? null].filter((x): x is number => x !== null));
    setRodando(false);
  }

  function resetAll() {
    setTeamSize(1);
    setParty([emptyInvestigator()]);
    setFragmentos(0);
    setCaras(6);
    setResultado(null);
    setPenultimo(null);
    setHistorial([]);
  }

  // Tests ligeros
  useEffect(() => {
    for (const i of party) {
      console.assert(i.cordura >= 0 && i.pistas >= 0, "[TEST] Recursos por personaje no negativos");
      const totals = totalStats(i.baseStats, i.modStats, { fuerza: 0, habilidad: 0, conocimiento: 0, observacion: 0 });
      console.assert(Object.values(totals).every((v) => v >= 0), "[TEST] Totales de atributos ≥ 0");
    }
    if (teamSize === 2 && party[0].inventory.includes("farol") !== party[1].inventory.includes("farol")) {
      const aHas = party[0].inventory.includes("farol");
      const bHas = party[1].inventory.includes("farol");
      console.assert(aHas !== bHas, "[TEST] Farol diferenciado por personaje");
    }
    if (resultado != null) {
      const ok = resultado >= 1 && resultado <= Math.max(2, caras || 6);
      console.assert(ok, "[TEST] Dado en rango [1..caras]");
    }
  }, [party, teamSize, resultado, caras]);

  return (
    <div className="app-root">
      <style>{`
        .dice { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 12px; border: 1px solid #3f3f46; background: rgba(24,24,27,.9); box-shadow: 0 2px 10px rgba(0,0,0,.35) inset; perspective: 600px; }
        .dice.big { width: 72px; height: 72px; border-radius: 16px; }
        .rolling3d { animation: spin3d .65s ease-out both; }
        @keyframes spin3d {
          0% { transform: rotateX(0deg) rotateY(0deg) scale(1); }
          50% { transform: rotateX(340deg) rotateY(200deg) scale(1.05); }
          100% { transform: rotateX(360deg) rotateY(360deg) scale(1); }
        }
        .chip { display:inline-flex; align-items:center; gap:.4rem; padding:.25rem .55rem; border-radius:9999px; border:1px solid #404048; background:rgba(17,24,39,.65); font-size:12px; }
        .chip button { border: 0; background: transparent; color: #a1a1aa; font-weight:700; cursor:pointer; }
      `}</style>

      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <h1 className="app-title">Panel del Investigador</h1>
            <button className="btn btn-ghost" onClick={resetAll} title="Reiniciar todo">Reiniciar</button>
          </div>
        </header>

        <main className="app-main">
          {/* Equipo */}
          <section className="card">
            <h2 className="card-title">Equipo</h2>
            <div className="row gap">
              <label className="inline-label">
                <input
                  type="radio"
                  name="teamsize"
                  checked={teamSize === 1}
                  onChange={() => {
                    setTeamSize(1);
                    setParty((prev) => [prev[0] ?? emptyInvestigator()]);
                  }}
                />
                1 personaje
              </label>
              <label className="inline-label">
                <input
                  type="radio"
                  name="teamsize"
                  checked={teamSize === 2}
                  onChange={() => {
                    setTeamSize(2);
                    setParty((prev) => {
                      const a = prev[0] ?? emptyInvestigator();
                      const b = prev[1] ?? emptyInvestigator();
                      return [a, b];
                    });
                  }}
                />
                2 personajes
              </label>
            </div>
          </section>

          {/* Selección personajes */}
          <section className="card">
            <h2 className="card-title">Selecciona personaje(s)</h2>
            <div className="column gap">
              <div>
                <label className="field-label" htmlFor="selA">Personaje A</label>
                <select
                  id="selA"
                  value={party[0]?.id ?? ""}
                  onChange={(e) => {
                    const chosen = e.target.value as InvestigatorState["id"];
                    if (teamSize === 2 && party[1]?.id === chosen) return;
                    setSlotCharacter(0, chosen);
                  }}
                  className="input"
                >
                  <option value="">— Selecciona —</option>
                  {PERSONAJES.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {teamSize === 2 && (
                <div>
                  <label className="field-label" htmlFor="selB">Personaje B</label>
                  <select
                    id="selB"
                    value={party[1]?.id ?? ""}
                    onChange={(e) => {
                      const chosen = e.target.value as InvestigatorState["id"];
                      if (party[0]?.id === chosen) return;
                      setSlotCharacter(1, chosen);
                    }}
                    className="input"
                  >
                    <option value="">— Selecciona —</option>
                    {PERSONAJES.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Fragmentos */}
          <section className="card">
            <h2 className="card-title">Fragmentos de amuleto (global)</h2>
            <div className="row center gap">
              <button className="btn" onClick={() => setFragmentos((v) => Math.max(0, v - 1))}>−</button>
              <span className="big-number">{Math.max(0, fragmentos)}</span>
              <button className="btn" onClick={() => setFragmentos((v) => v + 1)}>+</button>
            </div>
          </section>

          {/* Dado */}
          <section className="card">
            <h2 className="card-title">Dado virtual</h2>
            <div className="row wrap gap">
              <div>
                <label className="field-label">Caras</label>
                <input
                  type="number"
                  min={2}
                  step={1}
                  value={caras}
                  onChange={(e) => setCaras(Math.max(2, Number(e.target.value) || 6))}
                  className="input input-small"
                />
              </div>
              <button
                className={classNames("btn btn-primary", rodando && "btn-disabled")}
                onClick={rollDice}
                disabled={rodando}
              >
                {rodando ? "Lanzando…" : "Lanzar"}
              </button>
              <div className="dice-block">
                <div className={classNames("dice big", rodando && "rolling3d")}>
                  <div className="dice-number">{resultado ?? "–"}</div>
                </div>
                <div className="dice-info">
                  <div className="muted">Último</div>
                  <div className="dice-last">{resultado ?? "—"}</div>
                  <div className="muted small">Penúltimo: {penultimo ?? "—"}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Fichas personajes */}
          {party.slice(0, teamSize).map((inv, idx) => (
            <PersonCard
              key={idx}
              slot={idx as 0 | 1}
              data={inv}
              onDecCordura={() => decCordura(idx as 0 | 1)}
              onIncCordura={() => incCordura(idx as 0 | 1)}
              onDecPistas={() => decPistas(idx as 0 | 1)}
              onIncPistas={() => incPistas(idx as 0 | 1)}
              onAddItem={(id) => addItem(idx as 0 | 1, id)}
              onRemoveItem={(id) => removeItem(idx as 0 | 1, id)}
              onAdjustMod={(k, delta) => adjustMod(idx as 0 | 1, k, delta)}
            />
          ))}

          <footer className="footer">
            <p>Optimizado para móvil. Estado persistente v7.2 (equipo 1–2 + fragmentos globales).</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

// ===================== Subcomponente PersonCard =====================
function PersonCard({
  slot,
  data,
  onDecCordura,
  onIncCordura,
  onDecPistas,
  onIncPistas,
  onAddItem,
  onRemoveItem,
  onAdjustMod,
}: {
  slot: 0 | 1;
  data: InvestigatorState;
  onDecCordura: () => void;
  onIncCordura: () => void;
  onDecPistas: () => void;
  onIncPistas: () => void;
  onAddItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onAdjustMod: (k: StatKey, delta: -1 | 1) => void;
}) {
  const def = useMemo(() => (data.id ? PERSONAJES.find((c) => c.id === data.id) || null : null), [data.id]);
  const itemMods = useMemo(() => computeItemMods(data.inventory), [data.inventory]);
  const totals = useMemo(() => totalStats(data.baseStats, data.modStats, itemMods), [data.baseStats, data.modStats, itemMods]);

  const [invTab, setInvTab] = useState<"add" | "bag">("add");
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<string>("");

  if (!data.id || !def) {
    return (
      <section className="card">
        <p className="muted">Selecciona el Personaje {slot === 0 ? "A" : "B"} para mostrar su ficha.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="row space-between center">
        <h3 className="card-subtitle">
          {def.nombre} <span className="muted small">({slot === 0 ? "A" : "B"})</span>
        </h3>
        <span className="muted tiny">Cordura / Pistas ≥ 0</span>
      </div>

      {/* Atributos */}
      <div className="subcard">
        <div className="subcard-title">Atributos</div>
        {def.habilidad && (
          <p className="text-small"><span className="bold">Habilidad especial:</span> {def.habilidad}</p>
        )}
        {BASE_STATS.map((k) => (
          <div key={k} className="row space-between center attr-row">
            <span className="attr-name">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
            <span className="attr-detail">
              base {data.baseStats[k]}
              {itemMods[k] ? <span className="muted"> (obj {itemMods[k] > 0 ? "+" : ""}{itemMods[k]})</span> : null}
              {data.modStats[k] ? <span className="muted"> (mod {data.modStats[k] > 0 ? "+" : ""}{data.modStats[k]})</span> : null}
            </span>
            <div className="row center gap">
              <button className="btn btn-icon" onClick={() => onAdjustMod(k, -1)}>−</button>
              <span className="big-number small">{totals[k]}</span>
              <button className="btn btn-icon" onClick={() => onAdjustMod(k, +1)}>+</button>
            </div>
          </div>
        ))}
        <p className="muted tiny">Total = base + objetos + ajustes manuales (nunca baja de 0).</p>
      </div>

      {/* Recursos */}
      <div className="subcard">
        <div className="subcard-title">Recursos</div>
        <div className="row space-between center">
          <span className="attr-name">Cordura</span>
          <div className="row center gap">
            <button className="btn btn-icon" onClick={onDecCordura}>−</button>
            <span className="big-number small">{Math.max(0, data.cordura)}</span>
            <button className="btn btn-icon" onClick={onIncCordura}>+</button>
          </div>
        </div>
        <div className="row space-between center">
          <span className="attr-name">Pistas</span>
          <div className="row center gap">
            <button className="btn btn-icon" onClick={onDecPistas}>−</button>
            <span className="big-number small">{Math.max(0, data.pistas)}</span>
            <button className="btn btn-icon" onClick={onIncPistas}>+</button>
          </div>
        </div>
      </div>

      {/* Inventario */}
      <div className="subcard">
        <div className="row gap">
          <button
            className={classNames("pill-tab", invTab === "add" && "pill-tab-active")}
            onClick={() => setInvTab("add")}
          >
            Añadir
          </button>
          <button
            className={classNames("pill-tab", invTab === "bag" && "pill-tab-active")}
            onClick={() => setInvTab("bag")}
          >
            Mochila ({data.inventory.length})
          </button>
        </div>

        <div className="chip-row">
          {data.inventory.length > 0 ? (
            data.inventory.map((id) => {
              const it = ITEMS_DB.find((x) => x.id === id)!;
              return (
                <span key={id} className="chip">
                  {it.nombre}
                  <button title="Quitar" onClick={() => onRemoveItem(id)}>×</button>
                </span>
              );
            })
          ) : (
            <p className="muted tiny">No llevas objetos.</p>
          )}
        </div>

        {invTab === "add" && (
          <div className="column gap">
            <div>
              <label className="field-label">Elegir objeto</label>
              <select
                value={selectedItemToAdd}
                onChange={(e) => setSelectedItemToAdd(e.target.value)}
                className="input"
              >
                <option value="">— Selecciona —</option>
                {ITEMS_DB.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.nombre}{" "}
                    {it.efectos
                      ? `(${Object.entries(it.efectos)
                          .map(([k, v]) => `${k}:${(v as number) > 0 ? "+" : ""}${v}`)
                          .join(" ")})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary full"
              onClick={() => {
                onAddItem(selectedItemToAdd);
                setSelectedItemToAdd("");
                setInvTab("bag");
              }}
              disabled={!selectedItemToAdd}
            >
              Añadir a mochila
            </button>
            <p className="muted tiny">Los efectos se aplican solo a este personaje.</p>
          </div>
        )}

        {invTab === "bag" && (
          <div className="column gap">
            {data.inventory.length === 0 && (
              <p className="muted small">
                No llevas objetos. Añade alguno desde la pestaña “Añadir”.
              </p>
            )}
            {data.inventory.map((id) => {
              const it = ITEMS_DB.find((x) => x.id === id)!;
              return (
                <div key={id} className="item-row">
                  <div className="item-text">
                    <div className="item-title">{it.nombre}</div>
                    <div className="item-desc">{it.descripcion}</div>
                    {it.efectos && (
                      <div className="item-effects">
                        {Object.entries(it.efectos).map(([k, v]) => (
                          <span key={k} className="item-effect">
                            {k}:{(v as number) > 0 ? "+" : ""}{v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-small" onClick={() => onRemoveItem(id)}>
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
