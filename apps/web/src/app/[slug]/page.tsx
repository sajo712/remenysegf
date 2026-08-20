import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client, urlFor } from "@/lib/sanity";
import { GET_DOCUMENT_BY_SLUG_QUERY, GET_MAGAZINE_PAGE_QUERY } from "@/lib/queries";
import { UnifiedDocument, Footnote, Tag, MagazinePageData } from "@/lib/types";
import { formatIssueDisplayName, getAuthorSlug, getIssueSlug } from "@/lib/utils";
import { RichText } from "@/components/rich-text";
import { ArticleIssueNav } from "@/components/article-issue-nav";
import { StandaloneBookMediaAccordion } from "@/components/standalone-book-media-accordion";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";

// Extract YouTube ID safely from links
function getYoutubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// SEO metadata generation dynamically
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const doc = await client.fetch(GET_DOCUMENT_BY_SLUG_QUERY, { slug }) as UnifiedDocument | null;
    if (!doc) return {};

    return {
        title: doc.title,
        description: doc.subtitle || `Olvasd el a(z) "${doc.title}" című ${doc._type === "standaloneBook" ? "kiadványt" : "cikket"} online!`,
    };
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    let doc: UnifiedDocument | null = null;
    let magazineData: MagazinePageData | null = null;

    try {
        const [docRes, magRes] = await Promise.all([
            client.fetch(GET_DOCUMENT_BY_SLUG_QUERY, { slug }) as Promise<UnifiedDocument | null>,
            client.fetch(GET_MAGAZINE_PAGE_QUERY) as Promise<MagazinePageData | null>,
        ]);
        doc = docRes;
        magazineData = magRes;
    } catch (err) {
        console.error("Nem sikerült lekérni a tartalmat:", err);
    }

    // If the slug is not found, convert slug into clean search keywords and redirect to /kereses
    if (!doc) {
        const cleanedQuery = slug
            .replace(/[-_]+/g, " ")
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
        redirect(`/kereses?k=${encodeURIComponent(cleanedQuery)}`);
    }

    const downloadPdfLabel = magazineData?.downloadPdfButtonLabel || "PDF letöltése";

    // 1. Render Standalone Book
    if (doc._type === "standaloneBook") {
        return (
            <>
                <article className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-8 animate-fade-in min-w-0">
                    {/* Header section with Accordion Media Box */}
                    <StandaloneBookMediaAccordion
                        title={doc.title || ""}
                        subtitle={doc.subtitle}
                        coverImage={doc.coverImage}
                        pdfUrl={doc.pdfUrl}
                        youtubeUrl={doc.youtubeUrl}
                        slug={slug}
                        downloadPdfLabel={downloadPdfLabel}
                    />

                    {/* Book content */}
                    {doc.content && doc.content.length > 0 && (
                        <div className="pt-4 w-full">
                            <RichText value={doc.content} />
                        </div>
                    )}
                </article>

                {/* Fixed Scroll-to-Top Button */}
                <ScrollToTopButton />
            </>
        );
    }

    // 2. Render Article
    return (
        <>
            <article className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-8 animate-fade-in min-w-0">
            {/* Header section with parent issue navigation and language translation link */}
            <header className="flex flex-col space-y-4 border-b border-[#E5DEC9] pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#4E473F] font-semibold">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <ArticleIssueNav
                            issue={doc.issue}
                            currentArticleId={doc._id}
                            currentArticleSlug={doc.slug?.current}
                        />
                        {doc.language === 'en' && (
                            <span className="bg-blue-50 border border-blue-200 text-blue-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase select-none">EN</span>
                        )}
                    </div>

                    {/* Language Switcher / Translation counterpart button */}
                    {doc.translation?.slug?.current && (
                        <Link
                            href={`/${doc.translation.slug.current}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cream-header hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-[#302B27] rounded-full text-xs font-semibold transition-all duration-200 shadow-xs"
                            title={doc.language === 'en' ? "Olvasd el magyarul" : "Read this article in English"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-brick-red">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                            </svg>
                            {doc.language === 'en' ? "🇭🇺 Magyar változat" : "🇬🇧 Read in English"}
                        </Link>
                    )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#3C2F2F] tracking-tight leading-tight">
                    {doc.title}
                </h1>

                {doc.subtitle && (
                    <p className="text-lg sm:text-xl text-[#4E473F] italic leading-relaxed font-serif">
                        {doc.subtitle}
                    </p>
                )}
                {doc.scripture && (
                    <p className="text-md sm:text-lg text-brick-red font-serif font-semibold italic">
                        Alapige: {doc.scripture}
                    </p>
                )}

                {/* Author row */}
                {doc.author?.name && (
                    <div className="flex items-center gap-1.5 pt-2 text-xs text-[#4E473F] font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#C49A45] shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <Link
                            href={`/kereses?szerzo=${getAuthorSlug(doc.author)}`}
                            className="font-bold text-[#3C2F2F] hover:text-brick-red transition-colors underline decoration-[#C49A45]/30 hover:decoration-brick-red"
                            title={`Cikkek keresése ettől a szerzőtől: ${doc.author.name}`}
                        >
                            {doc.author.name}
                        </Link>
                    </div>
                )}
            </header>

            {/* Main Text Body with RichText component (dereferenced internal links, tables, styles) */}
            <div className="w-full">
                <RichText value={doc.content} />
            </div>

            {/* Tags footer cloud */}
            {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-6 border-t border-[#E5DEC9]/40 w-full">
                    {doc.tags.map((tag: Tag) => (
                        <Link
                            key={tag._id}
                            href={`/kereses?cimkek=${tag.slug?.current || ""}`}
                            className="text-xs px-3 py-1.5 bg-cream-header hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-[#302B27] rounded-full font-semibold transition-all duration-200"
                        >
                            #{tag.title}
                        </Link>
                    ))}
                </div>
            )}

            {/* Structured Footnotes Section */}
            {doc.footnotes && doc.footnotes.length > 0 && (
                <section className="mt-12 pt-8 border-t-2 border-[#E5DEC9] flex flex-col space-y-4 w-full">
                    <h3 className="font-serif text-lg font-bold text-[#3C2F2F] flex items-center gap-2 uppercase tracking-wide">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#C49A45]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        Lábjegyzetek
                    </h3>
                    <ol className="divide-y divide-[#E5DEC9]/30 text-xs sm:text-sm text-[#4E473F] font-sans">
                        {doc.footnotes.map((fn: Footnote, idx: number) => (
                            <li 
                                key={fn.anchorId || idx} 
                                id={fn.anchorId || undefined}
                                className="py-3 flex items-start gap-3 target:bg-[#C49A45]/10 target:p-2 target:rounded-lg transition-all duration-300"
                            >
                                <span className="font-bold text-[#C49A45] min-w-5 text-right">
                                    {fn.number}.
                                </span>
                                <div className="flex-1 leading-relaxed">
                                    {fn.text}
                                    {/* Back link jump-scroll arrow */}
                                    {fn.anchorId && (
                                        <a 
                                            href={`#ref-${fn.anchorId}`} 
                                            className="text-[#C49A45] hover:text-[#B38934] font-bold ml-1.5 text-sm select-none"
                                            title="Ugrás vissza a szöveghez"
                                        >
                                            ↩
                                        </a>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {/* Bottom Article Navigation and Language switcher */}
            <div className="pt-8 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-4 w-full">
                <ArticleIssueNav
                    issue={doc.issue}
                    currentArticleId={doc._id}
                    currentArticleSlug={doc.slug?.current}
                />

                {doc.translation?.slug?.current && (
                    <Link
                        href={`/${doc.translation.slug.current}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cream-header hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-[#302B27] rounded-full text-xs font-semibold transition-all duration-200 shadow-xs"
                        title={doc.language === 'en' ? "Olvasd el magyarul" : "Read this article in English"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-brick-red">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                        </svg>
                        {doc.language === 'en' ? "🇭🇺 Magyar változat" : "🇬🇧 Read in English"}
                    </Link>
                )}
            </div>
        </article>

        {/* Fixed Scroll-to-Top Button */}
        <ScrollToTopButton />
        </>
    );
}
