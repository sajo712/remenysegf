import { client } from "@/lib/sanity";
import { GET_ABOUT_PAGE_QUERY } from "@/lib/queries";
import { AboutPageData } from "@/lib/types";
import { RichText } from "@/components/rich-text";

export const metadata = {
    title: "Magunkról",
    description: "Ismerd meg a Reménység Foglyai folyóirat küldetését, szerkesztőségünket és hitvallásunkat.",
};

export default async function AboutPage() {
    let pageData: AboutPageData | null = null;
    try {
        pageData = await client.fetch(GET_ABOUT_PAGE_QUERY) as unknown as AboutPageData;
    } catch (err) {
        console.error("Nem sikerült lekérni a Magunkról oldal adatait:", err);
    }

    const title = pageData?.title || "Magunkról";
    const content = pageData?.content;

    return (
        <article className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-8 animate-fade-in min-w-0">
            <header className="flex flex-col space-y-4 border-b border-[#E5DEC9] pb-6">
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-warm-brown tracking-tight leading-tight">
                    {title}
                </h1>
            </header>

            <div className="w-full">
                {content && content.length > 0 ? (
                    <RichText value={content} />
                ) : (
                    /* Premium Fallback content if Sanity is unpopulated */
                    <div className="prose prose-[#302B27] max-w-none space-y-6">
                        <p className="leading-relaxed text-[#302B27] text-[16px] sm:text-[17px] text-justify font-sans">
                            Szeretettel köszöntjük a <strong>Reménység Foglyai</strong> folyóirat bemutatkozó oldalán! Lapunkat azzal a szívbéli vággyal indítottuk útjára, hogy a mindennapok terhei és harcai közepette bátorítást, szilárd bibliai igazságokat és Isten szabadító kegyelmét hirdessük az olvasóknak.
                        </p>
                        <p className="leading-relaxed text-[#302B27] text-[16px] sm:text-[17px] text-justify font-sans">
                            A nevünket a bibliai Zakariás próféta könyvéből vettük: <em>&quot;Térjetek vissza a várhoz, reménységnek foglyai! Ma is hirdetem nektek, hogy kétszeresen kárpótollak titeket.&quot;</em> (Zakariás 9:12). Meggyőződésünk, hogy a keresztény ember nem a körülmények foglya, hanem a reménységé — egy olyan reménységé, amely nem csal meg, mert Isten Krisztusban adott hűséges ígéretein alapszik.
                        </p>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-warm-brown mt-10 mb-4 tracking-tight leading-tight">
                            Küldetésünk és Célunk
                        </h2>
                        <p className="leading-relaxed text-[#302B27] text-[16px] sm:text-[17px] text-justify font-sans">
                            Folyóiratunk alapvető célkitűzései a következők:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-[#302B27] text-[16px] sm:text-[17px] font-sans">
                            <li><strong>Bibliai Tanítások:</strong> Isten Igéjének hűséges magyarázata és gyakorlati alkalmazása.</li>
                            <li><strong>Bátorítás és Hitbeli Épülés:</strong> Személyes bizonyságtételek és hitmélyítő gondolatok megosztása.</li>
                            <li><strong>Szellemi Táplálék:</strong> Olyan versek, elmélkedések és cikkek, amelyek közelebb vezetnek az Evangélium tiszta forrásához.</li>
                            <li><strong>Zavartalan Olvasási Élmény:</strong> Digitális formában reklámmentesen, letölthető és nyomtatható kivitelben.</li>
                        </ul>
                        <p className="leading-relaxed text-[#302B27] text-[16px] sm:text-[17px] text-justify font-sans">
                            Bízunk benne, hogy a lapszámok olvasása során te is megtapasztalod Isten szellemi megújító erejét, békességét és azt a csodálatos igazságot, hogy az Ő szeretetétől semmi sem választhat el minket.
                        </p>
                    </div>
                )}
            </div>
        </article>
    );
}
