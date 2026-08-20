import { defineField, defineType } from "sanity";
import { SearchIcon } from "@sanity/icons/Search";

export const searchPage = defineType({
    name: "searchPage",
    title: "Kereső Oldal (Search)",
    type: "document",
    icon: SearchIcon,
    fields: [
        defineField({
            name: "title",
            title: "Oldal Címe",
            description: "A kereső oldal főcíme (alapértelmezett: 'Tartalmi Kereső').",
            type: "string",
            initialValue: "Tartalmi Kereső",
        }),
        defineField({
            name: "description",
            title: "Oldal Alcíme / Bevezető",
            description: "A cím alatt megjelenő útmutató szöveg.",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "queryLabel",
            title: "Keresőmező Címke",
            description: "A szabadszavas keresőmező feletti felirat (alapértelmezett: 'Keresőszó').",
            type: "string",
            initialValue: "Keresőszó",
        }),
        defineField({
            name: "queryPlaceholder",
            title: "Keresőmező Helyettesítő Szöveg (Placeholder)",
            description: "A kereső beviteli mezőben halványan látható szöveg.",
            type: "string",
            initialValue: "Keresés a cikkek címeiben vagy tartalmában...",
        }),
        defineField({
            name: "authorLabel",
            title: "Szerző Szűrő Címke",
            description: "A szerzőválasztó legördülő feletti felirat (alapértelmezett: 'Szerző').",
            type: "string",
            initialValue: "Szerző",
        }),
        defineField({
            name: "authorAllOption",
            title: "Szerző: 'Összes' Opció Szövege",
            description: "Alapértelmezett: 'Összes szerző'.",
            type: "string",
            initialValue: "Összes szerző",
        }),
        defineField({
            name: "issueLabel",
            title: "Lapszám Szűrő Címke",
            description: "A lapszámválasztó legördülő feletti felirat (alapértelmezett: 'Lapszám').",
            type: "string",
            initialValue: "Lapszám",
        }),
        defineField({
            name: "issueAllOption",
            title: "Lapszám: 'Összes' Opció Szövege",
            description: "Alapértelmezett: 'Összes lapszám'.",
            type: "string",
            initialValue: "Összes lapszám",
        }),
        defineField({
            name: "tagLabel",
            title: "Címke Szűrő Címke",
            description: "A témakör szűrő feletti felirat (alapértelmezett: 'Címke szűrő:').",
            type: "string",
            initialValue: "Címke szűrő:",
        }),
        defineField({
            name: "tagSearchPlaceholder",
            title: "Címkekereső Helyettesítő Szöveg (Placeholder)",
            description: "A címkekereső beviteli mezőben halványan látható szöveg (alapértelmezett: 'Címke keresése a teljes listából...').",
            type: "string",
            initialValue: "Címke keresése a teljes listából...",
        }),
        defineField({
            name: "resetButtonLabel",
            title: "Szűrők Törlése Gomb",
            description: "Alapértelmezett: 'Szűrők törlése'.",
            type: "string",
            initialValue: "Szűrők törlése",
        }),
        defineField({
            name: "resultsHeading",
            title: "Találatok Fejléc Szövege",
            description: "A találati lista feletti sáv szövege (alapértelmezett: 'Találatok').",
            type: "string",
            initialValue: "Találatok",
        }),
        defineField({
            name: "readButtonLabel",
            title: "Cikk Olvasása Gomb",
            description: "A találati kártyákon lévő gomb (alapértelmezett: 'Elolvasom').",
            type: "string",
            initialValue: "Elolvasom",
        }),
        defineField({
            name: "noResultsTitle",
            title: "Nincs Találat Cím",
            description: "Alapértelmezett: 'Nincs találat a megadott szűrésre'.",
            type: "string",
            initialValue: "Nincs találat a megadott szűrésre",
        }),
        defineField({
            name: "noResultsDescription",
            title: "Nincs Találat Leírás",
            description: "Alapértelmezett: 'Próbálkozz más keresőszóval, vagy töltsd be a szűrők törlésével az összes elérhető cikket.'",
            type: "text",
            rows: 2,
        }),
    ],
    preview: {
        prepare() {
            return {
                title: "Kereső Oldal Beállításai",
                subtitle: "Keresőmezők, szűrők és üres állapot szövegei",
                media: SearchIcon,
            };
        },
    },
});
