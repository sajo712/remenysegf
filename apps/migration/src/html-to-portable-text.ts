import * as cheerio from 'cheerio';
import { randomBytes } from 'crypto';

const generateKey = () => randomBytes(6).toString('hex');

interface PortableTextSpan {
    _type: 'span';
    _key: string;
    text: string;
    marks: string[];
}

interface PortableTextMarkDef {
    _type: 'link';
    _key: string;
    href: string;
}

interface PortableTextBlock {
    _type: 'block' | 'customTable' | 'divider';
    _key: string;
    style?: string;
    listItem?: 'bullet' | 'number';
    level?: number;
    children?: PortableTextSpan[];
    markDefs?: PortableTextMarkDef[];
    hasHeader?: boolean;
    title?: string;
    table?: {
        _type: 'table';
        rows: Array<{
            _type: 'tableRow';
            _key: string;
            cells: string[];
        }>;
    };
}

/**
 * Extracts text alignment (left, center, right, justify) from element styles, attributes, or CSS classes.
 */
function getElementAlignment($el: cheerio.Cheerio<any>): 'left' | 'center' | 'right' | 'justify' | undefined {
    const styleAttr = $el.attr('style') || '';
    const styleMatch = styleAttr.match(/text-align\s*:\s*(center|right|left|justify)/i);
    if (styleMatch) {
        return styleMatch[1].toLowerCase() as any;
    }

    const alignAttr = ($el.attr('align') || '').toLowerCase();
    if (['center', 'right', 'left', 'justify'].includes(alignAttr)) {
        return alignAttr as any;
    }

    const classAttr = ($el.attr('class') || '').toLowerCase();
    const classes = classAttr.split(/\s+/);
    if (classes.some(c => ['center', 'aligncenter', 'align-center', 'text-center', 'has-text-align-center'].includes(c))) {
        return 'center';
    }
    if (classes.some(c => ['right', 'alignright', 'align-right', 'text-right', 'has-text-align-right'].includes(c))) {
        return 'right';
    }
    if (classes.some(c => ['justify', 'alignjustify', 'align-justify', 'text-justify', 'has-text-align-justify'].includes(c))) {
        return 'justify';
    }
    if (classes.some(c => ['left', 'alignleft', 'align-left', 'text-left', 'has-text-align-left'].includes(c))) {
        return 'left';
    }

    if ($el.parent('center').length > 0 || $el.is('center')) {
        return 'center';
    }

    return undefined;
}

/**
 * Traverses HTML elements recursively to extract text spans and mark definitions.
 */
function traverseSpans(
    node: any,
    $: cheerio.CheerioAPI,
    activeMarks: string[],
    spans: PortableTextSpan[],
    markDefs: PortableTextMarkDef[]
) {
    if (node.type === 'text') {
        const textContent = $(node).text();
        if (textContent) {
            spans.push({
                _type: 'span',
                _key: generateKey(),
                text: textContent,
                marks: [...activeMarks]
            });
        }
        return;
    }

    if (node.type === 'tag') {
        const tagName = node.name.toLowerCase();
        let newMarks = [...activeMarks];
        let linkDefAdded = false;

        if (tagName === 'strong' || tagName === 'b') {
            newMarks.push('strong');
        } else if (tagName === 'em' || tagName === 'i') {
            newMarks.push('em');
        } else if (tagName === 'u') {
            newMarks.push('underline');
        } else if (tagName === 'a') {
            const href = $(node).attr('href');
            if (href) {
                const linkKey = `link_${generateKey()}`;
                newMarks.push(linkKey);
                markDefs.push({
                    _type: 'link',
                    _key: linkKey,
                    href: href
                });
                linkDefAdded = true;
            }
        }

        // Recursively traverse children
        const children = $(node).contents().toArray();
        for (const child of children) {
            traverseSpans(child, $, newMarks, spans, markDefs);
        }
    }
}

/**
 * Parses an element's inline formatting into Portable Text spans and markDefs.
 */
