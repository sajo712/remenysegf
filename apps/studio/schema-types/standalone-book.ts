import { defineField, defineType } from "sanity";
import { DocumentsIcon } from "@sanity/icons/Documents";

export const standaloneBook = defineType({
    name: "standaloneBook",
    title: "Önálló füzet (Book)",
    type: "document",
    icon: DocumentsIcon,
    fields: [
        defineField({
            name: "title",
            title: "Cím",
            description: "A könyv/füzet címe.",
            type: "string",
            validation: (Rule) => Rule.required().error("A könyv/füzet címének megadása kötelező!"),
        }),
        defineField({
            name: "subtitle",
            title: "Alcím",
            description: "A könyv/füzet alcíme (pl. rövid bevezető vagy magyarázat).",
            type: "string",
        }),
        defineField({
            name: "youtubeUrl",
            title: "YouTube Videó / Hangoskönyv URL",
            description: "Az önálló kiadványhoz tartozó felvétel lejátszási linkje (pl. hangoskönyv lejátszóhoz).",
            type: "url",
        }),
        defineField({
            name: "slug",
            title: "Slug (URL útvonal)",
            description: "URL-barát azonosító (automatikusan generálódik a címből).",
            type: "slug",
            options: {
                source: "title",
                maxLength: 96,
                slugify: (input: string) =>
                    input
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/[^\w-]+/g, '')
                        .slice(0, 96),
            },
            validation: (Rule) => Rule.required().error("A slug generálása vagy megadása kötelező!"),
        }),
        defineField({
            name: "coverImage",
            title: "Borítókép",
            description: "A könyv/füzet borítóképe.",
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
            name: "pdfFile",
            title: "Letölthető PDF",
            description: "A könyv/füzet letölthető PDF verziója.",
            type: "file",
            validation: (Rule) => Rule.required().error("A letölthető PDF fájl feltöltése kötelező!"),
        }),
        defineField({
            name: "content",
            title: "Leírás / Tartalom",
            description: "A könyv/füzet részletes leírása vagy tartalma.",
            type: "richText",
            validation: (Rule) => Rule.required().error("A tartalom vagy leírás megadása kötelező!"),
        }),
    ],
    preview: {
        select: {
            title: "title",
            media: "coverImage",
        },
        prepare(selection) {
            const { title, media } = selection;
            return {
                title: title || "Névtelen könyv/füzet",
                subtitle: "Önálló füzet kiadvány",
                media: media || DocumentsIcon,
            };
        },
    },
});
