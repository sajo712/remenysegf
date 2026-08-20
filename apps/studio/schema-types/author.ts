import { defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons/User";

export const author = defineType({
    name: "author",
    title: "Szerző (Author)",
    type: "document",
    icon: UserIcon,
    fields: [
        defineField({
            name: "name",
            title: "Név",
            description: "A szerző teljes neve.",
            type: "string",
            validation: (Rule) => [
                Rule.required().error("A szerző nevének megadása kötelező!"),
                Rule.min(2).warning("A szerző neve általában legalább 2 karakter hosszú."),
            ],
        }),
    ],
    preview: {
        select: {
            title: "name",
        },
        prepare(selection) {
            const { title } = selection;
            return {
                title: title || "Névtelen szerző",
                media: UserIcon,
            };
        },
    },
});
