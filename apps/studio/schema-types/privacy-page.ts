import { defineField, defineType } from "sanity";
import { LockIcon } from "@sanity/icons/Lock";

export const privacyPage = defineType({
    name: "privacyPage",
    title: "Adatkezelés (Privacy)",
    type: "document",
    icon: LockIcon,
    fields: [
        defineField({
            name: "title",
            title: "Oldal Címe",
            description: "Az Adatkezelési tájékoztató főcíme (alapértelmezett: 'Adatkezelési Tájékoztató').",
            type: "string",
            initialValue: "Adatkezelési Tájékoztató",
            validation: (rule) => rule.required().error("A cím megadása kötelező"),
        }),
        defineField({
            name: "slug",
            title: "Slug (URL)",
            description: "Az oldal URL azonosítója (pl. 'adatkezeles').",
            type: "slug",
            options: {
                source: "title",
                maxLength: 96,
            },
            initialValue: { current: "adatkezeles" },
            validation: (rule) => rule.required().error("A slug megadása kötelező"),
        }),
        defineField({
            name: "content",
            title: "Tartalom",
            description: "Az adatkezelési tájékoztató részletes, formázható PortableText tartalma.",
            type: "richText",
        }),
    ],
    preview: {
        select: {
            title: "title",
        },
        prepare({ title }) {
            return {
                title: title || "Adatkezelés",
                subtitle: "Adatkezelési tájékoztató oldal",
                media: LockIcon,
            };
        },
    },
});
