import { client } from "@/lib/sanity";
import { GET_SEARCH_FILTERS_QUERY, SEARCH_ARTICLES_QUERY, GET_SEARCH_PAGE_QUERY } from "@/lib/queries";
import SearchFilters from "./SearchFilters";
import Link from "next/link";
import { Article, SearchPageData, Tag } from "@/lib/types";
import {
    findAuthorByQuery,
    findIssueByQuery,
    getIssueSlug,
    getAuthorSlug,
    calculateFuzzyScore,
    extractSearchSnippet,
    SearchSnippet,
} from "@/lib/utils";

interface FiltersData {
    authors: Array<{ _id: string; name?: string | null }>;
    issues: Array<{
        _id: string;
        title?: string | null;
        issueNumber?: number | null;
        issueType?: string | null;
        publishedAt?: string | null;
    }>;
    tags: Array<{
        _id: string;
        title?: string | null;
        slug?: { current?: string } | null;
        articleCount?: number | null;
    }>;
}

export const metadata = {
    title: "Tartalmi Kereső",
    description: "Keresd meg a téged érdeklő bibliai magyarázatokat, verseket és tanításokat szerző, lapszám vagy címkék alapján.",
};

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{
        k?: string;
        q?: string;
        szerzo?: string;
        author?: string;
        szam?: string;
        issue?: string;
        cimkek?: string;
        tag?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;

    // Parse filters from URL search parameters with fallback to legacy keys
    const k = resolvedSearchParams.k || resolvedSearchParams.q || "";
    const paramSzerzo = resolvedSearchParams.szerzo || resolvedSearchParams.author || "";
    const paramSzam = resolvedSearchParams.szam || resolvedSearchParams.issue || "";
    const paramCimkek = resolvedSearchParams.cimkek || resolvedSearchParams.tag || "";

    let pageData: SearchPageData | null = null;
    let filtersData: FiltersData = { authors: [], issues: [], tags: [] };
    let rawArticles: Article[] = [];
    let hasActiveFilters = false;
    let error = false;

    try {
        // Fetch page config and filters first to resolve slug references
        const [pageRes, filters] = await Promise.all([
            client.fetch(GET_SEARCH_PAGE_QUERY) as Promise<SearchPageData | null>,
            client.fetch(GET_SEARCH_FILTERS_QUERY) as Promise<FiltersData>,
        ]);

        pageData = pageRes;
        filtersData = filters || { authors: [], issues: [], tags: [] };

        // Resolve author ID from slug or ID
        const matchedAuthor = findAuthorByQuery(filtersData.authors, paramSzerzo);
        const authorId = matchedAuthor ? matchedAuthor._id : "";

        // Resolve issue ID from slug or ID
        const matchedIssue = findIssueByQuery(filtersData.issues, paramSzam);
        const issueId = matchedIssue ? matchedIssue._id : "";

        // Parse multi-tag slugs
        const tagSlugs = paramCimkek
            ? paramCimkek
                  .split(",")
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean)
            : [];

        hasActiveFilters = Boolean(
            k.trim() || authorId || issueId || tagSlugs.length > 0
        );

        // Fetch candidate articles only if at least one filter parameter is specified
        if (hasActiveFilters) {
            rawArticles = (await client.fetch(SEARCH_ARTICLES_QUERY, {
                authorId,
                issueId,
                tagSlugs,
            })) as Article[];
        }
    } catch (err) {
        console.error("Keresési adatbázis hiba:", err);
        error = true;
    }

    // Apply client-level fuzzy search and context snippet extraction
    interface ScoredArticleItem {
        article: Article;
        score: number;
        snippet: SearchSnippet | null;
    }

    const scoredItems: ScoredArticleItem[] = (rawArticles || []).map((art) => {
        if (!k.trim()) {
            return { article: art, score: 100, snippet: null };
        }

        const titleScore = calculateFuzzyScore(art.title || "", k) * 3;
        const subtitleScore = calculateFuzzyScore(art.subtitle || "", k) * 2;
        const scriptureScore = calculateFuzzyScore(art.scripture || "", k) * 1.5;
        const authorScore = calculateFuzzyScore(art.author?.name || "", k) * 1.5;
        const contentScore = calculateFuzzyScore(art.plainContent || "", k);

        const totalScore = Math.max(titleScore, subtitleScore, scriptureScore, authorScore, contentScore);

        // Extract context snippet: 5-6 words before and 5-6 words after
        let snippet = extractSearchSnippet(art.plainContent, k, 6, 6);
        if (!snippet && art.subtitle) {
            snippet = extractSearchSnippet(art.subtitle, k, 6, 6);
        }
        if (!snippet && art.scripture) {
            snippet = extractSearchSnippet(art.scripture, k, 6, 6);
        }
        if (!snippet && art.title) {
            snippet = extractSearchSnippet(art.title, k, 6, 6);
        }

        return { article: art, score: totalScore, snippet };
    });

    const articles: ScoredArticleItem[] = k.trim()
        ? scoredItems.filter((item) => item.score > 0).sort((a, b) => b.score - a.score)
        : scoredItems;

    const title = pageData?.title || "Tartalmi Kereső";
    const description =
        pageData?.description ||
        "Keress rá konkrét szavakra a cikkek szövegében, szűrj szerzőink szerint, válaszd ki egy adott lapszám cikkeit, vagy böngéssz kedvedre tematikus címkék szerint.";
    const resultsHeading = pageData?.resultsHeading || "Találatok";
    const readButtonLabel = pageData?.readButtonLabel || "Elolvasom";
    const noResultsTitle = pageData?.noResultsTitle || "Nincs találat a megadott szűrésre";
    const noResultsDescription =
        pageData?.noResultsDescription ||
        "Próbálkozz más keresőszóval, vagy töltsd be a szűrők törlésével az összes elérhető cikket.";

    return (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-8 animate-fade-in min-w-0">
            {/* Header intro */}
            <header className="border-b border-[#E5DEC9] pb-6 flex flex-col space-y-2">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-warm-brown">
                    {title}
                </h1>
                <p className="text-sm text-[#302B27]/80 max-w-xl leading-relaxed">
                    {description}
                </p>
            </header>

            {/* Interactive Client-Side Filters Component */}
            <SearchFilters
                authors={filtersData.authors || []}
                issues={filtersData.issues || []}
                tags={filtersData.tags || []}
                queryLabel={pageData?.queryLabel || undefined}
                queryPlaceholder={pageData?.queryPlaceholder || undefined}
                authorLabel={pageData?.authorLabel || undefined}
                authorAllOption={pageData?.authorAllOption || undefined}
                issueLabel={pageData?.issueLabel || undefined}
                issueAllOption={pageData?.issueAllOption || undefined}
                tagLabel={pageData?.tagLabel || undefined}
                tagSearchPlaceholder={pageData?.tagSearchPlaceholder || undefined}
                resetButtonLabel={pageData?.resetButtonLabel || undefined}
            />

            {hasActiveFilters && (
                error ? (
                    <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl">
                        Hiba történt a keresési találatok betöltése közben. Kérlek, próbáld újra később.
                    </div>
                ) : articles.length > 0 ? (
                    /* Search Results Listings */
                    <div className="space-y-6 min-w-0">
                        <h2 className="text-xs uppercase tracking-wider font-bold text-[#302B27] border-b border-[#E5DEC9] pb-2 flex items-center justify-between">
                            <span>{resultsHeading} ({articles.length} db cikk)</span>
                            {k.trim() && (
                                <span className="text-[11px] font-normal text-[#4E473F] normal-case">
                                    Keresett kifejezés: <strong>&quot;{k.trim()}&quot;</strong>
                                </span>
                            )}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                            {articles.map(({ article: art, snippet }) => (
                                <article
                                    key={art._id}
                                    className="bg-white border border-[#E5DEC9] rounded-2xl p-6 shadow-sm hover:shadow hover:border-brick-red/30 transition-all duration-200 flex flex-col justify-between min-w-0"
                                >
                                    <div className="space-y-3 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-brick-red">
                                            {art.issue && (
                                                <Link
                                                    href={`/folyoirat?szam=${getIssueSlug(art.issue)}`}
                                                    className="bg-cream-header hover:bg-[#E5DEC9] border border-[#E5DEC9] px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[#302B27] transition-colors"
                                                    title="Ugrás a lapszámhoz"
                                                >
                                                    {art.issue.title || (art.issue.issueNumber ? `${art.issue.issueNumber}. szám` : "Lapszám")}
                                                </Link>
                                            )}
                                            {art.language === "en" && (
                                                <span className="bg-blue-50 border border-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-bold uppercase select-none">
                                                    EN
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-serif text-xl font-bold text-warm-brown leading-tight wrap-break-word">
                                            <Link
                                                href={`/${art.slug?.current || ""}`}
                                                className="hover:text-brick-red transition-colors"
                                            >
                                                {art.title}
                                            </Link>
                                        </h3>

                                        {art.subtitle && (
                                            <p className="text-xs text-[#302B27]/80 italic line-clamp-2 wrap-break-word">
                                                {art.subtitle}
                                            </p>
                                        )}
                                        {art.scripture && (
                                            <p className="text-xs text-brick-red/90 italic font-medium wrap-break-word">
                                                Alapige: {art.scripture}
                                            </p>
                                        )}

                                        {/* Found Term Context Snippet (5-6 words before and after) */}
                                        {snippet && (
                                            <div className="bg-[#FAF7F2] border-l-2 border-l-[#C49A45] border-[#E5DEC9] px-3 py-2 rounded-r-lg text-xs text-[#4E473F] leading-relaxed font-serif my-2 min-w-0">
                                                <span className="text-[10px] uppercase font-bold text-[#C49A45] block font-sans mb-0.5">
                                                    Megtalált szövegkörnyezet:
                                                </span>
                                                <p className="italic wrap-break-word">
                                                    {snippet.before}
                                                    <mark className="bg-[#C49A45]/30 text-[#3C2F2F] font-bold px-1 py-0.5 rounded mx-0.5 not-italic border border-[#C49A45]/40">
                                                        {snippet.match}
                                                    </mark>
                                                    {snippet.after}
                                                </p>
                                            </div>
                                        )}

                                        {/* Author & Tags */}
                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 pt-2 text-xs text-[#302B27]/80 min-w-0">
                                            {art.author?.name && (
                                                <span className="flex items-center gap-1.5 min-w-0">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={2}
                                                        stroke="currentColor"
                                                        className="w-3.5 h-3.5 text-[#C49A45] shrink-0"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                                        />
                                                    </svg>
                                                    <Link
                                                        href={`/kereses?szerzo=${getAuthorSlug(art.author)}`}
                                                        className="truncate font-bold text-[#302B27] hover:text-brick-red transition-colors underline decoration-[#C49A45]/30 hover:decoration-brick-red"
                                                        title={`Szűrés erre a szerzőre: ${art.author.name}`}
                                                    >
                                                        {art.author.name}
                                                    </Link>
                                                </span>
                                            )}
                                            {art.tags && art.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {art.tags.slice(0, 3).map((tag: Tag) => (
                                                        <span
                                                            key={tag._id}
                                                            className="text-[10px] bg-cream-header text-[#302B27]/70 px-1.5 py-0.2 rounded font-medium"
                                                        >
                                                            #{tag.title}
                                                        </span>
                                                    ))}
                                                    {art.tags.length > 3 && (
                                                        <span className="text-[10px] text-gray-400">
                                                            +{art.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 mt-4 border-t border-[#E5DEC9]/40">
                                        <Link
                                            href={`/${art.slug?.current || ""}`}
                                            className="text-xs text-brick-red hover:text-warm-brown font-bold uppercase tracking-wider flex items-center gap-1 group"
                                        >
                                            {readButtonLabel}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                                stroke="currentColor"
                                                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* No Results State */
                    <div className="p-8 border border-dashed border-[#E5DEC9] rounded-2xl bg-white text-center flex flex-col items-center justify-center space-y-4 py-20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-16 h-16 text-brick-red"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                            />
                        </svg>
                        <h3 className="font-serif text-xl font-bold text-warm-brown">{noResultsTitle}</h3>
                        <p className="text-sm text-[#302B27]/80 max-w-sm">{noResultsDescription}</p>
                    </div>
                )
            )}
        </div>
    );
}
