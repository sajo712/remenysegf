import { defineField, defineType } from "sanity";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";

export const aboutPage = defineType({
    name: "aboutPage",
    title: "Magunkról Oldal (About)",
    type: "document",
    icon: InfoOutlineIcon,
    fields: [
        defineField({
            name: "title",
            title: "Oldal Címe",
            description: "A Magunkról oldal főcíme (alapértelmezett: 'Magunkról').",
            type: "string",
            initialValue: "Magunkról",
        }),
        defineField({
            name: "content",
            title: "Tartalom",
            description: "A bemutatkozás részletes, formázható PortableText tartalma. Ha üres, az alapértelmezett bemutatkozás jelenik meg.",
            type: "richText",
        }),
    ],
    preview: {
        prepare() {
            return {
                title: "Magunkról Oldal Beállításai",
                subtitle: "Bemutatkozás és hitvallás szövege",
                media: InfoOutlineIcon,
            };
        },
    },
});
