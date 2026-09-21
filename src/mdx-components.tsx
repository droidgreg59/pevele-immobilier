import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/**
 * Style des balises Markdown générées par les guides éditoriaux
 * (content/guides/*.mdx, Sprint 4) — reprend la charte déjà utilisée sur
 * /methodologie (Fraunces pour les titres, texte muted, listes à puce).
 */
const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 className="mt-9 mb-3 font-display text-xl text-ink">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 font-display text-[17px] text-ink">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-3 max-w-[70ch] text-[14.5px] leading-[1.7] text-muted">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[14.5px] leading-[1.7] text-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14.5px] leading-[1.7] text-muted">
      {children}
    </ol>
  ),
  a: ({ href, children }) => {
    if (href && href.startsWith("/")) {
      return (
        <Link href={href} className="text-blue">
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className="text-blue" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="text-ink">{children}</strong>,
};

export function useMDXComponents(overrides: MDXComponents): MDXComponents {
  return { ...components, ...overrides };
}
