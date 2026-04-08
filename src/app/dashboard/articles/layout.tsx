/**
 * Full-height column so the article editor fills the main area without a second
 * page-level scrollbar (dashboard main already wraps children in overflow-y-auto).
 */
export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
    return <div className="flex h-full min-h-0 flex-col overflow-hidden">{children}</div>;
}
