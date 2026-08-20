"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity";
import { Issue } from "@/lib/types";
import { formatHungarianYearMonth, getYoutubeId, getIssueSlug, getAuthorSlug } from "@/lib/utils";

interface MagazineCardProps {
    issue: Issue;
    articlesTabLabel?: string;
    audiobookTabLabel?: string;
    audiobookUnavailableLabel?: string;
    downloadPdfLabel?: string;
    isTransitioning?: boolean;
    initialTab?: "articles" | "audio";
}

export const MagazineCard: React.FC<MagazineCardProps> = ({
    issue,
    articlesTabLabel = "Cikkek Tartalma",
    audiobookTabLabel = "Hangoskönyv",
    audiobookUnavailableLabel = "(nem elérhető)",
    downloadPdfLabel = "PDF Lapszám Letöltése",
    isTransitioning = false,
    initialTab = "articles",
}) => {
    const hasAudiobook = Boolean(issue.youtubeUrl && getYoutubeId(issue.youtubeUrl));
    const [selectedTab, setSelectedTab] = useState<"articles" | "audio">(initialTab);
    const [prevInitialTab, setPrevInitialTab] = useState<"articles" | "audio">(initialTab);

    // Sync if initialTab prop changes (e.g. from deep link query params)
    if (initialTab !== prevInitialTab) {
        setPrevInitialTab(initialTab);
        setSelectedTab(initialTab);
    }

    const activeTab = hasAudiobook ? selectedTab : "articles";

    const videoId = getYoutubeId(issue.youtubeUrl);
    const typeLabel = issue.issueType === "special" ? "különszám" : "szám";
    const issueNumberText = issue.issueNumber ? `${issue.issueNumber}. ${typeLabel}` : (issue.title || "Lapszám");
    const formattedDate = formatHungarianYearMonth(issue.publishedAt);

    // Clean [slug].pdf download URL for Sanity CDN
    const pdfSlug = getIssueSlug(issue);
    const pdfDownloadUrl = issue.pdfUrl
        ? `${issue.pdfUrl}${issue.pdfUrl.includes("?") ? "&" : "?"}dl=${encodeURIComponent(`${pdfSlug}.pdf`)}`
        : null;

    // Extract unique deduplicated tags from all articles belonging to this issue
    const issueTags = useMemo(() => {
        if (!issue.articles || issue.articles.length === 0) return [];
        const tagMap = new Map<string, { _id: string; title: string; slug: string }>();
        for (const article of issue.articles) {
            if (article.tags && article.tags.length > 0) {
                for (const t of article.tags) {
                    if (t._id && t.title && t.slug?.current) {
                        tagMap.set(t._id, { _id: t._id, title: t.title, slug: t.slug.current });
                    }
                }
            }
        }
        return Array.from(tagMap.values()).sort((a, b) => a.title.localeCompare(b.title, "hu"));
    }, [issue.articles]);

    return (
        <div className="w-full max-w-full bg-white border border-[#E5DEC9] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 min-w-0">
            {/* Top Navigation Tabs Header (Strictly overflow-y-hidden to prevent vertical scroll) */}
            <div className="flex items-center border-b border-[#E5DEC9] bg-[#FAF7F2]/60 px-3 sm:px-6 pt-2 gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0">
                {/* Articles Tab */}
                <button
                    type="button"
                    onClick={() => setSelectedTab("articles")}
                    className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all duration-200 border-t border-x whitespace-nowrap ${
                        activeTab === "articles"
                            ? "bg-white border-[#E5DEC9] text-[#3C2F2F] shadow-xs relative"
                            : "border-transparent text-[#4E473F]/80 hover:text-[#3C2F2F] hover:bg-white/50 cursor-pointer"
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C49A45] shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span>{articlesTabLabel}</span>
                    {issue.articles && issue.articles.length > 0 && (
                        <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 bg-[#FAF7F2] border border-[#E5DEC9] text-[#4E473F] text-[9px] sm:text-[10px] rounded-full font-bold">
                            {issue.articles.length}
                        </span>
                    )}
                </button>

                {/* Audiobook Tab */}
                <button
                    type="button"
                    disabled={!hasAudiobook}
                    onClick={() => hasAudiobook && setSelectedTab("audio")}
                    className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all duration-200 border-t border-x whitespace-nowrap ${
                        !hasAudiobook
                            ? "border-transparent text-[#4E473F]/40 cursor-not-allowed opacity-60"
                            : activeTab === "audio"
                            ? "bg-white border-[#E5DEC9] text-[#3C2F2F] shadow-xs relative"
                            : "border-transparent text-[#4E473F]/80 hover:text-[#3C2F2F] hover:bg-white/50 cursor-pointer"
                    }`}
                    title={hasAudiobook ? "Hangoskönyv meghallgatása" : "Ehhez a lapszámhoz nem érhető el hangoskönyv"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${hasAudiobook ? "text-brick-red" : "text-gray-400"}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    <span>{audiobookTabLabel}</span>
                    {!hasAudiobook && (
                        <span className="hidden sm:inline text-[9px] text-gray-400 font-normal">
                            {audiobookUnavailableLabel}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Body with Responsive Margins and Smooth Transition */}
            <div className={`p-4 sm:p-6 md:p-8 transition-all duration-300 ease-out min-w-0 ${
                isTransitioning ? "opacity-30 translate-y-1 scale-[0.998]" : "opacity-100 translate-y-0 scale-100"
            }`}>
                {/* ------------------------------------------- */}
                {/* TAB 1: ARTICLES VIEW */}
                {/* ------------------------------------------- */}
                {activeTab === "articles" && (
                    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start min-w-0">
                        {/* Left Column: Cover Photo & Download PDF */}
                        <div className="w-full sm:w-48 md:w-52 lg:w-56 shrink-0 flex flex-col space-y-3 min-w-0 mx-auto md:mx-0">
                            <div className="relative aspect-3/4 max-w-48 sm:max-w-none w-full mx-auto bg-[#3C2F2F] rounded-xl overflow-hidden shadow-md border border-[#E5DEC9]">
                                {issue.coverImage?.asset ? (
                                    <Image
                                        src={urlFor(issue.coverImage).width(400).height(533).url()}
                                        alt={issue.coverImage.alt || issueNumberText}
                                        fill
                                        sizes="(max-width: 768px) 220px, 320px"
                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 p-4 text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                        </svg>
                                        <span className="font-serif italic text-xs sm:text-sm">{issueNumberText}</span>
                                    </div>
                                )}
                            </div>

                            {/* Download PDF Button with Custom [slug].pdf Name */}
                            {issue.pdfUrl ? (
                                <a
                                    href={pdfDownloadUrl || issue.pdfUrl}
                                    download={`${pdfSlug}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="max-w-48 sm:max-w-none w-full mx-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[#FAF7F2] hover:bg-[#E5DEC9] border border-[#E5DEC9] rounded-xl text-xs font-bold text-[#3C2F2F] tracking-wide uppercase transition-colors duration-150 shadow-xs active:scale-[0.99]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-600 shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    <span className="truncate">{downloadPdfLabel}</span>
                                </a>
                            ) : (
                                <div className="text-center text-xs text-[#4E473F]/60 italic py-1">
                                    Nincs csatolt PDF kiadvány
                                </div>
                            )}
                        </div>

                        {/* Main content area: Articles List (Left/Center) + A folyóirat témái (Right on desktop, bottom on mobile) */}
                        <div className="flex-1 w-full min-w-0 flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
                            {/* Articles List Block */}
                            <div className="flex-1 w-full min-w-0 flex flex-col space-y-3">
                                {/* Clean Typographic Title Header */}
                                <div className="flex flex-col space-y-0.5 min-w-0">
                                    <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#3C2F2F] tracking-tight leading-tight wrap-break-word">
                                        {issueNumberText}
                                    </h2>
                                    {formattedDate && (
                                        <p className="text-sm sm:text-base font-serif italic text-[#C49A45] font-semibold wrap-break-word">
                                            {formattedDate}
                                        </p>
                                    )}
                                </div>

                                {/* Divider line */}
                                <hr className="border-[#E5DEC9] my-1" />

                                {/* Articles Numbered List */}
                                {issue.articles && issue.articles.length > 0 ? (
                                    <ol className="divide-y divide-[#E5DEC9]/40 flex flex-col min-w-0">
                                        {issue.articles.map((article, idx) => (
                                            <li
                                                key={article._id || idx}
                                                className="py-3 sm:py-3.5 first:pt-1 last:pb-1 flex items-start gap-2.5 sm:gap-3.5 group min-w-0"
                                            >
                                                {/* Sequential Number */}
                                                <span className="font-serif text-sm sm:text-base font-bold text-[#C49A45] min-w-4 sm:min-w-5 pt-0.5 select-none shrink-0">
                                                    {idx + 1}.
                                                </span>

                                                {/* Article details */}
                                                <div className="flex-1 flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
                                                    <Link
                                                        href={`/${article.slug?.current || ""}`}
                                                        className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#3C2F2F] group-hover:text-brick-red transition-colors leading-snug wrap-break-word"
                                                    >
                                                        {article.title}
                                                        {article.language === "en" && (
                                                            <span className="ml-1.5 inline-block bg-blue-50 border border-blue-200 text-blue-800 text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-bold uppercase align-middle shrink-0">
                                                                EN
                                                            </span>
                                                        )}
                                                    </Link>

                                                    {article.subtitle && (
                                                        <p className="text-xs sm:text-sm text-[#4E473F] italic leading-relaxed font-serif wrap-break-word">
                                                            {article.subtitle}
                                                        </p>
                                                    )}

                                                    {article.author?.name && (
                                                        <div className="flex items-center gap-1.5 pt-0.5 text-[11px] sm:text-xs text-[#4E473F] font-medium min-w-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C49A45] shrink-0">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                            </svg>
                                                            <Link
                                                                href={`/kereses?szerzo=${getAuthorSlug(article.author)}`}
                                                                className="truncate hover:text-brick-red transition-colors underline decoration-[#C49A45]/30 hover:decoration-brick-red"
                                                                title={`Cikkek keresése ettől a szerzőtől: ${article.author.name}`}
                                                            >
                                                                {article.author.name}
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <div className="p-6 sm:p-8 border border-dashed border-[#E5DEC9] rounded-xl text-center text-[#4E473F]/70 text-xs sm:text-sm">
                                        Ehhez a lapszámhoz nincsenek még cikkek feltöltve.
                                    </div>
                                )}
                            </div>

                            {/* Right Block (on desktop) / Bottom Block (on mobile): A folyóirat témái (Topic Cloud) */}
                            {issueTags.length > 0 && (
                                <div className="w-full xl:w-64 shrink-0 bg-[#FAF7F2] border border-[#E5DEC9] rounded-xl p-4 sm:p-5 flex flex-col space-y-3 min-w-0">
                                    <h3 className="text-xs uppercase tracking-wider font-bold text-[#3C2F2F] flex items-center gap-1.5 border-b border-[#E5DEC9] pb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#C49A45] shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.386a11.956 11.956 0 004.825-4.825c.486-.827.313-1.908-.386-2.607L10.66 3.659A2.25 2.25 0 009.568 3z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                        </svg>
                                        A folyóirat témái
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {issueTags.map((tag) => (
                                            <Link
                                                key={tag._id}
                                                href={`/kereses?cimkek=${tag.slug}`}
                                                className="text-xs px-2.5 py-1 bg-white hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-[#302B27] rounded-full font-medium transition-all duration-150 shadow-xs"
                                                title={`Keresés erre a témára: ${tag.title}`}
                                            >
                                                #{tag.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ------------------------------------------- */}
                {/* TAB 2: AUDIOBOOK VIEW */}
                {/* ------------------------------------------- */}
                {activeTab === "audio" && (
                    <div className="flex flex-col space-y-4 animate-fade-in w-full min-w-0">
                        {/* Audiobook Header matching Articles Tab typography + responsive YouTube action */}
                        <div className="flex items-center justify-between gap-3 border-b border-[#E5DEC9] pb-4 min-w-0">
                            <div className="flex flex-col space-y-0.5 min-w-0">
                                <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#3C2F2F] tracking-tight leading-tight wrap-break-word">
                                    {issueNumberText}
                                </h2>
                                {formattedDate && (
                                    <p className="text-sm sm:text-base font-serif italic text-[#C49A45] font-semibold wrap-break-word">
                                        {formattedDate}
                                    </p>
                                )}
                            </div>
                            {issue.youtubeUrl && (
                                <a
                                    href={issue.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
                                    title="Megnyitás a YouTube-on"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                    </svg>
                                    <span className="hidden sm:inline">YouTube</span>
                                </a>
                            )}
                        </div>

                        {/* Player Frame with exact matching margins */}
                        {videoId ? (
                            <div className="aspect-video w-full max-w-full relative rounded-xl overflow-hidden shadow-md border border-[#E5DEC9] bg-black">
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                    title={`${issueNumberText} hangoskönyv`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full absolute inset-0"
                                />
                            </div>
                        ) : (
                            <div className="p-6 sm:p-8 border border-dashed border-[#E5DEC9] rounded-xl text-center text-[#4E473F]/70 text-xs sm:text-sm">
                                Nem található beágyazható hangoskönyv videó.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
