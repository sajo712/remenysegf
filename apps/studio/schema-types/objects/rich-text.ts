import React from "react";
import { defineArrayMember, defineField, defineType } from "sanity";
import { LinkIcon } from "@sanity/icons/Link";

export const richText = defineType({
    name: "richText",
    title: "Rich Text",
    description: "Formázott szöveg külső és belső hivatkozásokkal, felsorolásokkal és beágyazott képekkel.",
    type: "array",
    of: [
        defineArrayMember({
            type: "block",
            styles: [
                { title: "Normál", value: "normal" },
                { 
                    title: "Normál (Középre igazított)", 
                    value: "normal-center",
                    component: (props: any) => React.createElement("div", { style: { textAlign: "center" } }, props.children)
                },
                { 
                    title: "Normál (Jobbra igazított)", 
                    value: "normal-right",
                    component: (props: any) => React.createElement("div", { style: { textAlign: "right" } }, props.children)
                },
                { title: "H2", value: "h2" },
                { title: "H3", value: "h3" },
                { title: "H4", value: "h4" },
                { title: "Quote", value: "blockquote" }
            ],
            marks: {
                decorators: [
                    { title: "Félkövér", value: "strong" },
                    { title: "Dőlt", value: "em" },
                    { title: "Aláhúzott", value: "underline" },
                    {
                        title: "Felső index",
                        value: "superscript",
                        icon: () => "x²",
                        component: (props: any) => React.createElement("sup", null, props.children)
                    }
                ],
                annotations: [
                    defineField({
                        name: "link",
                        type: "object",
                        title: "Külső link",
                        fields: [
                            defineField({
                                name: "href",
                                type: "url",
                                title: "Weboldal címe (URL)",
                                validation: (Rule) => Rule.required().uri({
                                    scheme: ["http", "https", "mailto", "tel"],
                                    allowRelative: true
                                }).error("Érvényes URL címet adj meg!")
                            }),
                        ],
                    }),
                    defineField({
                        name: "internalLink",
                        type: "object",
                        title: "Belső link",
                        icon: LinkIcon,
                        fields: [
                            defineField({
                                name: "reference",
                                type: "reference",
                                title: "Hivatkozott tartalom",
                                to: [
                                    { type: "article" },
                                    { type: "issue" },
                                    { type: "standaloneBook" },
                                ],
                                validation: (Rule) => Rule.required().error("A belső hivatkozás célját kötelező kiválasztani!")
                            }),
                        ],
                    }),
                ],
            },
        }),
        defineArrayMember({
            type: "image",
            title: "Kép",
            options: { hotspot: true },
            fields: [
                defineField({
                    name: "caption",
                    type: "string",
                    title: "Képfelirat (Caption)",
                    description: "A kép alatt megjelenő szöveges felirat.",
                }),
                defineField({
                    name: "alt",
                    type: "string",
                    title: "Alternatív szöveg (Alt)",
                    description: "Segíti a keresőoptimalizálást (SEO) és a vakok/gyengénlátók felolvasó szoftvereit.",
                })
            ]
        }),
        defineArrayMember({
            type: "object",
            name: "customTable",
            title: "Táblázat (Table)",
            components: {
                preview: (props: any) => {
                    const title = props.title || props.value?.title || "";
                    const hasHeader = props.hasHeader !== false && props.value?.hasHeader !== false;
                    const tableData = props.table || props.value?.table || {};
                    const rows = tableData.rows || [];
                    
                    if (rows.length === 0) {
                        return React.createElement(
                            "div",
                            {
                                style: {
                                    padding: "12px",
                                    color: "#888",
                                    fontStyle: "italic",
                                    textAlign: "center",
                                    border: "1px dashed #444",
                                    borderRadius: "4px",
                                    backgroundColor: "#161616"
                                }
                            },
                            "Üres táblázat"
                        );
                    }
                    
                    return React.createElement(
                        "div",
                        {
                            style: {
                                padding: "8px 0",
                                width: "100%",
                                overflowX: "auto"
                            }
                        },
                        title && React.createElement(
                            "div",
                            {
                                style: {
                                    fontWeight: "bold",
                                    fontSize: "13px",
                                    marginBottom: "8px",
                                    color: "#e1e1e1",
                                    fontFamily: "inherit"
                                }
                            },
                            `Táblázat: ${title}`
                        ),
                        React.createElement(
                            "table",
                            {
                                style: {
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "12px",
                                    fontFamily: "inherit",
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #333",
                                    borderRadius: "4px",
                                    overflow: "hidden"
                                }
                            },
                            React.createElement(
                                "tbody",
                                null,
                                rows.map((row: any, rIdx: number) => {
                                    const cells = row.cells || [];
                                    const isHeaderRow = hasHeader && rIdx === 0;
                                    
                                    return React.createElement(
                                        "tr",
                                        {
                                            key: row._key || rIdx,
                                            style: {
                                                backgroundColor: isHeaderRow 
                                                    ? "#2d2d2d" 
                                                    : rIdx % 2 === 0 ? "#1a1a1a" : "#222",
                                                borderBottom: "1px solid #333"
                                            }
                                        },
                                        cells.map((cell: string, cIdx: number) => {
                                            return React.createElement(
                                                isHeaderRow ? "th" : "td",
                                                {
                                                    key: cIdx,
                                                    style: {
                                                        padding: "8px 12px",
                                                        textAlign: "left",
                                                        fontWeight: isHeaderRow ? "bold" : "normal",
                                                        color: isHeaderRow ? "#fff" : "#ccc",
                                                        borderRight: "1px solid #333"
                                                    }
                                                },
                                                cell
                                            );
                                        })
                                    );
                                })
                            )
                        )
                    );
                }
            },
            fields: [
                defineField({
                    name: "hasHeader",
                    type: "boolean",
                    title: "Első sor fejléc?",
                    description: "Jelöld be, ha a táblázat első sora fejléc (pl. vastag betűs, színes háttérrel).",
                    initialValue: true
                }),
                defineField({
                    name: "title",
                    type: "string",
                    title: "Táblázat címe / Felirata (opcionális)",
                    description: "Megjelenik a táblázat felett feliratként/címsorként."
                }),
                defineField({
                    name: "table",
                    type: "table",
                    title: "Táblázat adatai (Szerkeszthető rács)"
                })
            ],
            preview: {
                select: {
                    title: "title",
                    hasHeader: "hasHeader",
                    table: "table"
                },
                prepare({ title, hasHeader, table }) {
                    return {
                        title: title || "Táblázat",
                        subtitle: hasHeader ? "Első sor fejléc | Interaktív rács" : "Sima táblázat | Interaktív rács",
                        hasHeader: hasHeader !== false,
                        table
                    };
                }
            }
        }),
        defineArrayMember({
            type: "object",
            name: "divider",
            title: "Vonal elválasztó",
            preview: {
                select: {
                    style: "style"
                },
                prepare({ style }) {
                    return {
                        title: style === "dashed" ? "Szaggatott vonal" : "Vékony vonal",
                    };
                }
            },
            components: {
                preview: (props: any) => {
                    const { style } = props.value || {};
                    const borderStyle = style === "dashed" ? "dashed" : "solid";
                    return React.createElement(
                        "div",
                        {
                            style: {
                                padding: "16px 0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                cursor: "default"
                            }
                        },
                        React.createElement("hr", {
                            style: {
                                border: "none",
                                borderTop: `1px ${borderStyle} #555`,
                                width: "100%",
                                margin: 0
                            }
                        })
                    );
                }
            },
            fields: [
                defineField({
                    name: "style",
                    type: "string",
                    title: "Stílus",
                    initialValue: "default",
                    options: {
                        list: [
                            { title: "Vékony vonal", value: "default" },
                            { title: "Szaggatott vonal", value: "dashed" }
                        ],
                        layout: "radio"
                    }
                })
            ]
        }),
    ],
});
