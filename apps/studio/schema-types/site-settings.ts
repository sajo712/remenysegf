import { defineField, defineType, defineArrayMember } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";

export const siteSettings = defineType({
    name: "siteSettings",
    title: "Oldal Beállítások (Settings)",
    type: "document",
    icon: CogIcon,
    fields: [
        // --- Header Settings ---
        defineField({
            name: "headerTitle",
            title: "Fejléc Főcím",
            description: "A fejlécben és a logóban megjelenő főnév (pl. 'Reménység Foglyai').",
            type: "string",
            initialValue: "Reménység Foglyai",
        }),
        defineField({
            name: "headerSubtitle",
            title: "Fejléc Alcím",
            description: "A fejléc logó alatt megjelenő kísérőszöveg (pl. 'Keresztény Folyóirat').",
            type: "string",
            initialValue: "Keresztény Folyóirat",
        }),
        defineField({
            name: "headerSearchButtonLabel",
            title: "Fejléc Kereső Gomb Felirat",
            description: "A fejléc jobb oldalán lévő kereső gomb szövege (alapértelmezett: 'Keresés').",
            type: "string",
            initialValue: "Keresés",
        }),
        defineField({
            name: "headerMenu",
            title: "Fejléc Menüpontok",
            description: "A fejléc navigációs menüjében szereplő belső linkek listája. Ha üres, az alapértelmezett menüpontok jelennek meg.",
            type: "array",
            of: [
                defineArrayMember({
                    name: "menuItem",
                    title: "Menüpont",
                    type: "object",
                    fields: [
                        defineField({
                            name: "label",
                            title: "Megjelenő név",
                            description: "A menüpont felirata (pl. 'Folyóirat', 'Magunkról', 'Kapcsolat', 'English Articles').",
                            type: "string",
                        }),
                        defineField({
                            name: "url",
                            title: "Belső útvonal (URL)",
                            description: "A belső útvonal (pl. '/' kezdőlap, '/folyoirat' folyóirat archívum, '/magunkrol' rólunk, '/kapcsolat' kapcsolat, '/english-articles' angol cikkek, '/kereses' kereső, vagy '/[slug]' cikk/kiadvány).",
                            type: "string",
                        }),
                    ],
                }),
            ],
        }),

        // --- Footer Settings ---
        defineField({
            name: "footerCopyright",
            title: "Lábléc Copyright Szöveg",
            description: "A bal oldali oszlopban az idézet alatt megjelenő jogi felirat a '© [évszám]' után (alapértelmezett: 'Reménység Foglyai. Minden jog fenntartva.').",
            type: "string",
            initialValue: "Reménység Foglyai. Minden jog fenntartva.",
        }),
        defineField({
            name: "footerQuoteText",
            title: "Lábléc Idézet Szövege",
            description: "A lábléc bal oldalán megjelenő bibliai vagy bátorító idézet.",
            type: "text",
            initialValue: `"Térjetek vissza a várhoz, reménységnek foglyai! Ma is hirdetem nektek, hogy kétszeresen kárpótollak titeket."`,
        }),
        defineField({
            name: "footerQuoteSource",
            title: "Lábléc Idézet Forrása",
            description: "Az idézet forrása (pl. 'Zakariás 9:12').",
            type: "string",
            initialValue: "Zakariás 9:12",
        }),

        // --- Footer Menu 1 ---
        defineField({
            name: "footerMenu1Title",
            title: "1. Lábléc Menü Címe",
            description: "Az 1. lábléc linkoszlop címe (opcionális, pl. 'Folyóirat').",
            type: "string",
            initialValue: "Folyóirat",
        }),
        defineField({
            name: "footerMenu1",
            title: "1. Lábléc Menüpontok",
            description: "Az 1. oszlopban megjelenő linkek listája.",
            type: "array",
            of: [
                defineArrayMember({
                    name: "footerMenuItem",
                    title: "Lábléc link",
                    type: "object",
                    fields: [
                        defineField({
                            name: "label",
                            title: "Megjelenő név",
                            type: "string",
                        }),
                        defineField({
                            name: "url",
                            title: "Belső útvonal (URL)",
                            type: "string",
                        }),
                    ],
                }),
            ],
        }),

        // --- Footer Menu 2 ---
        defineField({
            name: "footerMenu2Title",
            title: "2. Lábléc Menü Címe",
            description: "A 2. lábléc linkoszlop címe (opcionális, pl. 'Információk').",
            type: "string",
            initialValue: "Információk",
        }),
        defineField({
            name: "footerMenu2",
            title: "2. Lábléc Menüpontok",
            description: "A 2. oszlopban megjelenő linkek listája.",
            type: "array",
            of: [
                defineArrayMember({
                    name: "footerMenuItem",
                    title: "Lábléc link",
                    type: "object",
                    fields: [
                        defineField({
                            name: "label",
                            title: "Megjelenő név",
                            type: "string",
                        }),
                        defineField({
                            name: "url",
                            title: "Belső útvonal (URL)",
                            type: "string",
                        }),
                    ],
                }),
            ],
        }),
    ],
    preview: {
        prepare() {
            return {
                title: "Oldal Beállítások (Settings)",
                subtitle: "Fejléc, lábléc menük és globális szövegek",
                media: CogIcon,
            };
        },
    },
});
