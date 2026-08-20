/**
 * Formats a date string into Year and Month in Hungarian (e.g. "2020. október")
 */
export function formatHungarianYearMonth(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long"
    });
}

/**
 * Formats a date string into standard Hungarian full date format (YYYY. hónap DD.)
 */
export function formatHungarianDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/**
 * Formats an issue's number and publication date into the standardized display name:
 * e.g., "33. szám – 2020. október"
 */
export function formatIssueDisplayName(
    issueNumber: number | null | undefined,
    publishedAt: string | null | undefined,
    issueType?: string | null
): string {
    if (!issueNumber) return "";
    const typeLabel = issueType === "special" ? "különszám" : "szám";
    if (!publishedAt) return `${issueNumber}. ${typeLabel}`;
    const formattedDate = formatHungarianYearMonth(publishedAt);
    return `${issueNumber}. ${typeLabel} – ${formattedDate}`;
}

/**
 * Extracts YouTube video ID safely from various URL formats
 */
export function getYoutubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Normalizes a string by converting to lowercase and stripping diacritics / accents
 * e.g. "Hitből hitbe" -> "hitbol hitbe"
 */
export function normalizeText(text: string | null | undefined): string {
    if (!text) return "";
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Generates a clean URL slug for a magazine issue
 * Examples:
 *   "RF-KSZ-4" -> "rf-ksz-4"
 *   "RF-40" -> "rf-40"
 *   fallback with issueNumber: "rf-40" / "rf-ksz-4"
 */
export function getIssueSlug(issue: {
    title?: string | null;
    issueNumber?: number | null;
    issueType?: string | null;
    _id?: string;
}): string {
    if (issue.title) {
        const slug = normalizeText(issue.title)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        if (slug) return slug;
    }
    if (issue.issueNumber) {
        const isSpecial = issue.issueType === "special";
        return isSpecial ? `rf-ksz-${issue.issueNumber}` : `rf-${issue.issueNumber}`;
    }
    return issue._id ? issue._id.toLowerCase() : "lapszam";
}

/**
 * Finds an issue from an array of issues matching a URL query slug or number or ID
 */
export function findIssueByQuery<T extends {
    _id: string;
    title?: string | null;
    issueNumber?: number | null;
    issueType?: string | null;
}>(issues: T[], query: string | null | undefined): T | null {
    if (!query || !issues || issues.length === 0) return null;
    const normalizedQuery = normalizeText(query);
    const slugQuery = normalizedQuery.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // 1. Direct slug match or title match or ID match
    const exact = issues.find((issue) => {
        const slug = getIssueSlug(issue);
        if (slug === slugQuery || slug === normalizedQuery) return true;
        if (issue.title && normalizeText(issue.title) === normalizedQuery) return true;
        if (issue._id.toLowerCase() === query.toLowerCase().trim()) return true;
        return false;
    });
    if (exact) return exact;

    // 2. Numeric / special detection fallback (e.g. query "40" or "rf40")
    const queryNumeric = normalizedQuery.replace(/[^0-9]/g, "");
    if (queryNumeric) {
        const isQuerySpecial = normalizedQuery.includes("ksz") || normalizedQuery.includes("kulon");
        const numericMatch = issues.find((issue) => {
            if (issue.issueNumber && String(issue.issueNumber) === queryNumeric) {
                const isIssueSpecial = issue.issueType === "special" || (issue.title ? normalizeText(issue.title).includes("ksz") : false);
                return isQuerySpecial === isIssueSpecial;
            }
            return false;
        });
        if (numericMatch) return numericMatch;
    }

    return null;
}

/**
 * Generates a clean URL slug for an author from their name
 * Example: "Szabó János" -> "szabo-janos"
 */
export function getAuthorSlug(author: { name?: string | null; _id?: string }): string {
    if (author.name) {
        const normalized = normalizeText(author.name);
        const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (slug) return slug;
    }
    return author._id ? author._id.toLowerCase() : "";
}

/**
 * Finds an author from an array matching a URL query slug or ID or name
 */
export function findAuthorByQuery<T extends { _id: string; name?: string | null }>(
    authors: T[],
    query: string | null | undefined
): T | null {
    if (!query || !authors || authors.length === 0) return null;
    const normQuery = normalizeText(query);
    const slugQuery = normQuery.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    return (
        authors.find((author) => {
            if (getAuthorSlug(author) === slugQuery) return true;
            if (author._id.toLowerCase() === query.toLowerCase().trim()) return true;
            if (author.name && normalizeText(author.name) === normQuery) return true;
            return false;
        }) || null
    );
}

/**
 * Fuzzy search helper with Hungarian accent-insensitivity
 */
export function calculateFuzzyScore(text: string, query: string): number {
    const normText = normalizeText(text);
    const normQuery = normalizeText(query);
    if (!normText || !normQuery) return 0;

    // Exact substring match gives top score
    if (normText.includes(normQuery)) {
        return 100 + (normQuery.length / normText.length) * 50;
    }

    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return 0;

    let matchedWordsCount = 0;
    for (const qWord of queryWords) {
        if (normText.includes(qWord)) {
            matchedWordsCount += 1;
        } else if (qWord.length >= 3) {
            const textWords = normText.split(/\s+/);
            const partial = textWords.some(
                (tw) =>
                    tw.startsWith(qWord.slice(0, -1)) ||
                    (tw.length >= qWord.length - 1 && isFuzzyWordMatch(tw, qWord))
            );
            if (partial) matchedWordsCount += 0.8;
        }
    }

    if (matchedWordsCount > 0) {
        return (matchedWordsCount / queryWords.length) * 80;
    }

    return 0;
}

function isFuzzyWordMatch(a: string, b: string): boolean {
    if (Math.abs(a.length - b.length) > 2) return false;
    if (a.includes(b) || b.includes(a)) return true;
    let diffs = 0;
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] !== b[j]) {
            diffs++;
            if (diffs > 2) return false;
        }
        i++;
        j++;
    }
    diffs += Math.abs(a.length - b.length);
    return diffs <= 2;
}

