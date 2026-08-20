"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import { Issue } from "@/lib/types";
import { formatHungarianYearMonth } from "@/lib/utils";

interface MagazineCarouselProps {
    issues: Issue[];
    selectedIssueId: string;
    onSelectIssue: (issueId: string) => void;
}

export const MagazineCarousel: React.FC<MagazineCarouselProps> = ({
    issues,
    selectedIssueId,
    onSelectIssue,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLButtonElement>(null);

    // Mouse drag-scroll & momentum physics state
    const [isMouseDown, setIsMouseDown] = useState(false);
    const isMouseDownRef = useRef<boolean>(false);
    const startXRef = useRef<number>(0);
    const startScrollLeftRef = useRef<number>(0);
    const hasDraggedRef = useRef<boolean>(false);
    const pointerHistoryRef = useRef<Array<{ x: number; time: number }>>([]);
    const animationFrameRef = useRef<number | null>(null);
    const prevSelectedIssueIdRef = useRef<string>(selectedIssueId);

    const cancelAnimation = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.scrollSnapType = "";
        }
    }, []);

    // Calculate stepSize (itemWidth + gap) and visible item count dynamically
    const getLayoutInfo = useCallback(() => {
        if (!scrollContainerRef.current) return { stepSize: 120, visibleCount: 4 };
        const container = scrollContainerRef.current;
        const item0 = container.children[0] as HTMLElement | undefined;
        const item1 = container.children[1] as HTMLElement | undefined;
        if (!item0) return { stepSize: 120, visibleCount: 4 };

        const stepSize = item1 ? (item1.offsetLeft - item0.offsetLeft) : (item0.offsetWidth + 10);
        const containerWidth = container.clientWidth;
        const visibleCount = Math.max(1, Math.round(containerWidth / (stepSize || 1)));
        return { stepSize, visibleCount };
    }, []);

    // Smooth ease-out animation directly to an exact integer slot (no clipping)
    const animateToScroll = useCallback((targetScroll: number, durationMs: number = 400) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        container.style.scrollSnapType = "none";

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const startScroll = container.scrollLeft;
        const delta = targetScroll - startScroll;

        if (Math.abs(delta) < 1) {
            container.scrollLeft = targetScroll;
            container.style.scrollSnapType = "";
            return;
        }

        const startTime = performance.now();

        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            // Ease-out cubic curve for natural decelerating momentum
            const ease = 1 - Math.pow(1 - progress, 3);

            container.scrollLeft = startScroll + delta * ease;

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(step);
            } else {
                container.scrollLeft = targetScroll;
                container.style.scrollSnapType = "";
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(step);
    }, []);

    // Scroll to a selected issue ensuring whole-item alignment for both odd and even layouts
    const scrollToIssue = useCallback(
        (issueId: string, direction: "left" | "right" | "auto" = "auto") => {
            if (!scrollContainerRef.current) return;
            const index = issues.findIndex((i) => i._id === issueId);
            if (index === -1) return;

            const { stepSize, visibleCount } = getLayoutInfo();
            if (stepSize <= 0) return;

            let centerOffset = 0;
            if (visibleCount % 2 === 1) {
                // Odd number of visible items: place in dead center (e.g. 3 -> slot 1, 5 -> slot 2)
                centerOffset = Math.floor(visibleCount / 2);
            } else {
                // Even number of visible items: avoid splitting cards!
                // Place at left-center or right-center depending on direction
                if (direction === "left") {
                    centerOffset = visibleCount / 2;
                } else if (direction === "right") {
                    centerOffset = visibleCount / 2 - 1;
                } else {
                    centerOffset = Math.floor((visibleCount - 1) / 2);
                }
            }

            const maxSlot = Math.max(0, issues.length - visibleCount);
            const targetSlot = Math.max(0, Math.min(index - centerOffset, maxSlot));
            const targetScroll = targetSlot * stepSize;

            animateToScroll(targetScroll, 450);
        },
        [issues, getLayoutInfo, animateToScroll]
    );

    // Scroll active item into view ONLY when selectedIssueId changes
    useEffect(() => {
        if (prevSelectedIssueIdRef.current !== selectedIssueId) {
            const prevIndex = issues.findIndex((i) => i._id === prevSelectedIssueIdRef.current);
            const nextIndex = issues.findIndex((i) => i._id === selectedIssueId);
            const direction = nextIndex >= prevIndex ? "right" : "left";
            prevSelectedIssueIdRef.current = selectedIssueId;
            scrollToIssue(selectedIssueId, direction);
        }
    }, [selectedIssueId, issues, scrollToIssue]);

    // Advance by a full visible set of items (page-by-page)
    const handleScroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const { stepSize, visibleCount } = getLayoutInfo();
        if (stepSize <= 0) return;

        const currentSlot = Math.round(container.scrollLeft / stepSize);
        const deltaSlots = Math.max(1, visibleCount);
        const maxSlot = Math.max(0, issues.length - visibleCount);
        const targetSlot = direction === "left"
            ? Math.max(0, currentSlot - deltaSlots)
            : Math.min(maxSlot, currentSlot + deltaSlots);

        animateToScroll(targetSlot * stepSize, 400);
    };

    // -------------------------------------------------------------
    // Mouse Drag-to-Scroll Handlers with Momentum Acceleration
    // -------------------------------------------------------------
    const onMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        cancelAnimation();
        setIsMouseDown(true);
        isMouseDownRef.current = true;
        hasDraggedRef.current = false;
        startXRef.current = e.clientX;
        startScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.style.scrollSnapType = "none";
        pointerHistoryRef.current = [{ x: e.clientX, time: performance.now() }];
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isMouseDownRef.current || !scrollContainerRef.current) return;
        const currentX = e.clientX;
        const now = performance.now();
        const deltaX = currentX - startXRef.current;

        if (Math.abs(deltaX) > 4) {
            hasDraggedRef.current = true;
        }

        // Direct 1:1 drag response
        scrollContainerRef.current.scrollLeft = startScrollLeftRef.current - deltaX;

        // Keep rolling history of last 100ms for accurate release velocity
        const history = pointerHistoryRef.current;
        history.push({ x: currentX, time: now });
        while (history.length > 0 && now - history[0].time > 100) {
            history.shift();
        }
    }, []);

    const onMouseUpOrLeave = useCallback(() => {
        if (!isMouseDownRef.current || !scrollContainerRef.current) {
            setIsMouseDown(false);
            isMouseDownRef.current = false;
            return;
        }

        setIsMouseDown(false);
        isMouseDownRef.current = false;

        const container = scrollContainerRef.current;
        const { stepSize, visibleCount } = getLayoutInfo();
        const maxSlot = Math.max(0, issues.length - visibleCount);
        const currentScroll = container.scrollLeft;

        const now = performance.now();
        const history = pointerHistoryRef.current.filter((p) => now - p.time <= 100);

        let velocity = 0;
        if (history.length >= 2) {
            const first = history[0];
            const last = history[history.length - 1];
            const dt = last.time - first.time;
            const dx = last.x - first.x;
            if (dt > 10 && Math.abs(dx) > 3) {
                velocity = dx / dt; // px per millisecond
            }
        }
        pointerHistoryRef.current = [];

        // Project momentum travel distance (moderate, natural feel)
        const projectedTravel = velocity * 220;
        const projectedScroll = currentScroll - projectedTravel;

        // Always target an exact integer card slot (no clipping)
        const targetSlot = Math.round(projectedScroll / (stepSize || 1));
        const clampedSlot = Math.max(0, Math.min(targetSlot, maxSlot));
        const targetScroll = clampedSlot * stepSize;

        const distance = Math.abs(targetScroll - currentScroll);
        // Duration scales with distance for natural momentum glide
        const duration = Math.min(650, Math.max(250, distance * 0.85));

        animateToScroll(targetScroll, duration);
    }, [issues.length, getLayoutInfo, animateToScroll]);

    // Attach global mouse listeners persistently
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => onMouseMove(e);
        const handleWindowMouseUp = () => onMouseUpOrLeave();

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            window.removeEventListener("mouseup", handleWindowMouseUp);
            cancelAnimation();
        };
    }, [onMouseMove, onMouseUpOrLeave, cancelAnimation]);

    const handleItemClick = (issueId: string) => {
        if (hasDraggedRef.current) return;
        cancelAnimation();
        onSelectIssue(issueId);
    };

    if (!issues || issues.length === 0) return null;

    return (
        <div className="relative w-full py-1 group select-none px-7 sm:px-9">
            {/* Left Navigation Arrow */}
            <button
                type="button"
                onClick={() => handleScroll("left")}
                aria-label="Előző lapszámok lapozása"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#FAF7F2] border border-[#E5DEC9] text-[#3C2F2F] hover:bg-[#3C2F2F] hover:text-white shadow-md flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C49A45] active:scale-95 cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            {/* Scrollable Container with exact-fit no-clipping track */}
            <div
                ref={scrollContainerRef}
                onMouseDown={onMouseDown}
                className={`magazine-carousel-track flex items-stretch overflow-x-auto pb-2 pt-1 px-0 no-scrollbar touch-pan-x min-w-0 ${
                    isMouseDown ? "cursor-grabbing select-none" : "cursor-grab"
                }`}
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {issues.map((issue) => {
                    const isSelected = issue._id === selectedIssueId;
                    const typeLabel = issue.issueType === "special" ? "Különszám" : "szám";
                    const issueNumberText = issue.issueNumber ? `${issue.issueNumber}. ${typeLabel}` : (issue.title || "Lapszám");
                    const dateText = formatHungarianYearMonth(issue.publishedAt);

                    return (
                        <button
                            key={issue._id}
                            ref={isSelected ? activeItemRef : null}
                            onClick={() => handleItemClick(issue._id)}
                            className={`magazine-carousel-item shrink-0 flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all duration-300 text-left border select-none ${
                                isSelected
                                    ? "bg-[#FAF7F2] border-[#C49A45] shadow-md ring-2 ring-[#C49A45]/30 -translate-y-0.5"
                                    : "bg-white border-[#E5DEC9] hover:border-[#C49A45]/60 hover:bg-[#FAF7F2]/60 shadow-2xs"
                            }`}
                        >
                            {/* Compact Thumbnail Container */}
                            <div className="relative w-full aspect-3/4 bg-[#3C2F2F] rounded-lg overflow-hidden mb-1.5 shadow-inner flex items-center justify-center pointer-events-none">
                                {issue.coverImage?.asset ? (
                                    <Image
                                        src={urlFor(issue.coverImage).width(200).height(267).url()}
                                        alt={issue.coverImage.alt || issueNumberText}
                                        fill
                                        sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 180px"
                                        draggable={false}
                                        className={`object-cover transition-transform duration-300 ${
                                            isSelected ? "scale-105" : "group-hover:scale-105 opacity-90 hover:opacity-100"
                                        }`}
                                    />
                                ) : (
                                    <div className="text-center p-1 text-white/60 text-[10px] sm:text-xs font-serif italic">
                                        {issue.issueNumber ? `#${issue.issueNumber}` : "RF"}
                                    </div>
                                )}

                                {/* Selected Indicator Badge */}
                                {isSelected && (
                                    <div className="absolute top-1 right-1 bg-[#C49A45] text-white p-0.5 sm:p-1 rounded-full shadow">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <span className={`text-[10px] sm:text-xs font-serif font-bold text-center line-clamp-1 w-full pointer-events-none leading-tight ${
                                isSelected ? "text-[#3C2F2F]" : "text-[#4E473F]"
                            }`}>
                                {issueNumberText}
                            </span>
                            
                            {dateText && (
                                <span className="text-[8px] sm:text-[10px] text-[#4E473F]/80 text-center font-sans mt-0.5 line-clamp-1 w-full pointer-events-none">
                                    {dateText}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Right Navigation Arrow */}
            <button
                type="button"
                onClick={() => handleScroll("right")}
                aria-label="Következő lapszámok lapozása"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#FAF7F2] border border-[#E5DEC9] text-[#3C2F2F] hover:bg-[#3C2F2F] hover:text-white shadow-md flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C49A45] active:scale-95 cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    );
};
