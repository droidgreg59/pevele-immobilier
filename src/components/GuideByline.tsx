/** Bandeau auteur/dates d'un guide éditorial — jamais une Person, voir AGENTS.md. */
export default function GuideByline({
  author,
  publishedAt,
  updatedAt,
}: {
  author: string;
  publishedAt: string;
  updatedAt: string;
}) {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "long" });
  return (
    <p className="mt-2 text-[12.5px] text-muted-2">
      {author} · Publié le {fmt(publishedAt)}
      {updatedAt !== publishedAt ? ` · Mis à jour le ${fmt(updatedAt)}` : ""}
    </p>
  );
}
