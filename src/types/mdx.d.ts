import type { GuideMetadata } from "@/lib/guides";

declare module "*.mdx" {
  export const metadata: GuideMetadata;
  const MDXContent: (props: Record<string, unknown>) => React.JSX.Element;
  export default MDXContent;
}
