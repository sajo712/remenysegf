const generateKey = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

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

export interface PortableTextBlock {
    _type: 'block';
    _key: string;
    style: string;
    listItem?: 'bullet' | 'number';
    level?: number;
    children: PortableTextSpan[];
    markDefs: PortableTextMarkDef[];
}

/**
 * Helper to convert base64 data URL to Blob for client upload.
 * Synchronous and extremely robust across all JS environments.
 */
function dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Traverses DOM nodes recursively to extract text spans and mark definitions.
 */
function traverseSpans(
    node: Node,
    activeMarks: string[],
    spans: PortableTextSpan[],
    markDefs: PortableTextMarkDef[]
) {
    if (node.nodeType === Node.TEXT_NODE) {
        let textContent = node.textContent || '';
        // Simplify multiple spaces to a single space
        textContent = textContent.replace(/ {2,}/g, ' ');
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

    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        let newMarks = [...activeMarks];

        if (tagName === 'strong' || tagName === 'b') {
            newMarks.push('strong');
        } else if (tagName === 'em' || tagName === 'i') {
            newMarks.push('em');
        } else if (tagName === 'u') {
            newMarks.push('underline');
        } else if (tagName === 'a') {
            const href = element.getAttribute('href') || '';
            
            // Handle local footnote links
            if (href.startsWith('#_ftn') || href.includes('footnote') || href.startsWith('#fn')) {
                let text = element.textContent?.trim() || '';
                // Remove bracket characters if any, as we will format it beautifully as superscript
                text = text.replace(/[[\]]/g, '');
                if (text) {
                    const linkKey = `link_${generateKey()}`;
                    spans.push({
                        _type: 'span',
                        _key: generateKey(),
                        text: text,
                        marks: [...activeMarks, 'superscript', linkKey]
                    });
                    markDefs.push({
                        _type: 'link',
                        _key: linkKey,
                        href: href
                    });
                }
                return; // Footnote reference is handled, skip further child traversal
            }

            const linkKey = `link_${generateKey()}`;
            newMarks.push(linkKey);
            markDefs.push({
                _type: 'link',
                _key: linkKey,
                href: href
            });
        }

        // Traverse children
        const childNodes = element.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            traverseSpans(childNodes[i], newMarks, spans, markDefs);
        }
    }
}

/**
 * Parses an element's inline formatting into Portable Text spans and markDefs.
 */
