import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { client } from "@/lib/sanity";
import { GET_SITE_SETTINGS_QUERY } from "@/lib/queries";
import { SiteSettings } from "@/lib/types";
import { Header } from "@/components/header";

const playfair = Playfair_Display({
    subsets: ["latin", "latin-ext"],
    variable: "--font-serif",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin", "latin-ext"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        template: "%s | Reménység Foglyai",
        default: "Reménység Foglyai - Keresztény Folyóirat",
    },
    description: "Keresztény folyóirat bátorító cikkekkel, igei tanításokkal és versekkel.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let settings: SiteSettings | null = null;
    try {
        settings = (await client.fetch(GET_SITE_SETTINGS_QUERY)) as unknown as SiteSettings;
    } catch (err) {
        console.error("Nem sikerült lekérni a weboldal beállításait:", err);
    }

    // Editorial Fallbacks
    const headerTitle = settings?.headerTitle || "Reménység Foglyai";
    const headerSubtitle = settings?.headerSubtitle || "Keresztény Folyóirat";
    const headerSearchLabel = settings?.headerSearchButtonLabel || "Keresés";

    const menuItems =
        settings?.headerMenu && settings.headerMenu.length > 0
            ? settings.headerMenu
            : [
                  { label: "Kezdőlap", url: "/" },
                  { label: "Folyóirat", url: "/folyoirat" },
                  { label: "Magunkról", url: "/magunkrol" },
                  { label: "Kapcsolat", url: "/kapcsolat" },
                  { label: "English Articles", url: "/english-articles" },
              ];

    // Footer settings
    const rawCopyright = settings?.footerCopyright?.trim() || "Reménység Foglyai. Minden jog fenntartva.";
    const cleanCopyright = rawCopyright.replace(/^(©|\(c\))\s*(\d{4})?\s*/i, "").trim();
    const footerCopyright = `© ${new Date().getFullYear()} ${cleanCopyright}`;

    const footerQuoteText =
        settings?.footerQuoteText ||
        `"Térjetek vissza a várhoz, reménységnek foglyai! Ma is hirdetem nektek, hogy kétszeresen kárpótollak titeket."`;
    const footerQuoteSource = settings?.footerQuoteSource || "Zakariás 9:12";

    // Footer Menu 1 (Left navigation column)
    const footerMenu1Title = settings?.footerMenu1Title;
    const footerMenu1Items =
        settings?.footerMenu1 && settings.footerMenu1.length > 0
            ? settings.footerMenu1
            : [
                  { label: "Kezdőlap", url: "/" },
                  { label: "Folyóirat Archívum", url: "/folyoirat" },
                  { label: "Magunkról", url: "/magunkrol" },
                  { label: "English Articles", url: "/english-articles" },
              ];

    // Footer Menu 2 (Right information column)
    const footerMenu2Title = settings?.footerMenu2Title;
    const footerMenu2Items =
        settings?.footerMenu2 && settings.footerMenu2.length > 0
            ? settings.footerMenu2
            : [
                  { label: "Keresés a cikkekben", url: "/kereses" },
                  { label: "Kapcsolat", url: "/kapcsolat" },
                  { label: "Adatkezelés", url: "/adatkezeles" },
              ];

    return (
        <html
            lang="hu"
            className={`${playfair.variable} ${inter.variable} h-full scroll-smooth`}
        >
            <body className="min-h-full flex flex-col bg-[#F7F2E8] text-[#302B27] font-sans antialiased">
                {/* Elegant Responsive Header (Desktop Nav & Mobile Dot Drawer) */}
                <Header
                    headerTitle={headerTitle}
                    headerSubtitle={headerSubtitle}
                    headerSearchLabel={headerSearchLabel}
                    menuItems={menuItems}
                />

                {/* Main Content Area */}
                <main id="main-content-root" className="flex-1 flex flex-col relative z-10">
                    {children}
                </main>

                {/* Rich Muted Light Footer */}
                <footer className="border-t border-[#E5DEC9] bg-cream-footer text-muted-text py-12 mt-auto shadow-inner relative z-10">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Logo, Quote & Copyright */}
                        <div className="md:col-span-6 flex flex-col space-y-4">
                            <span className="font-serif text-2xl font-bold tracking-wide text-warm-brown">
                                {headerTitle}
                            </span>
                            <p className="text-xs text-muted-text/90 leading-relaxed font-sans italic">
                                {footerQuoteText} <br />
                                <span className="font-semibold text-brick-red block mt-1 not-italic">
                                    — {footerQuoteSource}
                                </span>
                            </p>
                            <p className="pt-2 text-[11px] text-[#4E473F]/75 font-sans">
                                {footerCopyright}
                            </p>
                        </div>

                        {/* Footer Menu 1 */}
                        <div className="md:col-span-3 flex flex-col space-y-3">
                            {footerMenu1Title && (
                                <h3 className="text-brick-red text-xs font-bold uppercase tracking-wider">
                                    {footerMenu1Title}
                                </h3>
                            )}
                            <div className="flex flex-col space-y-2 text-xs text-muted-text">
                                {footerMenu1Items.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.url || "/"}
                                        className="hover:text-brick-red transition-colors duration-150"
                                    >
                                        {item.label || ""}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Footer Menu 2 */}
                        <div className="md:col-span-3 flex flex-col space-y-3">
                            {footerMenu2Title && (
                                <h3 className="text-brick-red text-xs font-bold uppercase tracking-wider">
                                    {footerMenu2Title}
                                </h3>
                            )}
                            <div className="flex flex-col space-y-2 text-xs text-muted-text">
                                {footerMenu2Items.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.url || "/"}
                                        className="hover:text-brick-red transition-colors duration-150"
                                    >
                                        {item.label || ""}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