function parseInlineContent(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI) {
    const spans: PortableTextSpan[] = [];
    const markDefs: PortableTextMarkDef[] = [];
    
    const contents = element.contents().toArray();
    for (const content of contents) {
        traverseSpans(content, $, [], spans, markDefs);
    }
    
    // Fallback if empty block
    if (spans.length === 0) {
        spans.push({
            _type: 'span',
            _key: generateKey(),
            text: '',
            marks: []
        });
    }
    
    return { children: spans, markDefs };
}

/**
 * Converts a clean HTML string into Sanity Portable Text blocks.
 */
export function htmlToPortableText(html: string): PortableTextBlock[] {
    const $ = cheerio.load(html);
    const blocks: PortableTextBlock[] = [];
    
    const processElement = (el: any, inheritedAlign?: 'left' | 'center' | 'right' | 'justify') => {
        if (el.type !== 'tag') return;
        
        const $el = $(el);
        const tagName = el.name.toLowerCase();
        const textAlign = getElementAlignment($el) || inheritedAlign;

        if (tagName === 'center') {
            $el.contents().each((_, child) => {
                if (child.type === 'tag') {
                    processElement(child, 'center');
                } else if (child.type === 'text' && child.data?.trim()) {
                    const { children, markDefs } = parseInlineContent($el, $);
                    blocks.push({
                        _type: 'block',
                        _key: generateKey(),
                        style: 'normal-center',
                        children,
                        markDefs
                    });
                }
            });
            return;
        }

        if (tagName === 'hr') {
            blocks.push({
                _type: 'divider',
                _key: generateKey(),
                style: 'default'
            });
            return;
        }

        const elText = $el.text().trim();
        if (/^\s*(\*\s*){3,}$/.test(elText) || elText === '***') {
            blocks.push({
                _type: 'divider' as any,
                _key: generateKey(),
                style: 'default'
            });
            return;
        }
        
function addBlockWithPossibleTrailingDivider(
    blocks: PortableTextBlock[],
    blockData: {
        _type: 'block';
        _key: string;
        style: string;
        listItem?: 'bullet' | 'number';
        level?: number;
        children: PortableTextSpan[];
        markDefs: PortableTextMarkDef[];
    }
) {
    const { children, ...rest } = blockData;
    const fullText = children.map(c => c.text).join('');
    const hasTrailingStars = /(?:\s*\*\s*){3,}$/.test(fullText);

    if (hasTrailingStars) {
        for (let i = children.length - 1; i >= 0; i--) {
            const span = children[i];
            if (/^[\s*]+$/.test(span.text)) {
                span.text = '';
            } else if (/[\s*]+$/.test(span.text)) {
                span.text = span.text.replace(/(?:\s*\*\s*){3,}$/, '').replace(/[\s*]+$/, '');
                break;
            } else {
                break;
            }
        }
        const filteredChildren = children.filter(c => c.text.length > 0);
        if (filteredChildren.length > 0) {
            blocks.push({
                ...rest,
                children: filteredChildren
            });
        }
        blocks.push({
            _type: 'divider',
            _key: generateKey(),
            style: 'default'
        });
    } else {
        blocks.push(blockData);
    }
}

        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(tagName)) {
            let style = 'normal';
            if (tagName === 'h1' || tagName === 'h2') {
                style = 'h2'; // Normalizing titles to H2 for main article body headings
            } else if (tagName === 'h3') {
                style = 'h3';
            } else if (tagName === 'h4') {
                style = 'h4';
            } else if (tagName === 'blockquote') {
                style = 'blockquote';
            }
            
            if (style === 'normal') {
                if (textAlign === 'center') {
                    style = 'normal-center';
                } else if (textAlign === 'right') {
                    style = 'normal-right';
                }
            }
            
            const { children, markDefs } = parseInlineContent($el, $);
            addBlockWithPossibleTrailingDivider(blocks, {
                _type: 'block',
                _key: generateKey(),
                style,
                children,
                markDefs
            });
        } else if (tagName === 'ul' || tagName === 'ol') {
            const listType = tagName === 'ul' ? 'bullet' : 'number';
            
            $el.find('> li').each((__, li) => {
                const $li = $(li);
                const liTextAlign = getElementAlignment($li) || textAlign;
                const { children, markDefs } = parseInlineContent($li, $);
                
                let style = 'normal';
                if (liTextAlign === 'center') style = 'normal-center';
                else if (liTextAlign === 'right') style = 'normal-right';

                addBlockWithPossibleTrailingDivider(blocks, {
                    _type: 'block',
                    _key: generateKey(),
                    style,
                    listItem: listType,
                    level: 1,
                    children,
                    markDefs
                });
            });
        } else if (tagName === 'table') {
            const trElements = $el.find('tr').toArray();

            // 1. Detect if it is a single-cell table (used as pull-quote/callout in Word documents)
            if (trElements.length === 1) {
                const cells = $(trElements[0]).find('td, th').toArray();
                if (cells.length === 1) {
                    const { children, markDefs } = parseInlineContent($(cells[0]), $);
                    blocks.push({
                        _type: 'block',
                        _key: generateKey(),
                        style: 'blockquote',
                        children,
                        markDefs
                    });
                    return;
                }
            }

            let maxCols = 0;
            trElements.forEach(tr => {
                let colCount = 0;
                $(tr).find('td, th').each((_, cell) => {
                    const colspanAttr = $(cell).attr('colspan');
                    const colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;
                    colCount += isNaN(colspan) ? 1 : colspan;
                });
                if (colCount > maxCols) {
                    maxCols = colCount;
                }
            });

            const rows: Array<{ _type: 'tableRow'; _key: string; cells: string[] }> = [];
            trElements.forEach(tr => {
                const cells: string[] = [];
                const cellElements = $(tr).find('td, th').toArray();

                cellElements.forEach(cell => {
                    const text = $(cell).text().trim() || '';
                    const colspanAttr = $(cell).attr('colspan');
                    const colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;
                    const spanCount = isNaN(colspan) ? 1 : colspan;

                    cells.push(text);
                    for (let s = 1; s < spanCount; s++) {
                        cells.push('');
                    }
                });

                while (cells.length < maxCols) {
                    cells.push('');
                }
                if (cells.length > maxCols) {
                    cells.splice(maxCols);
                }

                rows.push({
                    _type: 'tableRow',
                    _key: generateKey(),
                    cells
                });
            });

            if (rows.length > 0) {
                const firstRow = trElements[0];
                const firstRowText = firstRow ? ($(firstRow).text().trim() || '') : '';
                const hasLetters = /\p{L}/u.test(firstRowText);
                const isAllUppercase = hasLetters && !/\p{Ll}/u.test(firstRowText);

                const hasHeader = firstRow ? (
                    $(firstRow).find('th').length > 0 ||
                    $(firstRow).find('strong, b').length > 0 ||
                    isAllUppercase
                ) : true;

                const captionEl = $el.find('caption').first();
                const tableTitle = captionEl.length > 0 ? captionEl.text().trim() : '';

                blocks.push({
                    _type: 'customTable',
                    _key: generateKey(),
                    hasHeader,
                    title: tableTitle,
                    table: {
                        _type: 'table',
                        rows
                    }
                });
            }
        } else {
            // Treat other tag types as normal paragraphs for safety
            const { children, markDefs } = parseInlineContent($el, $);
            let style = 'normal';
            if (textAlign === 'center') style = 'normal-center';
            else if (textAlign === 'right') style = 'normal-right';

            addBlockWithPossibleTrailingDivider(blocks, {
                _type: 'block',
                _key: generateKey(),
                style,
                children,
                markDefs
            });
        }
    };

    // We work on the body's direct children
    $('body').contents().each((_, el) => {
        processElement(el);
    });
    
    return blocks;
}
