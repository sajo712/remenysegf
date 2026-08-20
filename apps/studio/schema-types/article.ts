import { defineField, defineType, defineArrayMember } from "sanity";
import { DocumentIcon } from "@sanity/icons/Document";
import { TagsAITagger } from "../components/tags-ai-tagger";

export const article = defineType({
    name: "article",
    title: "Cikk (Article)",
    type: "document",
    icon: DocumentIcon,
    fields: [
        defineField({
            name: "title",
            title: "Cím",
            description: "A cikk címe.",
            type: "string",
            validation: (Rule) => Rule.required().error("A cikk címének megadása kötelező!"),
        }),
        defineField({
            name: "subtitle",
            title: "Alcím",
            description: "A cikk alcíme (opcionális).",
            type: "string",
        }),
        defineField({
            name: "scripture",
            title: "Alapige",
            description: "A cikk alapigéje / bibliai hivatkozás (opcionális, pl. '(Jeremiás 24)').",
            type: "string",
        }),
        defineField({
            name: "slug",
            title: "Slug (URL útvonal)",
            description: "A cikk URL-barát azonosítója (automatikusan generálódik a címből).",
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
        defineField({
            name: "author",
            title: "Szerző",
            description: "A cikk szerzője (opcionális, pl. ha csak idézetek vannak).",
            type: "reference",
            to: [{ type: "author" }],
        }),
        defineField({
            name: "language",
            title: "Nyelv",
            description: "A cikk nyelve (routinghoz használatos).",
            type: "string",
            initialValue: "hu",
            options: {
                list: [
                    { title: "Magyar (HU)", value: "hu" },
                    { title: "Angol (EN)", value: "en" }
                ],
                layout: "radio"
            },
            validation: (Rule) => Rule.required().error("A nyelv kiválasztása kötelező!"),
        }),
        defineField({
            name: "translation",
            title: "Fordítás / Párhuzamos cikk",
            description: "A cikk más nyelvű megfelelője vagy eredetije (pl. angol cikk esetén a magyar eredeti, vagy fordítva). Opcionális.",
            type: "reference",
            to: [{ type: "article" }],
            options: {
                filter: ({ document }) => {
                    const currentLang = document.language;
                    const currentId = (document._id as string)?.replace(/^drafts\./, "");
                    if (currentLang === "en") {
                        return {
                            filter: '_type == "article" && coalesce(language, "hu") == "hu" && !(_id in [$currentId, "drafts." + $currentId])',
                            params: { currentId: currentId || "" }
                        };
                    } else if (currentLang === "hu") {
                        return {
                            filter: '_type == "article" && language == "en" && !(_id in [$currentId, "drafts." + $currentId])',
                            params: { currentId: currentId || "" }
                        };
                    }
                    return {
                        filter: '!(_id in [$currentId, "drafts." + $currentId])',
                        params: { currentId: currentId || "" }
                    };
                }
            }
        }),
        defineField({
            name: "issue",
            title: "Lapszám",
            description: "A lapszám, amelyhez a cikk tartozik (opcionális, pl. digitális vagy angol cikkek esetén).",
            type: "reference",
            to: [{ type: "issue" }],
        }),
        defineField({
            name: "order",
            title: "Sorrend",
            description: "A cikk megjelenési sorrendje a lapszámon belül (automatikusan generálódik az importáláskor).",
            type: "number",
        }),
        defineField({
            name: "tags",
            title: "Címkék",
            description: "A cikkhez kapcsolódó témakörök/címkék.",
            type: "array",
            components: {
                input: TagsAITagger
            },
            of: [
                defineArrayMember({
                    type: "reference",
                    to: { type: "tag" }
                })
            ]
        }),
        defineField({
            name: "content",
            title: "Tartalom",
            description: "A cikk fő szöveges tartalma.",
            type: "richText",
            validation: (Rule) => Rule.required().error("A cikk tartalmának megadása kötelező!"),
        }),
        defineField({
            name: "footnotes",
            title: "Lábjegyzetek listája",
            description: "A cikkhez tartozó lábjegyzetek strukturált listája (az importőr automatikusan kitölti).",
            type: "array",
            of: [
                defineArrayMember({
                    type: "object",
                    name: "footnoteItem",
                    title: "Lábjegyzet elem",
                    fields: [
                        defineField({
                            name: "number",
                            type: "string",
                            title: "Szám / Jel",
                        }),
                        defineField({
                            name: "text",
                            type: "text",
                            title: "Magyarázat szövege",
                            rows: 3,
                        }),
                        defineField({
                            name: "anchorId",
                            type: "string",
                            title: "Azonosító (Anchor ID)",
                            description: "A hivatkozás és a magyarázat összekapcsolásához használt belső azonosító.",
                        })
                    ],
                    preview: {
                        select: {
                            number: "number",
                            text: "text"
                        },
                        prepare({ number, text }) {
                            return {
                                title: `${number || "?"}. lábjegyzet`,
                                subtitle: text || "Nincs magyarázat megadva",
                            };
                        }
                    }
                })
            ]
        }),
    ],
    preview: {
        select: {
            title: "title",
            subtitle: "subtitle",
            scripture: "scripture",
            authorName: "author.name",
            language: "language",
            issueTitle: "issue.title",
            translationTitle: "translation.title",
        },
        prepare(selection) {
            const { title, subtitle, scripture, authorName, language, issueTitle, translationTitle } = selection;
            const langPrefix = language === "en" ? "[EN] " : "";
            const details = [];
            if (subtitle) details.push(subtitle);
            if (scripture) details.push(`Alapige: ${scripture}`);
            if (authorName) details.push(`Szerző: ${authorName}`);
            if (translationTitle) details.push(`Párhuzam: ${translationTitle}`);

            return {
                title: `${langPrefix}${title || "Névtelen cikk"}`,
                subtitle: issueTitle || undefined,
                description: details.join(" | ") || undefined,
                media: DocumentIcon,
            };
        },
    },
});
