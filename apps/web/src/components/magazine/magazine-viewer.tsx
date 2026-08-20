"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Issue, MagazinePageData } from "@/lib/types";
import { getIssueSlug, findIssueByQuery } from "@/lib/utils";
import { MagazineCarousel } from "./magazine-carousel";
import { MagazineCard } from "./magazine-card";

interface MagazineViewerProps {
    issues: Issue[];
    pageData?: MagazinePageData | null;
}

export const MagazineViewer: React.FC<MagazineViewerProps> = ({
    issues,
    pageData,
}) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const hasAutoScrolledRef = useRef<boolean>(false);

    // Deep link query parameters
    const paramQuery = searchParams.get("szam") || searchParams.get("issue");
    const isAudiobookRequested = searchParams.has("yt") || searchParams.get("tab") === "audio";

    // Initial Issue Resolution
    const getInitialIssueId = (): string => {
        if (!issues || issues.length === 0) return "";
        if (paramQuery) {
            const matched = findIssueByQuery(issues, paramQuery);
            if (matched) return matched._id;
        }
        return issues[0]._id;
    };

    const [selectedIssueId, setSelectedIssueId] = useState<string>(getInitialIssueId);
    const [prevParamQuery, setPrevParamQuery] = useState<string | null>(paramQuery);

    // Sync state if query parameter changes without cascading effect renders
    if (paramQuery !== prevParamQuery) {
        setPrevParamQuery(paramQuery);
        if (paramQuery && issues.length > 0) {
            const matched = findIssueByQuery(issues, paramQuery);
            if (matched && matched._id !== selectedIssueId) {
                setSelectedIssueId(matched._id);
            }
        }
    }

    // Scroll smoothly to the issue card on initial deep link navigation
    useEffect(() => {
        if ((paramQuery || isAudiobookRequested) && !hasAutoScrolledRef.current && cardContainerRef.current) {
            hasAutoScrolledRef.current = true;
            const timer = setTimeout(() => {
                cardContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [paramQuery, isAudiobookRequested]);

    const handleSelectIssue = (issueId: string) => {
        if (issueId === selectedIssueId) return;

        // Trigger smooth card transition
        setIsTransitioning(true);
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

        setSelectedIssueId(issueId);

        transitionTimerRef.current = setTimeout(() => {
            setIsTransitioning(false);
        }, 180);

        const selected = issues.find((i) => i._id === issueId);
        if (selected) {
            const slug = getIssueSlug(selected);
            const params = new URLSearchParams(searchParams.toString());
            params.set("szam", slug);
            params.delete("issue"); // Clean legacy param
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    };

    useEffect(() => {
        return () => {
            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        };
    }, []);

    if (!issues || issues.length === 0) return null;

    const selectedIssue = issues.find((i) => i._id === selectedIssueId) || issues[0];

    const carouselSelectLabel = pageData?.carouselSelectLabel || "Folyóiratunk megjelent számai";
    const articlesTabLabel = pageData?.articlesTabLabel || "Cikkek Tartalma";
    const audiobookTabLabel = pageData?.audiobookTabLabel || "Hangoskönyv";
    const audiobookUnavailableLabel = pageData?.audiobookUnavailableLabel || "(nem elérhető)";
    const downloadPdfLabel = pageData?.downloadPdfButtonLabel || "PDF Lapszám Letöltése";

    return (
        <div className="flex flex-col space-y-6 sm:space-y-8 w-full max-w-full min-w-0">
            {/* 1. Horizontal Carousel Issue Selector */}
            <div className="flex flex-col space-y-1.5 sm:space-y-2 w-full max-w-full min-w-0">
                <div className="flex items-center px-1 flex-wrap gap-x-1.5">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#4E473F] flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#C49A45] shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        <span>{carouselSelectLabel}</span>
                    </span>
                    <span className="text-[11px] font-normal text-[#4E473F]/70 tracking-normal font-sans">
                        (összesen {issues.length})
                    </span>
                </div>
                
                <MagazineCarousel
                    issues={issues}
                    selectedIssueId={selectedIssue._id}
                    onSelectIssue={handleSelectIssue}
                />
            </div>

            {/* 2. Active Issue Detail Card (Articles & Audiobook Tabs) */}
            <div
                ref={cardContainerRef}
                id="lapszam-kartya"
                className="w-full max-w-full min-w-0 scroll-mt-24 sm:scroll-mt-28"
            >
                <MagazineCard
                    issue={selectedIssue}
                    articlesTabLabel={articlesTabLabel}
                    audiobookTabLabel={audiobookTabLabel}
                    audiobookUnavailableLabel={audiobookUnavailableLabel}
                    downloadPdfLabel={downloadPdfLabel}
                    isTransitioning={isTransitioning}
                    initialTab={isAudiobookRequested ? "audio" : "articles"}
                />
            </div>
        </div>
    );
};
