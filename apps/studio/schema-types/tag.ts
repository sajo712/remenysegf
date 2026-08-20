import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons/Tag";

export const tag = defineType({
    name: "tag",
    title: "Címke (Tag)",
    type: "document",
    icon: TagIcon,
    fields: [
        defineField({
            name: "title",
            title: "Cím",
            description: "A címke megnevezése (pl. Hit, Remény, Tanulmány).",
            type: "string",
            validation: (Rule) => Rule.required().error("A címke nevének megadása kötelező!"),
        }),
        defineField({
            name: "slug",
            title: "Slug (URL útvonal)",
            description: "A címke URL-barát azonosítója (automatikusan generálódik a címből).",
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
            validation: (Rule) => Rule.required().error("A slug generálása vagy kézi megadása kötelező!"),
        }),
    ],
    preview: {
        select: {
            title: "title",
            subtitle: "slug.current",
        },
        prepare(selection) {
            const { title, subtitle } = selection;
            return {
                title: title || "Névtelen címke",
                subtitle: subtitle ? `#${subtitle}` : "",
                media: TagIcon,
            };
        },
    },
});
