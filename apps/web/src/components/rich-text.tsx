import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PortableText, PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/lib/sanity";
import { PortableTextBlock, InternalLinkReference } from "@/lib/types";

interface ImageValue {
    asset?: {
        _ref?: string;
        _id?: string;
        url?: string;
    };
    alt?: string;
    caption?: string;
}

interface CustomTableValue {
    title?: string;
    hasHeader?: boolean;
    table?: {
        rows?: Array<{
            _key?: string;
            cells?: string[];
        }>;
    };
}

interface DividerValue {
    style?: "solid" | "dashed" | "default";
}

interface InternalLinkValue {
    reference?: InternalLinkReference | null;
}

export const richTextComponents: PortableTextComponents = {
    types: {
        image: ({ value }: { value?: ImageValue }) => {
            if (!value?.asset?._ref && !value?.asset?._id && !value?.asset?.url) return null;
            return (
                <figure className="my-10 flex flex-col items-center">
                    <div className="relative w-full h-80 sm:h-120 rounded-2xl overflow-hidden shadow-lg border border-[#E5DEC9]/40">
                        <Image
                            src={urlFor(value).width(1200).height(800).auto("format").url()}
                            alt={value.alt || value.caption || "Cikk kép"}
                            fill
                            className="object-cover"
                        />
                    </div>
                    {value.caption && (
                        <figcaption className="mt-3 text-center text-sm text-[#4E473F]/80 italic font-sans max-w-xl">
                            {value.caption}
                        </figcaption>
                    )}
                </figure>
            );
        },
        customTable: ({ value }: { value?: CustomTableValue }) => {
            const title = value?.title;
            const hasHeader = value?.hasHeader !== false;
            const rows = value?.table?.rows || [];

            if (rows.length === 0) return null;

            return (
                <div className="my-10 w-full overflow-x-auto">
                    {title && (
                        <h4 className="font-serif text-base sm:text-lg font-bold text-[#3C2F2F] mb-3 tracking-wide">
                            {title}
                        </h4>
                    )}
                    <table className="w-full border-collapse border border-[#E5DEC9] text-sm sm:text-base font-sans bg-white shadow-sm rounded-xl overflow-hidden">
                        <tbody>
                            {rows.map((row, rIdx) => {
                                const cells = row.cells || [];
                                const isHeader = hasHeader && rIdx === 0;

                                return (
                                    <tr
                                        key={row._key || rIdx}
                                        className={
                                            isHeader
                                                ? "bg-[#F9F6F0] border-b-2 border-[#E5DEC9]"
                                                : rIdx % 2 === 0
                                                ? "bg-white border-b border-[#E5DEC9]/50"
                                                : "bg-[#FAF8F5] border-b border-[#E5DEC9]/50"
                                        }
                                    >
                                        {cells.map((cell, cIdx) =>
                                            isHeader ? (
                                                <th
                                                    key={cIdx}
                                                    className="px-5 py-3.5 text-left font-bold text-[#3C2F2F] border-r border-[#E5DEC9]/60 last:border-r-0"
                                                >
                                                    {cell}
                                                </th>
                                            ) : (
                                                <td
                                                    key={cIdx}
                                                    className="px-5 py-3.5 text-[#4E473F] border-r border-[#E5DEC9]/40 last:border-r-0"
                                                >
                                                    {cell}
                                                </td>
                                            )
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        },
        divider: ({ value }: { value?: DividerValue }) => {
            const isDashed = value?.style === "dashed";
            return (
                <hr className={`my-10 border-none border-t ${isDashed ? "border-dashed border-t-2" : "border-solid"} border-[#E5DEC9]`} />
            );
        }
    },
    block: {
        normal: ({ children }) => (
            <p className="leading-relaxed text-[#4E473F] text-[16px] sm:text-[17px] mb-6 font-sans text-justify">
                {children}
            </p>
        ),
        "normal-center": ({ children }) => (
            <p className="leading-relaxed text-[#4E473F] text-[16px] sm:text-[17px] mb-6 font-sans text-center">
                {children}
            </p>
        ),
        "normal-right": ({ children }) => (
            <p className="leading-relaxed text-[#4E473F] text-[16px] sm:text-[17px] mb-6 font-sans text-right">
                {children}
            </p>
        ),
        h2: ({ children }) => (
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3C2F2F] mt-10 mb-4 tracking-tight leading-tight text-left">
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#3C2F2F] mt-8 mb-3 tracking-tight leading-tight text-left">
                {children}
            </h3>
        ),
        h4: ({ children }) => (
            <h4 className="font-serif text-lg sm:text-xl font-bold text-[#3C2F2F] mt-6 mb-2 leading-tight text-left">
                {children}
            </h4>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border border-[#E5DEC9]/40 border-l-4 border-l-[#C49A45] pl-6 py-2 my-8 italic text-lg sm:text-xl text-[#3C2F2F] font-serif bg-white rounded-r-xl shadow-sm text-left">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }: { children?: React.ReactNode }) => (
            <ul className="list-disc pl-6 space-y-2 mb-6 text-[#4E473F] text-[16px] sm:text-[17px] font-sans">
                {children}
            </ul>
        ),
        number: ({ children }: { children?: React.ReactNode }) => (
            <ol className="list-decimal pl-6 space-y-2 mb-6 text-[#4E473F] text-[16px] sm:text-[17px] font-sans">
                {children}
            </ol>
        ),
    },
    marks: {
        strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-[#2D2A26]">{children}</strong>,
        em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
        underline: ({ children }: { children?: React.ReactNode }) => <span className="underline decoration-[#C49A45]/50">{children}</span>,
        superscript: ({ children }: { children?: React.ReactNode }) => <sup className="font-bold text-xs select-none">{children}</sup>,
        left: ({ children }: { children?: React.ReactNode }) => <span className="block text-left">{children}</span>,
        center: ({ children }: { children?: React.ReactNode }) => <span className="block text-center">{children}</span>,
        right: ({ children }: { children?: React.ReactNode }) => <span className="block text-right">{children}</span>,
        justify: ({ children }: { children?: React.ReactNode }) => <span className="block text-justify">{children}</span>,
        internalLink: ({ children, value }: { children?: React.ReactNode; value?: InternalLinkValue }) => {
            const ref = value?.reference;
            if (!ref) {
                return <span>{children}</span>;
            }

            let href = "/";
            if (ref._type === "article" || ref._type === "standaloneBook") {
                href = `/${ref.slug?.current || ""}`;
            } else if (ref._type === "issue") {
                href = `/folyoirat`;
            }

            return (
                <Link
                    href={href}
                    className="text-[#C49A45] hover:text-[#B38934] font-semibold underline decoration-[#C49A45]/40 hover:decoration-[#B38934] transition-all duration-150"
                >
                    {children}
                </Link>
            );
        },
        link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => {
            const href = value?.href || "";
            const isFootnote = href.startsWith("#");

            if (isFootnote) {
                const ftnId = href.substring(1);
                return (
                    <a
                        href={href}
                        id={`ref-${ftnId}`}
                        className="text-[#C49A45] hover:text-[#B38934] font-bold px-0.5 transition-colors cursor-pointer select-none"
                        title="Lábjegyzet hivatkozás"
                    >
                        {children}
                    </a>
                );
            }

            if (href.startsWith("/")) {
                return (
                    <Link
                        href={href}
                        className="text-[#C49A45] hover:text-[#B38934] font-medium underline decoration-[#C49A45]/30 hover:decoration-[#B38934] transition-all duration-150"
                    >
                        {children}
                    </Link>
                );
            }

            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C49A45] hover:text-[#B38934] underline decoration-[#C49A45]/30 hover:decoration-[#B38934] transition-all duration-150"
                >
                    {children}
                </a>
            );
        }
    }
};

interface RichTextProps {
    value?: PortableTextBlock[] | null;
    className?: string;
}

export function RichText({ value, className }: RichTextProps) {
    if (!value || value.length === 0) return null;
    return (
        <div className={className || "prose prose-[#3C2F2F] max-w-none"}>
            <PortableText value={value} components={richTextComponents} />
        </div>
    );
}