export interface SearchSnippet {
    before: string;
    match: string;
    after: string;
}

/**
 * Extracts a contextual snippet (5-6 words before and after the matched query)
 */
export function extractSearchSnippet(
    fullText: string | null | undefined,
    searchTerm: string | null | undefined,
    wordsBeforeCount = 6,
    wordsAfterCount = 6
): SearchSnippet | null {
    if (!fullText || !searchTerm || !searchTerm.trim()) return null;

    const trimmedSearch = searchTerm.trim();
    const normFull = normalizeText(fullText);
    const normSearch = normalizeText(trimmedSearch);

    let matchIndex = normFull.indexOf(normSearch);
    let matchLength = trimmedSearch.length;

    if (matchIndex === -1) {
        // Try searching for individual query words of length >= 3
        const searchWords = normSearch.split(/\s+/).filter((w) => w.length >= 3);
        for (const w of searchWords) {
            const idx = normFull.indexOf(w);
            if (idx !== -1) {
                matchIndex = idx;
                matchLength = w.length;
                break;
            }
        }
    }

    if (matchIndex === -1) return null;

    // Map normalized index to fullText slice
    const beforeRaw = fullText.slice(0, matchIndex);
    const matchRaw = fullText.slice(matchIndex, matchIndex + matchLength);
    const afterRaw = fullText.slice(matchIndex + matchLength);

    // Get 5-6 words before
    const beforeWords = beforeRaw.trim().split(/\s+/).filter(Boolean);
    const slicedBefore = beforeWords.slice(-wordsBeforeCount).join(" ");
    const hasMoreBefore = beforeWords.length > wordsBeforeCount;

    // Get 5-6 words after
    const afterWords = afterRaw.trim().split(/\s+/).filter(Boolean);
    const slicedAfter = afterWords.slice(0, wordsAfterCount).join(" ");
    const hasMoreAfter = afterWords.length > wordsAfterCount;

    return {
        before: `${hasMoreBefore ? "..." : ""}${slicedBefore ? " " + slicedBefore : ""}`,
        match: matchRaw,
        after: `${slicedAfter ? " " + slicedAfter : ""}${hasMoreAfter ? "..." : ""}`,
    };
}
