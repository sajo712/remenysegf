import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons/Book";

export const issue = defineType({
    name: "issue",
    title: "Lapszám (Issue)",
    type: "document",
    icon: BookIcon,
    fields: [
        defineField({
            name: "title",
            title: "Cím",
            description: "A lapszám megnevezése/címe (pl. 2026/1. lapszám).",
            type: "string",
            validation: (Rule) => Rule.required().error("A lapszám címének megadása kötelező!"),
        }),
        defineField({
            name: "issueNumber",
            title: "Lapszám sorszáma",
            description: "A lapszám sorszáma (pl. 54).",
            type: "number",
            validation: (Rule) => Rule.required().error("A lapszám sorszámának megadása kötelező!"),
        }),
        defineField({
            name: "issueType",
            title: "Lapszám típusa",
            description: "Határozd meg, hogy rendes lapszámról vagy különszámról van szó.",
            type: "string",
            options: {
                list: [
                    { title: "Rendes lapszám", value: "regular" },
                    { title: "Különszám", value: "special" },
                ],
                layout: "radio"
            },
            initialValue: "regular",
            validation: (Rule) => Rule.required().error("A lapszám típusának kiválasztása kötelező!"),
        }),
        defineField({
            name: "coverImage",
            title: "Borítókép",
            description: "A lapszám borítóképe.",
            type: "image",
            options: { hotspot: true },
            fields: [
                defineField({
                    name: "alt",
                    type: "string",
                    title: "Alternatív szöveg (Alt Text)",
                    description: "Az akadálymentesség és a SEO érdekében írd le röviden, mi látható a képen.",
                }),
            ],
            validation: (Rule) => Rule.required().error("A borítókép feltöltése kötelező!"),
        }),
        defineField({
            name: "youtubeUrl",
            title: "YouTube Hangoskönyv URL",
            description: "A lapszámhoz tartozó beágyazható hangoskönyv YouTube videó linkje.",
            type: "url",
            validation: (Rule) => Rule.uri({
                scheme: ["http", "https"]
            }).warning("Érvényes YouTube URL megadása ajánlott.")
        }),
        defineField({
            name: "pdfFile",
            title: "Letölthető PDF",
            description: "A lapszám teljes letölthető PDF verziója.",
            type: "file",
            validation: (Rule) => Rule.required().error("A letölthető PDF fájl feltöltése kötelező!"),
        }),
        defineField({
            name: "publishedAt",
            title: "Megjelenés Dátuma",
            description: "A lapszám megjelenésének hivatalos dátuma.",
            type: "date",
            initialValue: () => new Date().toISOString().split("T")[0],
            validation: (Rule) => Rule.required().error("A megjelenési dátum megadása kötelező!"),
        }),

    ],
    preview: {
        select: {
            title: "title",
            issueNumber: "issueNumber",
            issueType: "issueType",
            media: "coverImage",
            publishedAt: "publishedAt"
        },
        prepare(selection) {
            const { title, issueNumber, issueType, media, publishedAt } = selection;
            const typeLabel = issueType === "special" ? "különszám" : "szám";
            return {
                title: title || `Lapszám #${issueNumber || "?"}`,
                subtitle: `Sorszám: ${issueNumber || "?"}. ${typeLabel} | Megjelenés: ${publishedAt || "Ismeretlen"}`,
                media: media || BookIcon,
            };
        },
    },
});
