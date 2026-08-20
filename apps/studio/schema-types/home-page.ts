import { defineField, defineType } from "sanity";
import { HomeIcon } from "@sanity/icons/Home";

export const homePage = defineType({
    name: "homePage",
    title: "Kezdőlap (Home)",
    type: "document",
    icon: HomeIcon,
    fields: [
        defineField({
            name: "heroImage",
            title: "Hero Kép (Főoldali Banner)",
            description: "Teljes szélességű kiemelt kép a kezdőlap tetején. A rendszer a 16:9-es képarány középső 2/3 részét jeleníti meg a kijelzőn.",
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
        }),
        defineField({
            name: "heroTitle",
            title: "Hero Kép Feletti Cím (Opcionális)",
            description: "Opcionális cím vagy mottó a hero képen (ha üres, csak a kép jelenik meg az átmenettel).",
            type: "string",
        }),
        defineField({
            name: "heroSubtitle",
            title: "Hero Kép Feletti Alcím / Igevers (Opcionális)",
            description: "Opcionális alcím vagy igei idézet a hero képen.",
            type: "string",
        }),
        defineField({
            name: "latestIssueTitle",
            title: "Aktuális Lapszám Szekció Cím",
            description: "A legfrissebb lapszám kártya feletti cím (alapértelmezett: 'Aktuális Lapszámunk').",
            type: "string",
            initialValue: "Aktuális Lapszámunk",
        }),
        defineField({
            name: "welcomeTitle",
            title: "Üdvözlő Levél Cím",
            description: "Az olvasóknak szóló köszöntő címe (alapértelmezett: 'Kedves Olvasó!').",
            type: "string",
            initialValue: "Kedves Olvasó!",
        }),
        defineField({
            name: "welcomeContent",
            title: "Üdvözlő Levél Tartalma",
            description: "A köszöntő részletes, formázható rich text tartalma. Ha üres, az alapértelmezett köszöntő jelenik meg.",
            type: "richText",
        }),
        defineField({
            name: "popularTagsTitle",
            title: "Népszerű Témakörök Cím",
            description: "A címkefelhő feletti cím (alapértelmezett: 'Népszerű témakörök').",
            type: "string",
            initialValue: "Népszerű témakörök",
        }),
    ],
    preview: {
        select: {
            media: "heroImage",
        },
        prepare({ media }) {
            return {
                title: "Kezdőlap Beállításai",
                subtitle: "Főoldali hero kép, szövegek és köszöntő",
                media: media || HomeIcon,
            };
        },
    },
});
