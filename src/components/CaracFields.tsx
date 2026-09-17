import {
  ETATS,
  EXPOSITIONS,
  CHAUFFAGE_TYPES,
  ASSAINISSEMENTS,
  ETAT_LABEL,
  EXPOSITION_LABEL,
  CHAUFFAGE_TYPE_LABEL,
  ASSAINISSEMENT_LABEL,
} from "@/lib/listing-carac";

const fieldCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";
const labelCls = "text-[11px] font-semibold uppercase tracking-wide text-muted";

export type CaracDefaults = {
  anneeConstruction?: number | null;
  etat?: string | null;
  exposition?: string | null;
  surfaceTerrain?: number | null;
  etage?: number | null;
  ascenseur?: boolean | null;
  nbSallesDeBain?: number | null;
  stationnement?: string | null;
  chauffageType?: string | null;
  fibre?: boolean | null;
  assainissement?: string | null;
};

const triBoolValue = (v: boolean | null | undefined) =>
  v === true ? "true" : v === false ? "false" : "";

/**
 * Bloc « caractéristiques détaillées » partagé par le dépôt et la modification
 * d'annonce. Tous les champs sont facultatifs ; les sélecteurs booléens sont
 * tri-état (« non précisé »). Les champs propres à l'appartement / la maison
 * sont masqués pour les autres types.
 */
export default function CaracFields({
  typeBien,
  defaults = {},
}: {
  typeBien: "MAISON" | "APPARTEMENT" | "TERRAIN";
  defaults?: CaracDefaults;
}) {
  const isAppart = typeBien === "APPARTEMENT";
  const isTerrain = typeBien === "TERRAIN";

  return (
    <fieldset className="m-0 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        Caractéristiques (facultatif)
      </legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Année de construction</span>
          <input
            type="number"
            name="anneeConstruction"
            min={1700}
            max={new Date().getFullYear() + 3}
            defaultValue={defaults.anneeConstruction ?? ""}
            placeholder="ex. 1998"
            className={fieldCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>État général</span>
          <select name="etat" defaultValue={defaults.etat ?? ""} className={fieldCls}>
            <option value="">Non précisé</option>
            {ETATS.map((e) => (
              <option key={e} value={e}>
                {ETAT_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Exposition</span>
          <select
            name="exposition"
            defaultValue={defaults.exposition ?? ""}
            className={fieldCls}
          >
            <option value="">Non précisée</option>
            {EXPOSITIONS.map((e) => (
              <option key={e} value={e}>
                {EXPOSITION_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Salles de bain / d&apos;eau</span>
          <input
            type="number"
            name="nbSallesDeBain"
            min={1}
            defaultValue={defaults.nbSallesDeBain ?? ""}
            placeholder="ex. 2"
            className={fieldCls}
          />
        </label>
      </div>

      {isAppart ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Étage (0 = RDC)</span>
            <input
              type="number"
              name="etage"
              min={0}
              defaultValue={defaults.etage ?? ""}
              placeholder="ex. 2"
              className={fieldCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Ascenseur</span>
            <select
              name="ascenseur"
              defaultValue={triBoolValue(defaults.ascenseur)}
              className={fieldCls}
            >
              <option value="">Non précisé</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </label>
        </div>
      ) : null}

      {!isTerrain ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Chauffage</span>
            <select
              name="chauffageType"
              defaultValue={defaults.chauffageType ?? ""}
              className={fieldCls}
            >
              <option value="">Non précisé</option>
              {CHAUFFAGE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {CHAUFFAGE_TYPE_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Stationnement</span>
            <input
              name="stationnement"
              maxLength={120}
              defaultValue={defaults.stationnement ?? ""}
              placeholder="ex. Garage + 2 places"
              className={fieldCls}
            />
          </label>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!isAppart ? (
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Assainissement</span>
            <select
              name="assainissement"
              defaultValue={defaults.assainissement ?? ""}
              className={fieldCls}
            >
              <option value="">Non précisé</option>
              {ASSAINISSEMENTS.map((a) => (
                <option key={a} value={a}>
                  {ASSAINISSEMENT_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {!isTerrain ? (
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Fibre optique</span>
            <select name="fibre" defaultValue={triBoolValue(defaults.fibre)} className={fieldCls}>
              <option value="">Non précisé</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </label>
        ) : null}
        {!isAppart ? (
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Surface du terrain (m²)</span>
            <input
              type="number"
              name="surfaceTerrain"
              min={1}
              defaultValue={defaults.surfaceTerrain ?? ""}
              placeholder="ex. 480"
              className={fieldCls}
            />
          </label>
        ) : null}
      </div>
    </fieldset>
  );
}