function parseInlineContent(element: HTMLElement) {
    const spans: PortableTextSpan[] = [];
    const markDefs: PortableTextMarkDef[] = [];
    
    const childNodes = element.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        traverseSpans(childNodes[i], [], spans, markDefs);
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
 * Converts an HTML string to standard Sanity Portable Text blocks using DOMParser.
 * Dynamically handles inline images by uploading them to Sanity Assets.
 */
export async function htmlToPortableText(
    html: string,
    client: any,
    logCallback: (msg: string) => void
): Promise<any[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: any[] = [];
    const nodesToSkip = new Set<Node>();
    
    const bodyChildren = Array.from(doc.body.childNodes);
    for (let i = 0; i < bodyChildren.length; i++) {
        const node = bodyChildren[i];
        if (nodesToSkip.has(node)) continue;
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        // Intercept elements containing an image tag
        const imgElements = Array.from(element.querySelectorAll('img'));
        if (imgElements.length > 0) {
            // Check if there is also text content in the element (excluding img tags)
            const elementClone = element.cloneNode(true) as HTMLElement;
            elementClone.querySelectorAll('img').forEach(img => img.remove());
            const remainingText = elementClone.textContent?.trim() || '';
            
            if (remainingText) {
                // If there's text, first parse the text content without the images
                const { children, markDefs } = parseInlineContent(elementClone);
                if (children.length > 0 && children[0].text !== '') {
                    let style = 'normal';
                    if (tagName === 'h1' || tagName === 'h2') style = 'h2';
                    else if (tagName === 'h3') style = 'h3';
                    else if (tagName === 'h4') style = 'h4';
                    else if (tagName === 'blockquote') style = 'blockquote';
                    
                    blocks.push({
                        _type: 'block',
                        _key: generateKey(),
                        style,
                        children,
                        markDefs
                    });
                }
            }
            
            // Now process each image in the element
            for (const imgEl of imgElements) {
                const src = imgEl.getAttribute('src') || '';
                if (src.startsWith('data:image/')) {
                    try {
                        logCallback(`[Kép] Beágyazott kép feltöltése Sanity-be...`);
                        const blob = dataUrlToBlob(src);
                        const filename = `inline-image-${generateKey()}.png`;
                        const asset = await client.assets.upload('image', blob, { filename });
                        
                        // Look ahead for caption in next elements (up to 2 levels)
                        let caption: string | undefined = undefined;
                        let nextEl = element.nextElementSibling as HTMLElement | null;
                        
                        let lookAheadCount = 0;
                        while (nextEl && lookAheadCount < 2) {
                            const nextText = nextEl.textContent?.trim() || '';
                            if (nextText === '') {
                                nextEl = nextEl.nextElementSibling as HTMLElement | null;
                                lookAheadCount++;
                                continue;
                            }
                            
                            // Caption heuristics: short text, contains "ábra", "fig", or is italicized
                            const isCaption = nextText.length < 150 && (
                                nextText.toLowerCase().includes('ábra') || 
                                nextText.toLowerCase().includes('abra') || 
                                nextText.toLowerCase().startsWith('fig') || 
                                nextEl.querySelector('em, i') !== null ||
                                nextText.length < 100
                            );
                            
                            if (isCaption) {
                                caption = nextText;
                                nodesToSkip.add(nextEl);
                                nextEl.remove();
                                logCallback(`[Kép] Képfelirat társítva: "${caption}"`);
                            }
                            break;
                        }
                        
                        const imageBlock: any = {
                            _type: 'image',
                            _key: generateKey(),
                            asset: {
                                _type: 'reference',
                                _ref: asset._id
                            }
                        };
                        if (caption) {
                            imageBlock.caption = caption;
                            imageBlock.alt = caption;
                        }
                        blocks.push(imageBlock);
                        logCallback(`[Kép] Kép sikeresen feltöltve!`);
                    } catch (error) {
                        logCallback(`[Kép Hiba] Sikertelen feltöltés: ${String(error)}`);
                        console.error(error);
                    }
                }
            }
            continue; // Skip treating this element as a normal text block
        }

        if (tagName === 'hr') {
            blocks.push({
                _type: 'divider',
                _key: generateKey(),
                style: 'default'
            });
            continue;
        }

        const elText = element.textContent?.trim() || '';
        if (/^\s*(\*\s*){3,}$/.test(elText) || elText === '***') {
            blocks.push({
                _type: 'divider',
                _key: generateKey(),
                style: 'default'
            });
            continue;
        }
        
function addBlockWithPossibleTrailingDivider(
    blocks: any[],
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
                style = 'h2'; 
            } else if (tagName === 'h3') {
                style = 'h3';
            } else if (tagName === 'h4') {
                style = 'h4';
            } else if (tagName === 'blockquote') {
                style = 'blockquote';
            }
            
            const { children, markDefs } = parseInlineContent(element);
            addBlockWithPossibleTrailingDivider(blocks, {
                _type: 'block',
                _key: generateKey(),
                style,
                children,
                markDefs
            });
        } else if (tagName === 'ul' || tagName === 'ol') {
            const listType = tagName === 'ul' ? 'bullet' : 'number';
            const listItems = element.querySelectorAll('li');
            
            listItems.forEach(li => {
                const { children, markDefs } = parseInlineContent(li as HTMLElement);
                addBlockWithPossibleTrailingDivider(blocks, {
                    _type: 'block',
                    _key: generateKey(),
                    style: 'normal',
                    listItem: listType,
                    level: 1,
                    children,
                    markDefs
                });
            });
        } else if (tagName === 'img') {
            // Handle standalone inline images if any directly on body root
            const src = element.getAttribute('src') || '';
            if (src.startsWith('data:image/')) {
                try {
                    logCallback(`[Kép] Beágyazott kép feltöltése Sanity-be...`);
                    const blob = dataUrlToBlob(src);
                    const filename = `inline-image-${generateKey()}.png`;
                    const asset = await client.assets.upload('image', blob, { filename });
                    
                    // Standalone image caption lookahead (up to 2 levels)
                    let caption: string | undefined = undefined;
                    let nextEl = element.nextElementSibling as HTMLElement | null;
                    let lookAheadCount = 0;
                    while (nextEl && lookAheadCount < 2) {
                        const nextText = nextEl.textContent?.trim() || '';
                        if (nextText === '') {
                            nextEl = nextEl.nextElementSibling as HTMLElement | null;
                            lookAheadCount++;
                            continue;
                        }
                        const isCaption = nextText.length < 150 && (
                            nextText.toLowerCase().includes('ábra') || 
                            nextText.toLowerCase().includes('abra') || 
                            nextText.toLowerCase().startsWith('fig') || 
                            nextEl.querySelector('em, i') !== null ||
                            nextText.length < 100
                        );
                        if (isCaption) {
                            caption = nextText;
                            nodesToSkip.add(nextEl);
                            nextEl.remove();
                            logCallback(`[Kép] Képfelirat társítva: "${caption}"`);
                        }
                        break;
                    }
                    
                    const imageBlock: any = {
                        _type: 'image',
                        _key: generateKey(),
                        asset: {
                            _type: 'reference',
                            _ref: asset._id
                        }
                    };
                    if (caption) {
                        imageBlock.caption = caption;
                        imageBlock.alt = caption;
                    }
                    blocks.push(imageBlock);
                    logCallback(`[Kép] Kép sikeresen beillesztve! ID: ${asset._id}`);
                } catch (error) {
                    logCallback(`[Kép Hiba] Sikertelen képfeltöltés: ${String(error)}`);
                    console.error(error);
                }
            }
        } else if (tagName === 'table') {
            const trElements = Array.from(element.querySelectorAll('tr'));
            
            // 1. Detect if it is a single-cell table (used as pull-quote/callout in Word documents)
            if (trElements.length === 1) {
                const cells = Array.from(trElements[0].querySelectorAll('td, th'));
                if (cells.length === 1) {
                    const singleCell = cells[0] as HTMLElement;
                    // Parse the inner text preserving all formatting (bold, italic, links, footnotes, etc.)
                    const { children, markDefs } = parseInlineContent(singleCell);
                    blocks.push({
                        _type: 'block',
                        _key: generateKey(),
                        style: 'blockquote',
                        children,
                        markDefs
                    });
                    logCallback(`[Táblázat] Egycellás táblázat kiemelt idézetté (blockquote) alakítva.`);
                    continue;
                }
            }

            // Compute the maximum number of columns across all rows, taking colspan into account
            let maxCols = 0;
            trElements.forEach(tr => {
                let colCount = 0;
                tr.querySelectorAll('td, th').forEach(cell => {
                    const colspanAttr = cell.getAttribute('colspan');
                    const colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;
                    colCount += isNaN(colspan) ? 1 : colspan;
                });
                if (colCount > maxCols) {
                    maxCols = colCount;
                }
            });

            const rows: any[] = [];
            trElements.forEach(tr => {
                const cells: string[] = [];
                const cellElements = Array.from(tr.querySelectorAll('td, th'));
                
                cellElements.forEach(cell => {
                    const text = cell.textContent?.trim() || '';
                    const colspanAttr = cell.getAttribute('colspan');
                    const colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;
                    const spanCount = isNaN(colspan) ? 1 : colspan;
                    
                    // Push cell text for the first column of the span
                    cells.push(text);
                    // Push empty strings for the remaining spanned columns
                    for (let s = 1; s < spanCount; s++) {
                        cells.push('');
                    }
                });
                
                // Pad rows with fewer cells to ensure equal column count across the table
                while (cells.length < maxCols) {
                    cells.push('');
                }
                // Truncate if somehow it exceeded maxCols
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
                const firstRowText = firstRow ? (firstRow.textContent?.trim() || '') : '';
                const hasLetters = /\p{L}/u.test(firstRowText);
                const isAllUppercase = hasLetters && !/\p{Ll}/u.test(firstRowText);

                const hasHeader = firstRow ? (
                    firstRow.querySelectorAll('th').length > 0 ||
                    firstRow.querySelectorAll('strong, b').length > 0 ||
                    isAllUppercase
                ) : true;
                
                const captionEl = element.querySelector('caption');
                const tableTitle = captionEl ? (captionEl.textContent?.trim() || '') : '';
                
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
                logCallback(`[Táblázat] Táblázat sikeresen lefordítva (${rows.length} sor, ${maxCols} oszlop, fejléc: ${hasHeader ? 'IGEN' : 'NEM'}).`);
            }
        } else {
            // Safe fallback to a normal block
            const { children, markDefs } = parseInlineContent(element);
            addBlockWithPossibleTrailingDivider(blocks, {
                _type: 'block',
                _key: generateKey(),
                style: 'normal',
                children,
                markDefs
            });
        }
    }
    
    // Strip leading empty blocks
    while (blocks.length > 0) {
        const first = blocks[0];
        if (first._type === 'block' && (!first.children || first.children.map((c: any) => c.text).join('').trim() === '')) {
            blocks.shift();
        } else {
            break;
        }
    }
    
    return blocks;
}
