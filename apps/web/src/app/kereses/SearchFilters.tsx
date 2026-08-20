"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatIssueDisplayName, getIssueSlug, getAuthorSlug, normalizeText } from "@/lib/utils";

interface FilterOption {
    _id: string;
    name?: string | null;
    title?: string | null;
    issueNumber?: number | null;
    issueType?: string | null;
    publishedAt?: string | null;
    slug?: { current?: string } | null;
    articleCount?: number | null;
}

interface SearchFiltersProps {
    authors: FilterOption[];
    issues: FilterOption[];
    tags: FilterOption[];
    queryLabel?: string;
    queryPlaceholder?: string;
    authorLabel?: string;
    authorAllOption?: string;
    issueLabel?: string;
    issueAllOption?: string;
    tagLabel?: string;
    tagSearchPlaceholder?: string;
    resetButtonLabel?: string;
}

export default function SearchFilters({
    authors,
    issues,
    tags,
    queryLabel = "Keresőszó",
    queryPlaceholder = "Keresés a cikkek címeiben vagy tartalmában (pl. hit, kegyelem)...",
    authorLabel = "Szerző",
    authorAllOption = "Összes szerző",
    issueLabel = "Lapszám",
    issueAllOption = "Összes lapszám",
    tagLabel = "Tematikus Címkék (több is választható):",
    tagSearchPlaceholder = "Címke keresése a teljes listából...",
    resetButtonLabel = "Szűrők törlése",
}: SearchFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    // Parse URL params with fallback to legacy keys
    const urlK = searchParams.get("k") || searchParams.get("q") || "";
    const urlSzerzo = searchParams.get("szerzo") || searchParams.get("author") || "";
    const urlSzam = searchParams.get("szam") || searchParams.get("issue") || "";
    const urlCimkek = searchParams.get("cimkek") || searchParams.get("tag") || "";

    // Active tags array parsed from comma-separated string
    const activeTagSlugs = urlCimkek
        ? urlCimkek.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : [];

    // Local input states
    const [k, setK] = useState(urlK);
    const [prevUrlK, setPrevUrlK] = useState(urlK);
    const [tagSearch, setTagSearch] = useState("");
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync input state when URL changes externally
    if (urlK !== prevUrlK) {
        setPrevUrlK(urlK);
        setK(urlK);
    }

    const triggerNavigation = (
        newK: string,
        newSzerzo: string,
        newSzam: string,
        newTags: string[]
    ) => {
        const params = new URLSearchParams();
        if (newK.trim()) params.set("k", newK.trim());
        if (newSzerzo) params.set("szerzo", newSzerzo);
        if (newSzam) params.set("szam", newSzam);
        if (newTags.length > 0) params.set("cimkek", newTags.join(","));

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    // Auto-update with debounce on typing 3+ characters or clearing
    const handleQueryChange = (val: string) => {
        setK(val);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            // Auto update if at least 3 characters or cleared back to 0
            if (val.trim().length >= 3 || val.trim().length === 0) {
                triggerNavigation(val, urlSzerzo, urlSzam, activeTagSlugs);
            }
        }, 350);
    };

    // Immediate update on submit (Enter or virtual keyboard search button)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        triggerNavigation(k, urlSzerzo, urlSzam, activeTagSlugs);
    };

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    // Toggle a tag slug in the multi-tag selection
    const handleToggleTag = (slug: string) => {
        const normalizedSlug = slug.toLowerCase();
        let updated: string[];
        if (activeTagSlugs.includes(normalizedSlug)) {
            updated = activeTagSlugs.filter((s) => s !== normalizedSlug);
        } else {
            updated = [...activeTagSlugs, normalizedSlug];
        }
        triggerNavigation(k, urlSzerzo, urlSzam, updated);
    };

    // Top 20 most frequent tags
    const top20Tags = [...tags]
        .sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0))
        .slice(0, 20);

    // Any active tag that is not in the top 20 list should also be shown in the pills list
    const displayedPills = [
        ...top20Tags,
        ...tags.filter(
            (t) =>
                t.slug?.current &&
                activeTagSlugs.includes(t.slug.current.toLowerCase()) &&
                !top20Tags.some((top) => top._id === t._id)
        ),
    ];

    // Filtered tags for the search input dropdown/list
    const searchedTags = tagSearch.trim()
        ? tags
              .filter((t) => {
                  const normTitle = normalizeText(t.title);
                  const normSearch = normalizeText(tagSearch);
                  return normTitle.includes(normSearch);
              })
              .slice(0, 10)
        : [];

    const hasActiveFilters = Boolean(urlK || urlSzerzo || urlSzam || activeTagSlugs.length > 0);

    return (
        <form
            onSubmit={handleSubmit}
            id="search-filter-form"
            className="bg-white border border-[#E5DEC9] rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 min-w-0"
        >
            {/* Top row: Search input + Author dropdown + Issue dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 1. Search Text Input with live debounce and Enter support */}
                <div className="md:col-span-6 flex flex-col space-y-1.5 min-w-0">
                    <label htmlFor="search-input-query" className="text-[11px] uppercase tracking-wider font-bold text-[#302B27]">
                        {queryLabel}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="search-input-query"
                            placeholder={queryPlaceholder}
                            value={k}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            className="w-full px-4 py-2.5 bg-cream-header border border-[#E5DEC9] rounded-xl text-sm focus:outline-none focus:border-brick-red pr-10 text-[#302B27] font-sans"
                        />
                        <button
                            type="submit"
                            id="search-submit-btn"
                            className="absolute right-3 top-3 text-[#302B27] hover:text-brick-red cursor-pointer transition-colors"
                            title="Keresés indítása"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 2. Author Dropdown (slug based) */}
                <div className="md:col-span-3 flex flex-col space-y-1.5 min-w-0">
                    <label htmlFor="search-select-author" className="text-[11px] uppercase tracking-wider font-bold text-[#302B27]">
                        {authorLabel}
                    </label>
                    <select
                        id="search-select-author"
                        value={urlSzerzo}
                        onChange={(e) => {
                            triggerNavigation(k, e.target.value, urlSzam, activeTagSlugs);
                        }}
                        className="w-full px-3 py-2.5 bg-cream-header border border-[#E5DEC9] rounded-xl text-sm focus:outline-none focus:border-brick-red text-[#302B27] font-sans"
                    >
                        <option value="">{authorAllOption}</option>
                        {authors.map((auth) => {
                            const authorSlug = getAuthorSlug(auth);
                            return (
                                <option key={auth._id} value={authorSlug}>
                                    {auth.name}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* 3. Issue Dropdown (slug based) */}
                <div className="md:col-span-3 flex flex-col space-y-1.5 min-w-0">
                    <label htmlFor="search-select-issue" className="text-[11px] uppercase tracking-wider font-bold text-[#302B27]">
                        {issueLabel}
                    </label>
                    <select
                        id="search-select-issue"
                        value={urlSzam}
                        onChange={(e) => {
                            triggerNavigation(k, urlSzerzo, e.target.value, activeTagSlugs);
                        }}
                        className="w-full px-3 py-2.5 bg-cream-header border border-[#E5DEC9] rounded-xl text-sm focus:outline-none focus:border-brick-red text-[#302B27] font-sans"
                    >
                        <option value="">{issueAllOption}</option>
                        {issues.map((iss) => {
                            const issueSlug = getIssueSlug(iss);
                            return (
                                <option key={iss._id} value={issueSlug}>
                                    {formatIssueDisplayName(iss.issueNumber, iss.publishedAt, iss.issueType) || iss.title || "Ismeretlen lapszám"}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* Middle Section: Top 20 Multi-Tag Selection Pills + Tag Search Field */}
            <div className="flex flex-col space-y-3 pt-3 border-t border-[#E5DEC9]/40 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#302B27] flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#C49A45]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.386a11.956 11.956 0 004.825-4.825c.486-.827.313-1.908-.386-2.607L10.66 3.659A2.25 2.25 0 009.568 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                        {tagLabel}
                    </span>

                    {/* Tag Search Input for discovering non-top tags */}
                    <div className="relative max-w-xs w-full">
                        <input
                            type="text"
                            placeholder={tagSearchPlaceholder}
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="w-full px-3 py-1.5 bg-cream-header border border-[#E5DEC9] rounded-lg text-xs focus:outline-none focus:border-brick-red text-[#302B27] placeholder:text-gray-400 font-sans"
                        />
                        {tagSearch && (
                            <button
                                type="button"
                                onClick={() => setTagSearch("")}
                                className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Dropdown / Inline suggestions for Tag Search */}
                {tagSearch.trim() && (
                    <div className="bg-[#FAF7F2] border border-[#E5DEC9] rounded-xl p-3 shadow-xs">
                        <div className="text-[11px] font-bold text-[#4E473F] mb-2">
                            Keresett címkék találatai ({searchedTags.length} db):
                        </div>
                        {searchedTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {searchedTags.map((t) => {
                                    const slug = t.slug?.current || "";
                                    const isSelected = activeTagSlugs.includes(slug.toLowerCase());
                                    return (
                                        <button
                                            key={t._id}
                                            type="button"
                                            onClick={() => {
                                                handleToggleTag(slug);
                                                setTagSearch("");
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? "bg-brick-red text-white border border-brick-red shadow-xs"
                                                    : "bg-white hover:bg-[#E5DEC9] text-[#302B27] border border-[#E5DEC9]"
                                            }`}
                                        >
                                            <span>#{t.title}</span>
                                            {isSelected && <span>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-xs text-[#4E473F]/70 italic">
                                Nem található címke &quot;{tagSearch}&quot; kifejezésre.
                            </div>
                        )}
                    </div>
                )}

                {/* Clickable Top Tags Pills (On/Off toggle) */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {displayedPills.map((t) => {
                        const slug = t.slug?.current || "";
                        const isSelected = activeTagSlugs.includes(slug.toLowerCase());
                        return (
                            <button
                                key={t._id}
                                type="button"
                                onClick={() => handleToggleTag(slug)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none ${
                                    isSelected
                                        ? "bg-brick-red text-white border border-brick-red shadow-xs"
                                        : "bg-cream-header hover:bg-[#E5DEC9] text-[#302B27] border border-[#E5DEC9]"
                                }`}
                            >
                                <span>#{t.title}</span>
                                {isSelected ? (
                                    <span className="text-[10px] bg-white/20 rounded-full px-1">✕</span>
                                ) : t.articleCount ? (
                                    <span className="text-[10px] text-[#302B27]/50 font-normal">({t.articleCount})</span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Row: Reset button */}
            {hasActiveFilters && (
                <div className="flex justify-end pt-2 border-t border-[#E5DEC9]/40">
                    <button
                        type="button"
                        id="search-reset-btn"
                        onClick={() => {
                            setK("");
                            setTagSearch("");
                            startTransition(() => {
                                router.replace(pathname, { scroll: false });
                            });
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {resetButtonLabel}
                    </button>
                </div>
            )}
        </form>
    );
}
