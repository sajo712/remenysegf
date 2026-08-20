import { client } from "@/lib/sanity";
import { GET_CONTACT_PAGE_QUERY } from "@/lib/queries";
import { ContactPageData } from "@/lib/types";
import { RichText } from "@/components/rich-text";
import ContactForm from "./contact-form";

export const metadata = {
    title: "Kapcsolat",
    description: "Vedd fel velünk a kapcsolatot! Küldj üzenetet a szerkesztőség részére.",
};

export default async function ContactPage() {
    let pageData: ContactPageData | null = null;
    try {
        pageData = (await client.fetch(GET_CONTACT_PAGE_QUERY)) as unknown as ContactPageData;
    } catch (err) {
        console.error("Nem sikerült lekérni a Kapcsolat oldal adatait:", err);
    }

    const title = pageData?.title || "Kapcsolat";
    const content = pageData?.content;

    // Form labels with editorial fallbacks
    const formNameLabel = pageData?.formNameLabel || "Név";
    const formNamePlaceholder = pageData?.formNamePlaceholder || "Írja be nevét";
    const formEmailLabel = pageData?.formEmailLabel || "E-mail";
    const formEmailPlaceholder = pageData?.formEmailPlaceholder || "pelda@remenysegf.hu";
    const formMessageLabel = pageData?.formMessageLabel || "Üzenet";
    const formMessagePlaceholder = pageData?.formMessagePlaceholder || "Írja le üzenetét, kérdését...";
    const formSubmitButtonLabel = pageData?.formSubmitButtonLabel || "Üzenet küldése";
    const formSuccessTitle = pageData?.formSuccessTitle || "Köszönjük üzenetét!";
    const formSuccessMessage =
        pageData?.formSuccessMessage ||
        "Az üzenetet sikeresen elküldtük. Munkatársunk hamarosan felveszi Önnel a kapcsolatot a megadott e-mail címen.";
    const formSuccessButtonLabel = pageData?.formSuccessButtonLabel || "Új üzenet küldése";
    const formErrorMessage =
        pageData?.formErrorMessage ||
        "Hiba történt az üzenet küldése során. Kérjük, próbálja meg később!";

    return (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col space-y-8 animate-fade-in min-w-0">
            <header className="border-b border-[#E5DEC9] pb-6 flex flex-col space-y-2">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-warm-brown">
                    {title}
                </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Description column */}
                <div className="lg:col-span-5 space-y-6">
                    {content && content.length > 0 ? (
                        <RichText value={content} />
                    ) : (
                        <div className="space-y-4 text-sm text-[#302B27]/80 leading-relaxed font-sans text-justify">
                            <p>
                                Kérdése van a folyóirattal kapcsolatban? Szeretné megosztani velünk hitbeli bizonyságtételét, vagy bátorító visszajelzést küldene a szerkesztőségnek?
                            </p>
                            <p>
                                Töltse ki a jobb oldali űrlapot, és munkatársaink a lehető leghamarabb megválaszolják üzenetét.
                            </p>
                        </div>
                    )}
                </div>

                {/* Form column */}
                <div className="lg:col-span-7">
                    <ContactForm
                        nameLabel={formNameLabel}
                        namePlaceholder={formNamePlaceholder}
                        emailLabel={formEmailLabel}
                        emailPlaceholder={formEmailPlaceholder}
                        messageLabel={formMessageLabel}
                        messagePlaceholder={formMessagePlaceholder}
                        submitLabel={formSubmitButtonLabel}
                        successTitle={formSuccessTitle}
                        successMessage={formSuccessMessage}
                        successButtonLabel={formSuccessButtonLabel}
                        errorMessage={formErrorMessage}
                        recipientEmail={pageData?.recipientEmail}
                    />
                </div>
            </div>
        </div>
    );
}
