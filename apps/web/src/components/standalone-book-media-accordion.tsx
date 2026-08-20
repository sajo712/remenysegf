"use client";

import React, { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import { CoverImage } from "@/lib/types";
import { getYoutubeId } from "@/lib/utils";

interface StandaloneBookMediaAccordionProps {
    title: string;
    subtitle?: string | null;
    coverImage?: CoverImage | null;
    pdfUrl?: string | null;
    youtubeUrl?: string | null;
    slug: string;
    downloadPdfLabel?: string;
}

export const StandaloneBookMediaAccordion: React.FC<StandaloneBookMediaAccordionProps> = ({
    title,
    subtitle,
    coverImage,
    pdfUrl,
    youtubeUrl,
    slug,
    downloadPdfLabel = "PDF letöltése",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const videoId = getYoutubeId(youtubeUrl);

    const pdfDownloadUrl = pdfUrl
        ? `${pdfUrl}${pdfUrl.includes("?") ? "&" : "?"}dl=${encodeURIComponent(`${slug}.pdf`)}`
        : null;

    const hasMedia = Boolean(coverImage?.asset || pdfUrl || videoId);

    return (
        <header className="flex flex-col space-y-4 border-b border-[#E5DEC9] pb-6">
            {/* Top Badge */}
            <div className="flex items-center gap-3 text-xs text-[#302B27] font-semibold">
                <span className="bg-cream-header border border-[#E5DEC9] px-3 py-1 rounded-full uppercase tracking-wider text-[10px] text-brick-red font-bold">
                    Önálló kiadvány
                </span>
            </div>

            {/* Title with Accordion Toggle Chevron */}
            <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-warm-brown tracking-tight leading-tight flex-1">
                    {title}
                </h1>

                {hasMedia && (
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Média panel bezárása" : "Borítókép, PDF letöltés és média megnyitása"}
                        title={isOpen ? "Média panel bezárása" : "Kattints a borító, letöltés és média megtekintéséhez"}
                        className="shrink-0 p-2 sm:p-2.5 rounded-full bg-cream-header hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-warm-brown transition-all duration-200 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brick-red/50 mt-1"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                                isOpen ? "rotate-180 text-brick-red hover:text-white" : "rotate-0"
                            }`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                )}
            </div>

            {subtitle && (
                <p className="text-lg sm:text-xl text-[#302B27]/95 italic leading-relaxed font-serif">
                    {subtitle}
                </p>
            )}

            {/* Collapsible Accordion Box */}
            {hasMedia && (
                <div
                    className={`transition-all duration-400 ease-in-out overflow-hidden ${
                        isOpen ? "max-h-350 opacity-100 mt-4" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                >
                    <div className="bg-white border border-[#E5DEC9] rounded-2xl p-6 sm:p-8 shadow-sm my-2">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                            {/* Left Column: Book Cover + PDF Download Button (matching Magazine style) */}
                            <div className="w-full max-w-48 sm:max-w-56 md:w-56 shrink-0 mx-auto md:mx-0 flex flex-col space-y-3">
                                {/* Book Cover Image */}
                                <div className="relative aspect-3/4 w-full bg-[#3C2F2F] rounded-xl overflow-hidden shadow-md border border-[#E5DEC9]">
                                    {coverImage?.asset ? (
                                        <Image
                                            src={urlFor(coverImage).width(400).height(533).url()}
                                            alt={coverImage.alt || title || "Kiadvány borító"}
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
                                            <span className="font-serif italic text-xs">Nincs borító</span>
                                        </div>
                                    )}
                                </div>

                                {/* PDF Download Button matching MagazineCard layout and styling */}
                                {pdfUrl ? (
                                    <a
                                        href={pdfDownloadUrl || pdfUrl}
                                        download={`${slug}.pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[#FAF7F2] hover:bg-[#E5DEC9] border border-[#E5DEC9] rounded-xl text-xs font-bold text-[#3C2F2F] tracking-wide uppercase transition-colors duration-150 shadow-xs active:scale-[0.99]"
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

                            {/* Right Column (Desktop) / Bottom (Mobile): YouTube Video Embed (if exists) */}
                            {videoId && (
                                <div className="flex-1 w-full flex flex-col justify-start space-y-3 min-w-0">
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-warm-brown">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-red-600 shrink-0">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                        </svg>
                                        <span>Hangoskönyv / Média Lejátszó</span>
                                    </div>
                                    <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-sm border border-[#E5DEC9]">
                                        <iframe
                                            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                            title={`${title} hangoskönyv`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full absolute inset-0 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
