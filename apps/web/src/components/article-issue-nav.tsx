import React from "react";
import Link from "next/link";
import { formatIssueDisplayName, getIssueSlug } from "@/lib/utils";

interface ArticleNavIssue {
    _id: string;
    title?: string | null;
    issueNumber?: number | null;
    issueType?: string | null;
    publishedAt?: string | null;
    articles?: Array<{
        _id: string;
        title?: string | null;
        slug?: {
            current?: string;
        } | null;
    }> | null;
}

interface ArticleIssueNavProps {
    issue?: ArticleNavIssue | null;
    currentArticleId?: string;
    currentArticleSlug?: string;
    className?: string;
}

export const ArticleIssueNav: React.FC<ArticleIssueNavProps> = ({
    issue,
    currentArticleId,
    currentArticleSlug,
    className = "",
}) => {
    if (!issue) return null;

    const articles = issue.articles || [];
    const currentIndex = articles.findIndex(
        (a) =>
            (currentArticleId && a._id === currentArticleId) ||
            (currentArticleSlug && a.slug?.current === currentArticleSlug)
    );

    // Navigation is strictly contained within the same issue
    const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
    const nextArticle =
        currentIndex >= 0 && currentIndex < articles.length - 1
            ? articles[currentIndex + 1]
            : null;

    const issueDisplayName =
        formatIssueDisplayName(issue.issueNumber, issue.publishedAt, issue.issueType) ||
        issue.title ||
        "Folyóirat";
    const issueSlug = getIssueSlug(issue);

    return (
        <nav
            aria-label="Cikk és lapszám navigáció"
            className={`inline-flex items-center gap-1.5 sm:gap-2 flex-wrap ${className}`}
        >
            {/* 1. Previous Article Button (only rendered if not the first article) */}
            {prevArticle && prevArticle.slug?.current && (
                <Link
                    href={`/${prevArticle.slug.current}`}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#E5DEC9] border border-[#E5DEC9] rounded-full text-xs font-bold text-brick-red hover:text-[#3C2F2F] shadow-xs transition-all duration-150 group"
                    title={`Előző cikk: ${prevArticle.title || ""}`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5 text-brick-red group-hover:text-[#C49A45] transition-colors shrink-0"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    <span className="hidden sm:inline">Előző cikk</span>
                </Link>
            )}

            {/* 2. Central Issue Link Button */}
            <Link
                href={`/folyoirat?szam=${issueSlug}`}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#E5DEC9] border border-[#E5DEC9] rounded-full text-xs font-bold text-brick-red hover:text-[#3C2F2F] shadow-xs transition-all duration-150 group"
                title="Ugrás a lapszámhoz a folyóirat archívumban"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5 text-brick-red group-hover:text-[#C49A45] transition-colors shrink-0"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                </svg>
                <span>{issueDisplayName}</span>
            </Link>

            {/* 3. Next Article Button (only rendered if not the last article) */}
            {nextArticle && nextArticle.slug?.current && (
                <Link
                    href={`/${nextArticle.slug.current}`}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#E5DEC9] border border-[#E5DEC9] rounded-full text-xs font-bold text-brick-red hover:text-[#3C2F2F] shadow-xs transition-all duration-150 group"
                    title={`Következő cikk: ${nextArticle.title || ""}`}
                >
                    <span className="hidden sm:inline">Következő cikk</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5 text-brick-red group-hover:text-[#C49A45] transition-colors shrink-0"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>
            )}
        </nav>
    );
};
