import Link from "next/link";

type Room = {
  href: string;
  bg: string;
  hoverBg: string;
  titre: string;
  titreColor: string;
  cta: string;
  desc?: string;
  meta?: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
};

const houseIcon = (
  <div className="pointer-events-none absolute right-6 top-1/2 h-[140px] w-[190px] -translate-y-[38%]">
    <span className="absolute inset-0 border border-dashed border-[#C7CBDA]" />
    <span className="absolute left-[33px] top-4 h-[42px] w-[124px] rounded-t-lg rounded-b-[4px] border-2 border-[#AEB4C8]">
      <span className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-[#AEB4C8]" />
      <span className="absolute left-20 top-0 bottom-0 w-0.5 bg-[#AEB4C8]" />
    </span>
    <span className="absolute left-[76px] top-[82px] h-9 w-9 rounded-full border-2 border-[#AEB4C8]" />
    <span className="absolute right-[22px] top-[86px] h-6 w-6 rounded-full border-2 border-[#AEB4C8]">
      <span className="absolute inset-1.5 rounded-full bg-[#C7CBDA]" />
    </span>
  </div>
);

const easelIcon = (
  <div className="pointer-events-none absolute bottom-6 right-6 h-[52px] w-[74px] border-2 border-[#D4B96A]">
    <span className="absolute left-2.5 right-2.5 top-2.5 h-0.5 bg-[#D4B96A]" />
    <span className="absolute left-2.5 right-6 top-[22px] h-0.5 bg-[#D4B96A]" />
    <span className="absolute left-2.5 right-4 top-[34px] h-0.5 bg-[#D4B96A]" />
    <span className="absolute -right-2.5 -top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#D4B96A] bg-[#FBF3DC] font-sans text-[11px] font-semibold text-gold">
      +
    </span>
  </div>
);

const kitchenIcon = (
  <div className="pointer-events-none absolute bottom-[30px] right-[22px] h-[38px] w-[60px] rounded border-2 border-[#AEB4C8]">
    <span className="absolute -left-5 top-[9px] h-[15px] w-[15px] rounded-full border-2 border-[#AEB4C8]" />
    <span className="absolute -right-5 top-[9px] h-[15px] w-[15px] rounded-full border-2 border-[#AEB4C8]" />
  </div>
);

const gardenIcon = (
  <div className="pointer-events-none absolute right-5 top-1/2 h-[120px] w-[220px] -translate-y-[48%]">
    <span className="absolute left-6 top-1.5 h-[38px] w-[38px] rounded-full border-2 border-[#9FB394]">
      <span className="absolute inset-[10px] rounded-full border-2 border-[#9FB394]" />
    </span>
    <span className="absolute left-[82px] top-[54px] h-[26px] w-[26px] rounded-full border-2 border-[#9FB394]">
      <span className="absolute inset-[7px] rounded-full bg-[#9FB394]" />
    </span>
    <span
      className="absolute right-0 top-1.5 h-[104px] w-[50px] border-[1.5px] border-[#9FB394]"
      style={{
        background:
          "repeating-linear-gradient(45deg,transparent 0 6px,rgba(159,179,148,.4) 6px 8px)",
      }}
    />
    <span className="absolute bottom-3 left-[60px] w-[104px] rotate-[-14deg] border-t-2 border-dashed border-[#9FB394]" />
  </div>
);

const bureauIcon = (
  <div className="pointer-events-none absolute bottom-7 left-6 h-[26px] w-20 rounded-sm border-2 border-[#AEB4C8]">
    <span className="absolute left-2 top-[5px] h-3.5 w-6 rounded-sm border-2 border-[#AEB4C8]" />
    <span className="absolute -top-6 left-[29px] h-[18px] w-[18px] rounded-full border-2 border-[#AEB4C8]" />
  </div>
);

const entreeIcon = (
  <>
    <div className="pointer-events-none absolute bottom-[60px] right-3 h-12 w-12 rounded-bl-full border-b-[1.5px] border-l-[1.5px] border-dashed border-[#AEB4C8]" />
    <div
      className="pointer-events-none absolute bottom-[34px] right-5 h-[15px] w-10 border-[1.5px] border-[#AEB4C8]"
      style={{
        background:
          "repeating-linear-gradient(90deg,transparent 0 4px,rgba(174,180,200,.5) 4px 6px)",
      }}
    />
  </>
);

const rooms: Room[] = [
  {
    href: "/acheter",
    bg: "bg-[#F7F4EA]",
    hoverBg: "hover:bg-[#FDEBC2]",
    titre: "Séjour",
    titreColor: "text-blue",
    cta: "TOUTES LES ANNONCES →",
    desc: "Agences et particuliers, réunis dans la grande pièce — triés, vérifiés, comparables.",
    meta: "≈ 42 m²",
    icon: houseIcon,
  },
  {
    href: "/vendre",
    bg: "bg-[#FBF3DC]",
    hoverBg: "hover:bg-[#FDEBC2]",
    titre: "Atelier",
    titreColor: "text-gold",
    cta: "DÉPOSER UNE ANNONCE →",
    desc: "Particulier ou agence : votre annonce en ligne en 3 étapes.",
    meta: "≈ 15 m²",
    icon: easelIcon,
  },
  {
    href: "/estimer",
    bg: "bg-[#EFEDF5]",
    hoverBg: "hover:bg-[#FDEBC2]",
    titre: "Cuisine",
    titreColor: "text-blue",
    cta: "ESTIMER MON BIEN →",
    meta: "≈ 18 m²",
    icon: kitchenIcon,
  },
  {
    href: "/villages",
    bg: "bg-[#EBF1E4]",
    hoverBg: "hover:bg-[#FDEBC2]",
    titre: "Jardin",
    titreColor: "text-green",
    cta: "LES 19 VILLAGES →",
    desc: "Guides, gares TER, écoles — et les annonces épinglées village par village.",
    meta: "≈ 650 m²",
    icon: gardenIcon,
  },
  {
    href: "/professionnels",
    bg: "bg-[#EDF2F8]",
    hoverBg: "hover:bg-[#FDEBC2]",
    titre: "Bureau",
    titreColor: "text-blue",
    cta: "LES AGENCES PARTENAIRES →",
    meta: "≈ 12 m²",
    icon: bureauIcon,
  },
  {
    href: "/louer",
    bg: "bg-[#F7F4EA]",
    hoverBg: "hover:bg-[#FDEBC2]",
    titre: "Entrée",
    titreColor: "text-blue",
    cta: "LOUER EN PÉVÈLE →",
    icon: entreeIcon,
    extra: (
      <div className="flex items-center gap-2.5">
        <span className="animate-pin-pulse h-3.5 w-3.5 rounded-full border-2 border-ink bg-yellow" />
        <span className="font-mono text-[11px] font-medium text-ink">
          VOUS ÊTES ICI
        </span>
      </div>
    ),
  },
];

export default function PlanHub() {
  return (
    <div className="animate-view-in">
      <div className="flex flex-wrap items-end justify-between gap-8 px-9 pb-4.5 pt-10">
        <h1 className="animate-draw-in m-0 font-display text-[60px] leading-[0.98] tracking-[.005em] text-ink sm:text-[76px]">
          TROUVEZ VOTRE PLACE
          <br />
          <span className="text-blue">SUR LE PLAN.</span>
        </h1>
        <div className="animate-draw-in flex flex-col gap-2 pb-1.5 text-right">
          <span className="font-mono text-xs font-medium text-blue">
            TOUTES LES ANNONCES DE LA PÉVÈLE —
            <br />
            AGENCES ET PARTICULIERS, SUR UN SEUL PLAN.
          </span>
          <span className="font-sans text-[13px] text-muted">
            Cherchez directement, ou visitez la maison pièce par pièce.
          </span>
        </div>
      </div>

      <form
        action="/acheter"
        method="get"
        className="animate-draw-in px-9 pb-6.5"
      >
        <div className="grid grid-cols-1 border-[3px] border-ink bg-white shadow-[6px_6px_0_rgba(39,67,166,.25)] sm:grid-cols-[1.5fr_1fr_1fr_auto]">
          <label className="flex flex-col gap-1 border-r-2 border-line px-5 py-4">
            <span className="font-mono text-[9.5px] font-medium text-muted-2">
              OÙ ?
            </span>
            <input
              name="q"
              placeholder="Village, ou « toute la Pévèle »"
              className="border-0 bg-transparent font-sans text-[15px] font-semibold text-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 border-r-2 border-line px-5 py-4">
            <span className="font-mono text-[9.5px] font-medium text-muted-2">
              QUOI ?
            </span>
            <select
              name="type"
              defaultValue=""
              className="cursor-pointer border-0 bg-transparent font-sans text-[15px] font-semibold text-ink outline-none"
            >
              <option value="">Tous types</option>
              <option value="MAISON">Maison</option>
              <option value="APPARTEMENT">Appartement</option>
              <option value="TERRAIN">Terrain</option>
            </select>
          </label>
          <div className="flex flex-col gap-1 px-5 py-4">
            <span className="font-mono text-[9.5px] font-medium text-muted-2">
              BUDGET
            </span>
            <span className="font-sans text-[15px] font-semibold text-ink">
              ≤ 600 000 € ▾
            </span>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center bg-blue px-8 py-4 font-mono text-[13px] font-semibold text-white hover:bg-ink sm:justify-start"
          >
            CHERCHER →
          </button>
        </div>
      </form>

      <div className="max-w-[1400px] px-9 pb-10">
        <div className="relative grid grid-cols-1 gap-[7px] bg-blue p-3 sm:grid-cols-3 sm:grid-rows-2">
          {rooms.map((room, i) => (
            <Link
              key={room.href}
              href={room.href}
              className={`animate-room-in relative flex min-h-[210px] flex-col justify-between px-6.5 py-6 transition-colors sm:min-h-0 ${room.bg} ${room.hoverBg}`}
              style={{ animationDelay: `${0.15 + i * 0.13}s` }}
            >
              {room.icon}
              <div>
                <div className={`font-sans text-[27px] font-semibold ${room.titreColor}`}>
                  {room.titre}
                </div>
                <div className="mt-1.5 font-mono text-[11.5px] font-medium text-ink">
                  {room.cta}
                </div>
              </div>
              {room.extra ?? (
                <div className="flex items-end justify-between gap-4">
                  {room.desc ? (
                    <span className="max-w-[36ch] font-sans text-[13.5px] leading-[1.5] text-muted">
                      {room.desc}
                    </span>
                  ) : (
                    <span />
                  )}
                  {room.meta ? (
                    <span className="font-mono text-[11px] font-medium text-muted-2">
                      {room.meta}
                    </span>
                  ) : null}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-[90px] bg-blue" />
            <span className="h-1.5 w-[90px] border border-blue bg-white" />
            <span className="font-mono text-[10.5px] font-medium text-blue">
              0 ——— 5 m
            </span>
          </div>
          <span className="font-mono text-[10.5px] font-medium text-blue">
            N ↑ · UN SEUL PLAN POUR TOUTE LA PÉVÈLE — AGENCES &amp; PARTICULIERS
            BIENVENUS.
          </span>
        </div>
      </div>
    </div>
  );
}
