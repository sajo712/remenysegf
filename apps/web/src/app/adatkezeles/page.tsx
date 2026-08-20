import { client } from "@/lib/sanity";
import { GET_PRIVACY_PAGE_QUERY } from "@/lib/queries";
import { PrivacyPageData } from "@/lib/types";
import { RichText } from "@/components/rich-text";

export const metadata = {
    title: "Adatkezelés",
    description: "A Reménység Foglyai weboldal adatkezelési tájékoztatója és adatvédelmi elvei.",
};

export default async function PrivacyPage() {
    let pageData: PrivacyPageData | null = null;
    try {
        pageData = (await client.fetch(GET_PRIVACY_PAGE_QUERY)) as unknown as PrivacyPageData;
    } catch (err) {
        console.error("Nem sikerült lekérni az Adatkezelés oldal adatait:", err);
    }

    const title = pageData?.title || "Adatkezelési Tájékoztató";
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
                    /* Fallback content if Sanity is unpopulated */
                    <div className="prose prose-[#302B27] max-w-none space-y-6">
                        <p className="leading-relaxed text-[#302B27] text-[16px] sm:text-[17px] text-justify font-sans">
                            A <strong>Reménység Foglyai</strong> weboldal üzemeltetői elkötelezettek a látogatók és olvasók személyes adatainak védelme iránt. Jelen tájékoztató célja, hogy közérthető formában bemutassa, milyen adatokat kezelünk, milyen célból és mennyi ideig.
                        </p>

                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-warm-brown mt-10 mb-4 tracking-tight leading-tight">
                            1. Kezelt Adatok Köre és Célja
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 mb-6 text-[#302B27] text-[16px] sm:text-[17px] font-sans">
                            <li>
                                <strong>Kapcsolatfelvétel:</strong> A kapcsolatfelvételi űrlapon megadott név és e-mail cím kizárólag az Ön által küldött üzenet megválaszolására és kapcsolattartásra szolgál.
                            </li>
                            <li>
                                <strong>Hangoskönyvek és Média:</strong> A weboldalon beágyazott YouTube videók kiterjesztett adatvédelmi módban (youtube-nocookie.com) működnek, így nem helyeznek el sütiket böngészőjében anélkül, hogy elindítaná a lejátszást.
                            </li>
                            <li>
                                <strong>Technikai adatok:</strong> A weboldal nem használ harmadik féltől származó követősütiket vagy marketing célú nyomkövetést.
                            </li>
                        </ul>

                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-warm-brown mt-10 mb-4 tracking-tight leading-tight">
                            2. Az Érintettek Jogai
                        </h2>
                        <p className="leading-relaxed text-[#302B27] text-[16px] sm:text-[17px] text-justify font-sans">
                            Ön bármikor jogosult tájékoztatást kérni a kezelt személyes adatairól, kérheti azok helyesbítését vagy törlését a kapcsolatfelvételi űrlapon keresztül.
                        </p>
                    </div>
                )}
            </div>
        </article>
    );
}
