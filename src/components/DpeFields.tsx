const CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;

const fieldCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

export type DpeDefaults = {
  dpe?: string | null;
  ges?: string | null;
  dpeConsommation?: number | null;
  dpeEmissions?: number | null;
};

/**
 * Bloc « diagnostic énergétique » partagé par le dépôt et la modification
 * d'annonce : classe énergie (DPE) + classe climat (GES) + consommation et
 * émissions. Les valeurs figurent sur le DPE fourni par le vendeur.
 */
export default function DpeFields({ defaults = {} }: { defaults?: DpeDefaults }) {
  return (
    <fieldset className="m-0 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        Diagnostic énergétique (DPE)
      </legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Classe énergie
          </span>
          <select name="dpe" defaultValue={defaults.dpe ?? ""} className={fieldCls}>
            <option value="">Non renseignée</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Classe climat (GES)
          </span>
          <select name="ges" defaultValue={defaults.ges ?? ""} className={fieldCls}>
            <option value="">Non renseignée</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Consommation (kWh/m²/an)
          </span>
          <input
            type="number"
            name="dpeConsommation"
            min={1}
            defaultValue={defaults.dpeConsommation ?? ""}
            placeholder="ex. 154"
            className={fieldCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Émissions (kgCO₂/m²/an)
          </span>
          <input
            type="number"
            name="dpeEmissions"
            min={1}
            defaultValue={defaults.dpeEmissions ?? ""}
            placeholder="ex. 6"
            className={fieldCls}
          />
        </label>
      </div>

      <p className="m-0 text-[12px] leading-[1.5] text-muted-2">
        Ces informations figurent sur le DPE. Un logement classé F ou G (énergie ou
        climat) est signalé « à consommation énergétique excessive ».
      </p>
    </fieldset>
  );
}
