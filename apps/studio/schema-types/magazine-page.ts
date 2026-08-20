import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons/Book";

export const magazinePage = defineType({
    name: "magazinePage",
    title: "Folyóirat Archívum (Magazine)",
    type: "document",
    icon: BookIcon,
    fields: [
        defineField({
            name: "title",
            title: "Oldal Címe",
            description: "A folyóirat archívum főcíme (alapértelmezett: 'Lapszám Archívum').",
            type: "string",
            initialValue: "Lapszám Archívum",
        }),
        defineField({
            name: "description",
            title: "Oldal Alcíme / Bevezető",
            description: "A cím alatt megjelenő magyarázó szöveg.",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "carouselSelectLabel",
            title: "Lapszámválasztó Címke",
            description: "A vízszintes lapszámválasztó sáv feletti címke (alapértelmezett: 'Folyóiratunk megjelent számai').",
            type: "string",
            initialValue: "Folyóiratunk megjelent számai",
        }),
        defineField({
            name: "articlesTabLabel",
            title: "Cikkek Fül Felirata",
            description: "A lapszám kártya cikkeket tartalmazó fülének szövege (alapértelmezett: 'Cikkek Tartalma').",
            type: "string",
            initialValue: "Cikkek Tartalma",
        }),
        defineField({
            name: "audiobookTabLabel",
            title: "Hangoskönyv Fül Felirata",
            description: "A lapszám kártya hangoskönyv fülének szövege (alapértelmezett: 'Hangoskönyv').",
            type: "string",
            initialValue: "Hangoskönyv",
        }),
        defineField({
            name: "audiobookUnavailableLabel",
            title: "Hangoskönyv Nem Elérhető Felirat",
            description: "A hangoskönyv fülön megjelenő jelzés ha nincs hangoskönyv (alapértelmezett: '(nem elérhető)').",
            type: "string",
            initialValue: "(nem elérhető)",
        }),
        defineField({
            name: "downloadPdfButtonLabel",
            title: "PDF Letöltés Gomb Felirat",
            description: "A PDF letöltő gomb felirata (alapértelmezett: 'PDF Lapszám Letöltése').",
            type: "string",
            initialValue: "PDF Lapszám Letöltése",
        }),
        defineField({
            name: "emptyTitle",
            title: "Üres Állapot Cím",
            description: "Ha még nincsenek lapszámok (alapértelmezett: 'Nincsenek még lapszámok az archívumban').",
            type: "string",
            initialValue: "Nincsenek még lapszámok az archívumban",
        }),
        defineField({
            name: "emptyDescription",
            title: "Üres Állapot Leírás",
            description: "Ha még nincsenek lapszámok az archívumban.",
            type: "text",
            rows: 3,
        }),
    ],
    preview: {
        prepare() {
            return {
                title: "Folyóirat Archívum Oldal Beállításai",
                subtitle: "Lapszám archívum szövegei és fülei",
                media: BookIcon,
            };
        },
    },
});
