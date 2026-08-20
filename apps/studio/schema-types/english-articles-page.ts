import { defineField, defineType } from "sanity";
import { TranslateIcon } from "@sanity/icons/Translate";

export const englishArticlesPage = defineType({
    name: "englishArticlesPage",
    title: "Angol Cikkek (English Articles)",
    type: "document",
    icon: TranslateIcon,
    fields: [
        defineField({
            name: "title",
            title: "Oldal Címe",
            description: "Az angol cikkek oldal főcíme (alapértelmezett: 'English Articles').",
            type: "string",
            initialValue: "English Articles",
        }),
        defineField({
            name: "description",
            title: "Oldal Alcíme / Bevezető",
            description: "A cím alatt megjelenő kísérőszöveg.",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "readButtonLabel",
            title: "Cikk Olvasása Gomb Felirat",
            description: "A cikk kártyáján lévő gomb szövege (alapértelmezett: 'Read Article').",
            type: "string",
            initialValue: "Read Article",
        }),
        defineField({
            name: "emptyTitle",
            title: "Üres Állapot Cím",
            description: "Ha még nincsenek feltöltve angol cikkek (alapértelmezett: 'No English articles available yet').",
            type: "string",
            initialValue: "No English articles available yet",
        }),
        defineField({
            name: "emptyDescription",
            title: "Üres Állapot Leírás",
            description: "Ha még nincsenek feltöltve angol cikkek.",
            type: "text",
            rows: 3,
        }),
    ],
    preview: {
        prepare() {
            return {
                title: "Angol Cikkek Oldal Beállításai",
                subtitle: "Angol gyűjtőoldal szövegei",
                media: TranslateIcon,
            };
        },
    },
});
