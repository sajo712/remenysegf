import Link from "next/link";
import { client } from "@/lib/sanity";
import { GET_ENGLISH_ARTICLES_PAGE_QUERY, GET_ENGLISH_ARTICLES_QUERY } from "@/lib/queries";
import { Article, EnglishArticlesPageData } from "@/lib/types";
import { getAuthorSlug } from "@/lib/utils";

export const metadata = {
    title: "English Articles",
    description: "Selection of biblical teachings and articles in English from Prisoners of Hope / Reménység Foglyai.",
};

export default async function EnglishArticlesPage() {
    let pageData: EnglishArticlesPageData | null = null;
    let articles: Article[] = [];
    let error = false;

    try {
        const [pageRes, articlesRes] = await Promise.all([
            client.fetch(GET_ENGLISH_ARTICLES_PAGE_QUERY) as Promise<EnglishArticlesPageData | null>,
            client.fetch(GET_ENGLISH_ARTICLES_QUERY) as Promise<Article[]>,
        ]);
        pageData = pageRes;
        articles = articlesRes || [];
    } catch (err) {
        console.error("Nem sikerült lekérni az angol cikkeket:", err);
        error = true;
    }

    const title = pageData?.title || "English Articles";
    const description = pageData?.description || "A selection of biblical articles, teachings, and spiritual encouragement available in English.";
    const readButtonLabel = pageData?.readButtonLabel || "Read Article";
    const emptyTitle = pageData?.emptyTitle || "No English articles available yet";
    const emptyDesc = pageData?.emptyDescription || "New English articles will appear here as soon as they are published.";

    return (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-8 animate-fade-in min-w-0">
            {/* Header intro */}
            <header className="border-b border-[#E5DEC9] pb-6 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                    <span className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        EN
                    </span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-warm-brown">
                    {title}
                </h1>
                <p className="text-sm text-[#302B27]/80 max-w-xl">
                    {description}
                </p>
            </header>

            {error ? (
                <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                    An error occurred while loading English articles. Please try again later.
                </div>
            ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((art) => (
                        <article 
                            key={art._id}
                            className="bg-white border border-[#E5DEC9] rounded-2xl p-6 shadow-sm hover:shadow hover:border-brick-red/30 transition-all duration-200 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-brick-red">
                                    <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                                        EN
                                    </span>
                                    {art.issue?.title && (
                                        <span className="bg-cream-header border border-[#E5DEC9] px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[#302B27]">
                                            {art.issue.title}
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-serif text-xl font-bold text-warm-brown leading-tight">
                                    <Link 
                                        href={`/${art.slug?.current || ""}`}
                                        className="hover:text-brick-red transition-colors"
                                    >
                                        {art.title}
                                    </Link>
                                </h3>
                                
                                {art.subtitle && (
                                    <p className="text-xs text-[#302B27]/80 italic line-clamp-2">{art.subtitle}</p>
                                )}
                                {art.scripture && (
                                    <p className="text-xs text-brick-red/90 italic font-medium">Scripture: {art.scripture}</p>
                                )}

                                {/* Author & Tag badges */}
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 pt-2 text-xs text-[#302B27]/80">
                                    {art.author?.name && (
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#C49A45]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            <Link
                                                href={`/kereses?szerzo=${getAuthorSlug(art.author)}`}
                                                className="hover:text-brick-red transition-colors underline decoration-[#C49A45]/30 hover:decoration-brick-red font-bold text-[#302B27]"
                                                title={`Filter articles by: ${art.author.name}`}
                                            >
                                                {art.author.name}
                                            </Link>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 mt-4 border-t border-[#E5DEC9]/40">
                                <Link
                                    href={`/${art.slug?.current || ""}`}
                                    className="text-xs text-brick-red hover:text-warm-brown font-bold uppercase tracking-wider flex items-center gap-1 group"
                                >
                                    {readButtonLabel}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="p-8 border border-dashed border-[#E5DEC9] rounded-2xl bg-white text-center flex flex-col items-center justify-center space-y-4 py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-brick-red">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <h3 className="font-serif text-xl font-bold text-warm-brown">{emptyTitle}</h3>
                    <p className="text-sm text-[#302B27]/80 max-w-sm">
                        {emptyDesc}
                    </p>
                </div>
            )}
        </div>
    );
}
