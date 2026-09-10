const fieldCls =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15";

const labelCls = "text-[11px] font-semibold uppercase tracking-wide text-muted";

export type FraisDefaults = {
  honoraires?: number | null;
  honorairesCharge?: string | null;
  chargesCopro?: number | null;
  taxeFonciere?: number | null;
  chargesLoc?: number | null;
  depotGarantie?: number | null;
  meuble?: boolean | null;
};

/**
 * Bloc « frais & charges » partagé par le dépôt et la modification d'annonce.
 * Champs différents selon la transaction ; tous facultatifs. Le nettoyage
 * (mise à null des champs hors périmètre) est fait côté serveur par
 * `fraisData` (src/lib/listings.ts).
 */
export default function FraisFields({
  transaction,
  defaults = {},
}: {
  transaction: "VENTE" | "LOCATION";
  defaults?: FraisDefaults;
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        Frais &amp; charges (facultatif)
      </legend>

      {transaction === "VENTE" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Honoraires d&apos;agence (€ TTC)</span>
              <input
                type="number"
                name="honoraires"
                min={1}
                defaultValue={defaults.honoraires ?? ""}
                placeholder="ex. 12 000"
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Honoraires à la charge de</span>
              <select
                name="honorairesCharge"
                defaultValue={defaults.honorairesCharge ?? ""}
                className={fieldCls}
              >
                <option value="">Non précisé</option>
                <option value="acquereur">l&apos;acquéreur</option>
                <option value="vendeur">le vendeur</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Charges de copropriété (€ / mois)</span>
              <input
                type="number"
                name="chargesCopro"
                min={1}
                defaultValue={defaults.chargesCopro ?? ""}
                placeholder="ex. 120"
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Taxe foncière (€ / an)</span>
              <input
                type="number"
                name="taxeFonciere"
                min={1}
                defaultValue={defaults.taxeFonciere ?? ""}
                placeholder="ex. 1 400"
                className={fieldCls}
              />
            </label>
          </div>
          <p className="m-0 text-[12px] leading-[1.5] text-muted-2">
            Si les honoraires sont à la charge de l&apos;acquéreur, la loi impose de
            les afficher (montant et prix hors honoraires).
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Provisions sur charges (€ / mois)</span>
              <input
                type="number"
                name="chargesLoc"
                min={1}
                defaultValue={defaults.chargesLoc ?? ""}
                placeholder="ex. 80"
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Dépôt de garantie (€)</span>
              <input
                type="number"
                name="depotGarantie"
                min={1}
                defaultValue={defaults.depotGarantie ?? ""}
                placeholder="ex. 650"
                className={fieldCls}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Meublé</span>
            <select
              name="meuble"
              defaultValue={
                defaults.meuble === true ? "true" : defaults.meuble === false ? "false" : ""
              }
              className={fieldCls}
            >
              <option value="">Non précisé</option>
              <option value="false">Non meublé</option>
              <option value="true">Meublé</option>
            </select>
          </label>
        </>
      )}
    </fieldset>
  );
}
