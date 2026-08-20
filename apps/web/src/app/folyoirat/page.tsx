import React, { Suspense } from "react";
import { client } from "@/lib/sanity";
import { GET_ALL_ISSUES_QUERY, GET_MAGAZINE_PAGE_QUERY } from "@/lib/queries";
import { Issue, MagazinePageData } from "@/lib/types";
import { MagazineViewer } from "@/components/magazine/magazine-viewer";

export const metadata = {
    title: "Folyóirat Archívum",
    description: "Böngészd át a Reménység Foglyai folyóirat korábbi lapszámait. Letölthető PDF formátumok, cikkek gyűjteménye és hangoskönyvek.",
};

export default async function MagazineArchivePage() {
    let issues: Issue[] = [];
    let pageData: MagazinePageData | null = null;
    let error = false;

    try {
        const [issuesRes, pageRes] = await Promise.all([
            client.fetch(GET_ALL_ISSUES_QUERY) as Promise<Issue[]>,
            client.fetch(GET_MAGAZINE_PAGE_QUERY) as Promise<MagazinePageData | null>,
        ]);
        issues = issuesRes || [];
        pageData = pageRes;
    } catch (err) {
        console.error("Nem sikerült lekérni az archívumi adatokat:", err);
        error = true;
    }

    // Configurable texts with fallbacks
    const title = pageData?.title || "Lapszám Archívum";
    const description = pageData?.description || "Olvasd el korábbi számainkat! Válassz az alábbi folyóirat-kínálatból a lapszám cikkeinek áttekintéséhez, a PDF letöltéséhez, vagy a hangoskönyv meghallgatásához.";
    const downloadPdfLabel = pageData?.downloadPdfButtonLabel || "PDF Lapszám Letöltése";
    const emptyTitle = pageData?.emptyTitle || "Nincsenek még lapszámok az archívumban";
    const emptyDesc = pageData?.emptyDescription || "Amint feltöltesz lapszámokat és cikkeket a Sanity Stúdióban a Word Importőr segítségével, azok azonnal meg fognak jelenni itt.";

    return (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-6 sm:space-y-8 animate-fade-in min-w-0">
            {/* Header intro */}
            <header className="border-b border-[#E5DEC9] pb-6 flex flex-col space-y-2">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#3C2F2F]">
                    {title}
                </h1>
                <p className="text-sm text-[#4E473F] max-w-2xl leading-relaxed">
                    {description}
                </p>
            </header>

            {error ? (
                <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl">
                    Hiba történt a lapszámok betöltése közben. Kérlek, próbáld újra később.
                </div>
            ) : issues.length > 0 ? (
                /* Dynamic Interactive Carousel & Card Viewer */
                <Suspense fallback={<div className="py-20 text-center text-[#4E473F]/60">Lapszámok betöltése...</div>}>
                    <MagazineViewer
                        issues={issues}
                        pageData={pageData}
                    />
                </Suspense>
            ) : (
                /* Empty State */
                <div className="p-8 border border-dashed border-[#E5DEC9] rounded-2xl bg-white text-center flex flex-col items-center justify-center space-y-4 py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-brick-red">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
                    </svg>
                    <h3 className="font-serif text-xl font-bold text-[#3C2F2F]">{emptyTitle}</h3>
                    <p className="text-sm text-[#4E473F] max-w-sm leading-relaxed">
                        {emptyDesc}
                    </p>
                </div>
            )}
        </div>
    );
}
