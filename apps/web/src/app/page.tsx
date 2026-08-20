import Image from "next/image";
import Link from "next/link";
import { client, urlFor } from "@/lib/sanity";
import { GET_HOME_PAGE_QUERY, GET_NEWEST_ISSUE_QUERY, GET_MAGAZINE_PAGE_QUERY } from "@/lib/queries";
import { Issue, Tag, HomePageData, MagazinePageData } from "@/lib/types";
import { RichText } from "@/components/rich-text";
import { MagazineCard } from "@/components/magazine/magazine-card";

export default async function HomePage() {
    let newestIssue: Issue | null = null;
    let newestIssueError = false;
    let homeData: HomePageData | null = null;
    let magazineData: MagazinePageData | null = null;

    try {
        const [issueRes, homeRes, magRes] = await Promise.all([
            client.fetch(GET_NEWEST_ISSUE_QUERY) as Promise<Issue | null>,
            client.fetch(GET_HOME_PAGE_QUERY) as Promise<HomePageData | null>,
            client.fetch(GET_MAGAZINE_PAGE_QUERY) as Promise<MagazinePageData | null>,
        ]);
        newestIssue = issueRes;
        homeData = homeRes;
        magazineData = magRes;
    } catch (err) {
        console.error("Nem sikerült lekérni a kezdőlap adatait:", err);
        newestIssueError = true;
    }

    // Fetch truly most popular tags ordered by article reference count descending
    let popularTags: Tag[] = [];
    try {
        popularTags = await client.fetch(
            `*[_type == "tag" && count(*[_type == "article" && references(^._id)]) > 0] | order(count(*[_type == "article" && references(^._id)]) desc)[0...20]{
                _id,
                title,
                slug,
                "articleCount": count(*[_type == "article" && references(^._id)])
            }`
        );
    } catch (err) {
        console.error("Címkék lekérési hiba:", err);
    }

    // Configurable texts with fallbacks
    const latestIssueSectionTitle = homeData?.latestIssueTitle || "Aktuális Lapszámunk";
    const welcomeTitle = homeData?.welcomeTitle || "Kedves Olvasó!";
    const popularTagsTitle = homeData?.popularTagsTitle || "Népszerű témakörök";

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Full-width Hero Banner with 16:9 Middle 2/3 Aspect Ratio & Sunset Transition */}
            {homeData?.heroImage?.asset && (
                <section className="relative w-full overflow-hidden aspect-24/9 min-h-55 sm:min-h-75 md:min-h-95 max-h-130 bg-[#302B27] shadow-xs">
                    <Image
                        src={urlFor(homeData.heroImage).width(1920).quality(90).auto("format").url()}
                        alt={homeData.heroImage.alt || "Reménység Foglyai"}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-center"
                    />

                    {/* Gradient Transition Layers */}
                    {/* 1. Top subtle transition from header */}
                    <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-linear-to-b from-cream-header/50 via-transparent to-transparent pointer-events-none" />

                    {/* 2. Ambient warm sunset tint (rich amber/warm terracotta enhancement) */}
                    <div className="absolute inset-0 bg-linear-to-tr from-amber-950/25 via-transparent to-transparent mix-blend-multiply pointer-events-none" />

                    {/* 3. Bottom seamless blend into the page's warm cream background (#F7F2E8) */}
                    <div className="absolute inset-x-0 bottom-0 h-28 sm:h-40 md:h-52 bg-linear-to-t from-[#F7F2E8] via-[#F7F2E8]/65 to-transparent pointer-events-none" />

                    {/* Optional Hero Title / Subtitle Overlay */}
                    {(homeData.heroTitle || homeData.heroSubtitle) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                            {homeData.heroTitle && (
                                <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-md tracking-wide">
                                    {homeData.heroTitle}
                                </h1>
                            )}
                            {homeData.heroSubtitle && (
                                <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-cream-header font-serif italic drop-shadow max-w-2xl">
                                    {homeData.heroSubtitle}
                                </p>
                            )}
                        </div>
                    )}
                </section>
            )}

            <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-12 sm:space-y-16 min-w-0">
                {/* 1. TOP SECTION: Full-width Magazine Component */}
                <section className="w-full flex flex-col space-y-6 min-w-0">
                    <h2 className="font-serif text-2xl font-bold text-warm-brown flex items-center gap-3 border-b border-[#E5DEC9] pb-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6 text-brick-red"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                            />
                        </svg>
                        {latestIssueSectionTitle}
                    </h2>

                    {newestIssueError ? (
                        <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                            Nem sikerült betölteni a legújabb lapszámot. Kérlek, próbáld újra később.
                        </div>
                    ) : newestIssue ? (
                        <MagazineCard
                            issue={newestIssue}
                            articlesTabLabel={magazineData?.articlesTabLabel || undefined}
                            audiobookTabLabel={magazineData?.audiobookTabLabel || undefined}
                            audiobookUnavailableLabel={magazineData?.audiobookUnavailableLabel || undefined}
                            downloadPdfLabel={magazineData?.downloadPdfButtonLabel || undefined}
                        />
                    ) : (
                        /* Clean state if no content uploaded yet */
                        <div className="p-8 border border-dashed border-[#E5DEC9] rounded-2xl bg-white text-center flex flex-col items-center justify-center space-y-4 py-16">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1}
                                stroke="currentColor"
                                className="w-16 h-16 text-brick-red"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                                />
                            </svg>
                            <h3 className="font-serif text-xl font-bold text-warm-brown">Még nem tölthettél fel lapszámot</h3>
                            <p className="text-sm text-[#302B27]/80 max-w-sm">
                                Lépj be a Sanity Studióba, és hozz létre egy új lapszámot a tartalmak megjelenítéséhez!
                            </p>
                        </div>
                    )}
                </section>

                {/* 2. BOTTOM SECTION: Welcome message (Left) & Popular topics (Right, below on mobile) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0 pt-6 border-t border-[#E5DEC9]">
                    {/* Welcome message module */}
                    <div className="lg:col-span-8 flex flex-col space-y-4 min-w-0">
                        <div className="bg-white border border-[#E5DEC9] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cream-header rounded-full -mr-8 -mt-8 opacity-40"></div>
                            <h2 className="font-serif text-xl sm:text-2xl font-bold text-warm-brown">{welcomeTitle}</h2>
                            <div className="w-8 h-0.5 bg-brick-red"></div>

                            {homeData?.welcomeContent && homeData.welcomeContent.length > 0 ? (
                                <div className="text-xs sm:text-sm text-[#302B27] leading-relaxed pt-2">
                                    <RichText value={homeData.welcomeContent} />
                                </div>
                            ) : (
                                <div className="text-xs sm:text-sm text-[#302B27] leading-relaxed space-y-4 font-sans text-justify pt-2">
                                    <p>
                                        Szeretettel köszöntünk a <strong>Reménység Foglyai</strong> folyóirat megújult digitális felületén!
                                        Lapunk küldetése, hogy bátorító, bibliai alapon nyugvó írásokkal táplálja hitedet a mindennapok
                                        kihívásai közepette.
                                    </p>
                                    <p>
                                        Isten igéje arra hív minket, hogy a fogság, a nehézségek vagy a próbatételek idején se veszítsük el
                                        a reményünket, hiszen Ő megígérte, hogy hűségesen megszabadít és kétszeresen kárpótollak titeket.
                                        Folyóiratunk hasábjain mély tanításokat, elgondolkodtató verseket és hitbeli vallomásokat találsz,
                                        melyek közelebb visznek az Evangélium tiszta forrásához.
                                    </p>
                                    <blockquote className="border-l-2 border-brick-red pl-3 py-1.5 my-3 italic text-warm-brown font-serif bg-cream-header rounded-r">
                                        &quot;Mert én tudom, hogy milyen gondolatokat gondolok felőletek — mondja az Úr: békességnek és nem háborúságnak gondolatát, hogy reményteljes jövőt adjak nektek.&quot;
                                        <span className="block text-[10px] sm:text-xs uppercase font-bold tracking-wider text-brick-red mt-1 text-right">— Jeremiás 29:11</span>
                                    </blockquote>
                                    <p>
                                        Kívánjuk, hogy az online cikkek olvasása, a letölthető lapszámok és az elhangzó hangoskönyvek
                                        Isten közelségébe vezessenek, és megújítsák szellemedet!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Popular Topics Cloud */}
                    {popularTags.length > 0 && (
                        <div className="lg:col-span-4 flex flex-col space-y-4 min-w-0">
                            <div className="bg-white border border-[#E5DEC9] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                                <h3 className="font-serif text-lg sm:text-xl font-bold text-warm-brown flex items-center justify-between">
                                    <span>{popularTagsTitle}</span>
                                    <span className="text-[11px] font-sans font-normal text-[#4E473F]/70">
                                        ({popularTags.length} téma)
                                    </span>
                                </h3>
                                <div className="w-8 h-0.5 bg-brick-red mb-2"></div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {popularTags.map((tag) => (
                                        <Link
                                            key={tag._id}
                                            href={`/kereses?cimkek=${tag.slug?.current || ""}`}
                                            className="text-xs px-3 py-1.5 bg-cream-header hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-[#302B27] rounded-full font-semibold transition-all duration-200 flex items-center gap-1 shadow-xs"
                                            title={`Keresés erre a témára: ${tag.title}`}
                                        >
                                            <span>#{tag.title}</span>
                                            {tag.articleCount ? (
                                                <span className="text-[10px] opacity-70 font-normal">
                                                    ({tag.articleCount})
                                                </span>
                                            ) : null}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
