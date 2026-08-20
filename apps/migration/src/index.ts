import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { htmlToPortableText } from './html-to-portable-text';
import { SanityUploader } from './sanity-uploader';

// Load environment variables
dotenv.config();

function showUsage() {
    console.log(`
Reménység foglyai - Data Migration Script
=========================================
Használat:
  pnpm start <docx-fájl-útvonala> <lapszám-címe> <lapszám-sorszáma> [publikálás-dátuma] [opciók]

Paraméterek:
  <docx-fájl-útvonala>   A feldolgozandó Word (.docx) fájl relatív vagy abszolút útvonala.
  <lapszám-címe>         A létrehozandó Sanity lapszám címe (pl. "2026/1. lapszám").
  <lapszám-sorszáma>     A lapszám sorszáma számként (pl. 54).
  [publikálás-dátuma]    Opcionális. ÉÉÉÉ-HH-NN formátumban (alapértelmezett: mai dátum).

Opciók:
  --dry-run              Teszt üzemmód. Nem tölt fel semmit a Sanity-be, csak kiírja a generált JSON-t.
  --lang=<hu|en>         A cikkek nyelve (alapértelmezett: "hu").
  --tags=<címkék>        Vesszővel elválasztott címkék a cikkekhez (pl. "Hit,Tanítás").
  --cover=<url>          A lapszám borítóképének URL címe.
  --pdf=<url>            A lapszám letölthető PDF fájljának URL címe.
  --youtube=<url>        A beágyazandó YouTube hangoskönyv URL címe.

Példa:
  pnpm start test.docx "2026/1. lapszám" 54 2026-06-01 --dry-run
`);
}

function cleanWhitespace($: cheerio.CheerioAPI) {
    // Trim leading/trailing tabs and spaces from paragraph, heading, list item elements.
    $('p, li, h1, h2, h3, h4, h5, h6').each((_, el) => {
        const $el = $(el);
        
        const trimLeft = (node: any): boolean => {
            if (!node) return false;
            if (node.type === 'text') {
                const val = node.data || '';
                const newVal = val.replace(/^[ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g, '');
                node.data = newVal;
                if (newVal.length > 0) {
                    return true;
                }
            } else if (node.type === 'tag') {
                const children = $(node).contents().toArray();
                for (const child of children) {
                    if (trimLeft(child)) return true;
                }
            }
            return false;
        };
        
        const trimRight = (node: any): boolean => {
            if (!node) return false;
            if (node.type === 'text') {
                const val = node.data || '';
                const newVal = val.replace(/[ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/g, '');
                node.data = newVal;
                if (newVal.length > 0) {
                    return true;
                }
            } else if (node.type === 'tag') {
                const children = $(node).contents().toArray();
                for (let i = children.length - 1; i >= 0; i--) {
                    if (trimRight(children[i])) return true;
                }
            }
            return false;
        };
        
        const children = $el.contents().toArray();
        for (const child of children) {
            if (trimLeft(child)) break;
        }
        
        for (let i = children.length - 1; i >= 0; i--) {
            if (trimRight(children[i])) break;
        }
        
        $el.contents().each((_, child) => {
            if (child.type === 'text' && (child.data === '' || child.data === undefined)) {
                $(child).remove();
            }
        });
    });

    // Post-whitespace: Replace elements that are just stars, or strip trailing stars and insert hr
    $('p, li, h1, h2, h3, h4, h5, h6').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        if (/^\s*(\*\s*){3,}$/.test(text) || text === '***') {
            $el.replaceWith('<hr>');
        } else if (/(?:\s*\*\s*){3,}$/.test(text)) {
            const cleanText = text.replace(/(?:\s*\*\s*){3,}$/, '').trimEnd();
            $el.text(cleanText);
            $el.after('<hr>');
        }
    });
}

function shouldBeH3(el: any, $: cheerio.CheerioAPI): boolean {
    const text = $(el).text().trim();
    if (text.length > 150) {
        return false;
    }
    
    // 1. Nested numbering (e.g. 2.1. or 2.1.3.)
    if (/^\d+(\.\d+)+\.\s+/.test(text)) {
        return true;
    }
    
    // 2. Lowercase alphabetical numbering (e.g. b.)
    if (/^[a-z]\.\s+/.test(text)) {
        return true;
    }
    
    return false;
}

function isMostlyBold(el: any, $: cheerio.CheerioAPI): boolean {
    const text = $(el).text().trim();
    if (!text) return false;
    
    let boldText = '';
    $(el).find('strong, b').each((_, boldEl) => {
        boldText += $(boldEl).text() + ' ';
    });
    boldText = boldText.trim();
    
    const cleanText = text.replace(/^\d+(\.\d+)*\.\s+/, '').replace(/^[a-zA-Z]\.\s+/, '').replace(/\s+/g, ' ').trim();
    const cleanBoldText = boldText.replace(/^\d+(\.\d+)*\.\s+/, '').replace(/^[a-zA-Z]\.\s+/, '').replace(/\s+/g, ' ').trim();
    
    if (!cleanText || !cleanBoldText) {
        return false;
    }
    
    return cleanBoldText.includes(cleanText) || 
           (cleanText.includes(cleanBoldText) && cleanBoldText.length >= cleanText.length * 0.8);
}

function shouldBeH2(el: any, $: cheerio.CheerioAPI): boolean {
    const text = $(el).text().trim();
    if (text.length > 150) {
        return false;
    }
    
    if (!/^\d+\.\s+/.test(text)) {
        return false;
    }
    
    return isMostlyBold(el, $);
}

function isEntirelyBold(el: any, $: cheerio.CheerioAPI): boolean {
    const text = $(el).text().trim();
    if (!text || text.length > 150) {
        return false;
    }
    
    let boldText = '';
    $(el).find('strong, b').each((_, boldEl) => {
        boldText += $(boldEl).text() + ' ';
    });
    boldText = boldText.trim();
    
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const cleanBoldText = boldText.replace(/\s+/g, ' ').trim();
    
    return cleanBoldText === cleanText;
}

function isScriptureReference(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        const inside = trimmed.slice(1, -1).trim();
        return inside.length > 0 && inside.length < 100;
    }
    return false;
}

function isLikelyAuthor(text: string, existingAuthors: Set<string>): boolean {
    const cleaned = text.trim();
    if (!cleaned) return false;
    if (existingAuthors.has(cleaned.toLowerCase())) return true;
    
    if (cleaned.length < 40 && !cleaned.startsWith('(') && !/^\d+\./.test(cleaned)) {
        const words = cleaned.split(/\s+/).length;
        return words >= 1 && words <= 4;
    }
    return false;
}

function numberToLetter(num: number): string {
    let letter = '';
    let temp = num;
    while (temp > 0) {
        const mod = (temp - 1) % 26;
        letter = String.fromCharCode(97 + mod) + letter;
        temp = Math.floor((temp - mod) / 26);
    }
    return letter || 'a';
}

function getListItemPrefix(el: any, $: cheerio.CheerioAPI): string {
    const text = $(el).text().trim();
    if (/^\d+(\.\d+)*\.\s+/.test(text) || /^[a-zA-Z]\.\s+/.test(text)) {
        return '';
    }
    
    const parent = $(el).parent();
    const parentTagName = parent.prop('tagName')?.toLowerCase();
    
    if (parentTagName === 'ol') {
        const siblings = parent.children('li').toArray();
        const index = siblings.indexOf(el);
        if (index === -1) return '';
        
        const startAttr = parent.attr('start');
        const start = startAttr ? parseInt(startAttr, 10) : 1;
        const value = start + index;
        
        const type = parent.attr('type') || '1';
        
        if (type === 'a') {
            return `${numberToLetter(value).toLowerCase()}. `;
        } else if (type === 'A') {
            return `${numberToLetter(value).toUpperCase()}. `;
        } else {
            return `${value}. `;
        }
    }
    
    return '';
}

function getListItemHeadingType(el: any, $: cheerio.CheerioAPI): 'h2' | 'h3' | null {
    const text = $(el).text().trim();
    if (text.length > 150) {
        return null;
    }
    
    if (/^\d+(\.\d+)+\.\s+/.test(text)) {
        return 'h3';
    }
    
    if (/^[a-zA-Z]\.\s+/.test(text)) {
        return 'h3';
    }
    
    if (/^\d+\.\s+/.test(text)) {
        if (shouldBeH2(el, $)) {
            return 'h2';
        }
    }
    
    const isBold = isEntirelyBold(el, $) || isMostlyBold(el, $);
    if (isBold) {
        const parent = $(el).parent();
        const parentTagName = parent.prop('tagName')?.toLowerCase();
        if (parentTagName === 'ol') {
            const type = parent.attr('type');
            if (type === 'a' || type === 'A') {
                return 'h3';
            }
            return 'h2';
        }
    }
    
    return null;
}

function convertParagraphsToHeadings($: cheerio.CheerioAPI) {
    $('p').each((_, p) => {
        const $p = $(p);
        const style = $p.attr('style');
        const align = $p.attr('align');
        const cls = $p.attr('class');

        const copyAttrs = ($newEl: cheerio.Cheerio<any>) => {
            if (style && !/text-align\s*:\s*center/i.test(style)) $newEl.attr('style', style);
            if (align && align.toLowerCase() !== 'center') $newEl.attr('align', align);
            if (cls) {
                const cleanCls = cls.split(/\s+/).filter(c => !['center', 'aligncenter', 'align-center', 'text-center', 'has-text-align-center'].includes(c.toLowerCase())).join(' ');
                if (cleanCls) $newEl.attr('class', cleanCls);
            }
            return $newEl;
        };
        
        if (shouldBeH3(p, $)) {
            const text = $p.text().trim();
            const $h3 = $(`<h3>${text}</h3>`);
            copyAttrs($h3);
            $p.replaceWith($h3);
            return;
        }
        
        if (shouldBeH2(p, $)) {
            const text = $p.text().trim();
            const $h2 = $(`<h2>${text}</h2>`);
            copyAttrs($h2);
            $p.replaceWith($h2);
            return;
        }
        
        if (isEntirelyBold(p, $)) {
            const text = $p.text().trim();
            const $h2 = $(`<h2>${text}</h2>`);
            copyAttrs($h2);
            $p.replaceWith($h2);
            return;
        }
    });
}

function splitListsWithHeadings($: cheerio.CheerioAPI) {
    $('ol, ul').each((_, listEl: any) => {
        const $list = $(listEl);
        const listTagName = listEl.name.toLowerCase();
        const items = $list.children('li').toArray();
        
        const itemData = items.map((item) => {
            const headingType = getListItemHeadingType(item, $);
            const prefix = headingType ? getListItemPrefix(item, $) : '';
            return { item, headingType, prefix };
        });
        
        const hasHeading = itemData.some(d => d.headingType !== null);
        if (!hasHeading) {
            return;
        }
        
        const replacements: any[] = [];
        let currentListItems: any[] = [];
        
        for (const data of itemData) {
            const $item = $(data.item);
            if (data.headingType !== null) {
                if (currentListItems.length > 0) {
                    const $newList = $list.clone().empty();
                    $newList.append(currentListItems);
                    replacements.push($newList);
                    currentListItems = [];
                }
                
                const text = data.prefix + $item.text().trim();
                const $h = $(`<${data.headingType}>${text}</${data.headingType}>`);
                replacements.push($h);
            } else {
                currentListItems.push(data.item);
            }
        }
        
        if (currentListItems.length > 0) {
            const $newList = $list.clone().empty();
            $newList.append(currentListItems);
            replacements.push($newList);
        }
        
        if (replacements.length > 0) {
            let $prev = $list;
            for (const rep of replacements) {
                $prev.after(rep);
                $prev = rep;
            }
            $list.remove();
        }
    });
}

async function main() {
    const args = process.argv.slice(2);
    
    // Parse arguments and flags
    const flags = {
        dryRun: args.includes('--dry-run'),
        lang: (args.find(a => a.startsWith('--lang='))?.split('=')[1] || 'hu') as 'hu' | 'en',
        tags: args.find(a => a.startsWith('--tags='))?.split('=')[1]?.split(',').map(t => t.trim()) || [],
        cover: args.find(a => a.startsWith('--cover='))?.split('=')[1],
        pdf: args.find(a => a.startsWith('--pdf='))?.split('=')[1],
        youtube: args.find(a => a.startsWith('--youtube='))?.split('=')[1],
    };

    // Filter out options from main positional arguments
    const positionalArgs = args.filter(a => !a.startsWith('--'));

    if (positionalArgs.length < 3) {
        showUsage();
        process.exit(1);
    }

    const docxPath = path.resolve(positionalArgs[0]);
    const issueTitle = positionalArgs[1];
    const issueNumber = parseInt(positionalArgs[2], 10);
    const publishedAt = positionalArgs[3] || new Date().toISOString().split('T')[0];

    if (isNaN(issueNumber)) {
        console.error('Hiba: A lapszám sorszáma érvényes szám kell legyen!');
        process.exit(1);
    }

    if (!fs.existsSync(docxPath)) {
        console.error(`Hiba: A megadott Word fájl nem található: ${docxPath}`);
        process.exit(1);
    }

    console.log(`\nFeldolgozás indítása: ${docxPath}`);
    console.log(`Lapszám: "${issueTitle}" (#${issueNumber}) | Dátum: ${publishedAt}`);
    console.log(`Nyelv: ${flags.lang.toUpperCase()} | Dry-run: ${flags.dryRun ? 'IGEN' : 'NEM'}\n`);

    try {
        // 1. DOCX to HTML conversion via mammoth with paragraph alignment preservation
        console.log('1. Word dokumentum HTML-lé alakítása (mammoth)...');
        const mammothResult = await mammoth.convertToHtml(
            { path: docxPath },
            {
                transformDocument: (mammoth as any).transforms?.paragraph ? (mammoth as any).transforms.paragraph((paragraph: any) => {
                    if (paragraph.alignment === 'center') {
                        return {
                            ...paragraph,
                            styleName: paragraph.styleName ? `${paragraph.styleName} (Centered)` : 'Centered'
                        };
                    }
                    if (paragraph.alignment === 'right') {
                        return {
                            ...paragraph,
                            styleName: paragraph.styleName ? `${paragraph.styleName} (Right)` : 'Right'
                        };
                    }
                    if (paragraph.alignment === 'justify') {
                        return {
                            ...paragraph,
                            styleName: paragraph.styleName ? `${paragraph.styleName} (Justify)` : 'Justify'
                        };
                    }
                    return paragraph;
                }) : undefined,
                styleMap: [
                    "p[style-name$='(Centered)'] => p.text-center:fresh",
                    "p[style-name='Centered'] => p.text-center:fresh",
                    "p[style-name='Center'] => p.text-center:fresh",
                    "p[style-name='Középre zárt'] => p.text-center:fresh",
                    "p[style-name='Középre igazított'] => p.text-center:fresh",
                    "p[style-name='Középre'] => p.text-center:fresh",
                    "p[style-name$='(Right)'] => p.text-right:fresh",
                    "p[style-name='Right'] => p.text-right:fresh",
                    "p[style-name='Jobbra zárt'] => p.text-right:fresh",
                    "p[style-name='Jobbra'] => p.text-right:fresh",
                    "p[style-name$='(Justify)'] => p.text-justify:fresh",
                    "p[style-name='Justify'] => p.text-justify:fresh",
                    "p[style-name='Sorkizárt'] => p.text-justify:fresh",
                ]
            }
        );
        const rawHtml = mammothResult.value;
        
        if (mammothResult.messages.length > 0) {
            console.log('Mammoth üzenetek/figyelmeztetések:', mammothResult.messages);
        }

        // 2. Semantic Cleaning via cheerio
        console.log('2. Szemantikai tisztítás (szövegek átalakítása <h2>-vé)...');
        const $ = cheerio.load(rawHtml);

        // A. Strip inconsistent whitespace and indents
        cleanWhitespace($);

        // B. Convert list items starting with numbers and styled bold to H2 (split lists)
        splitListsWithHeadings($);

        // C. Convert bold paragraphs to H2
        convertParagraphsToHeadings($);

        const cleanedHtml = $('body').html() || '';

        // Initialize Sanity Client / Uploader
        const projectId = process.env.SANITY_PROJECT_ID || 'ijflvzga';
        const dataset = process.env.SANITY_DATASET || 'production';
        const token = process.env.SANITY_WRITE_TOKEN || '';

        if (!flags.dryRun && !token) {
            console.error('Hiba: A feltöltéshez meg kell adnod a SANITY_WRITE_TOKEN-t a .env fájlban!');
            process.exit(1);
        }

        const uploader = new SanityUploader({
            projectId,
            dataset,
            token,
            dryRun: flags.dryRun
        });

        // Fetch existing authors
        console.log('Meglévő szerzők lekérése...');
        const existingAuthorsSet = await uploader.fetchAllAuthors();

        // 3. Splitting Articles by <h1> tags
        console.log('3. Cikkek darabolása <h1> tagek mentén...');
        const $clean = cheerio.load(cleanedHtml);
        const parsedArticles: Array<{ title: string; authorName: string; subtitle?: string; scripture?: string; htmlContent: string }> = [];
        
        let currentArticle: { title: string; authorName: string; subtitle?: string; scripture?: string; contentNodes: string[]; skipNodes: Set<any> } | null = null;
        
        $clean('body').contents().each((_, node) => {
            const $node = $clean(node);
            
            if (node.type === 'tag' && node.name === 'h1') {
                // Save previous article if exists
                if (currentArticle) {
                    parsedArticles.push({
                        title: currentArticle.title,
                        authorName: currentArticle.authorName,
                        subtitle: currentArticle.subtitle,
                        scripture: currentArticle.scripture,
                        htmlContent: currentArticle.contentNodes.join('')
                    });
                }
                
                const title = $node.text().trim();
                
                // Get sibling elements after the h1 to extract metadata
                const siblings: any[] = [];
                let cur = node.nextSibling;
                while (cur && siblings.length < 4) {
                    if (cur.type === 'tag') {
                        siblings.push(cur);
                    } else if (cur.type === 'text') {
                        if ($(cur).text().trim()) {
                            siblings.push(cur);
                        }
                    }
                    cur = cur.nextSibling;
                }
                
                let authorName = '';
                let subtitle = '';
                let scripture = '';
                const skipNodes = new Set<any>();
                
                let i = 0;
                while (i < siblings.length) {
                    const sib = siblings[i];
                    const text = $(sib).text().trim();
                    const tagName = sib.type === 'tag' ? sib.name.toLowerCase() : '';
                    
                    if (isScriptureReference(text)) {
                        scripture = text;
                        skipNodes.add(sib);
                        i++;
                        continue;
                    }
                    
                    if (tagName === 'h2' && !subtitle) {
                        subtitle = text;
                        skipNodes.add(sib);
                        i++;
                        continue;
                    }
                    
                    if (!authorName && isLikelyAuthor(text, existingAuthorsSet)) {
                        authorName = text;
                        skipNodes.add(sib);
                        i++;
                        continue;
                    }
                    
                    // Fallback to first short paragraph as author if none found yet
                    if (!authorName && text.length < 40 && !/^\d+\./.test(text)) {
                        authorName = text;
                        skipNodes.add(sib);
                        i++;
                        continue;
                    }
                    
                    break; // Start of content
                }
                
                currentArticle = {
                    title,
                    authorName: authorName || 'Ismeretlen szerző',
                    subtitle: subtitle || undefined,
                    scripture: scripture || undefined,
                    contentNodes: [],
                    skipNodes
                };
            } else {
                if (currentArticle) {
                    if (currentArticle.skipNodes.has(node)) {
                        return;
                    }
                    
                    const outerHtml = $clean.html(node);
                    currentArticle.contentNodes.push(outerHtml);
                }
            }
        });
        
        // Save last article
        const lastArticle = currentArticle as any;
        if (lastArticle) {
            parsedArticles.push({
                title: lastArticle.title,
                authorName: lastArticle.authorName,
                subtitle: lastArticle.subtitle,
                scripture: lastArticle.scripture,
                htmlContent: lastArticle.contentNodes.join('')
            });
        }

        console.log(`Sikeresen találtunk ${parsedArticles.length} db cikket.\n`);

        if (parsedArticles.length === 0) {
            console.warn('Figyelem: Nem található <h1> tag a dokumentumban, így nem tudtuk cikkekre bontani.');
            process.exit(0);
        }

        // 4. Processing Tags
        console.log('4. Címkék feldolgozása...');
        const resolvedTagIds: string[] = [];
        for (const tagTitle of flags.tags) {
            const tagId = await uploader.getOrCreateTag(tagTitle);
            resolvedTagIds.push(tagId);
        }

        // 5. Processing Articles and converting to Portable Text
        console.log('\n5. Cikkek konvertálása és feltöltése...');
        const articleIds: string[] = [];
        for (let i = 0; i < parsedArticles.length; i++) {
            const art = parsedArticles[i];
            console.log(`[${i + 1}/${parsedArticles.length}] Cikk: "${art.title}" (Szerző: ${art.authorName}, Alcím: ${art.subtitle || 'nincs'}, Alapige: ${art.scripture || 'nincs'})`);
            
            // Convert clean HTML to Portable Text
            const contentBlocks = htmlToPortableText(art.htmlContent);
            
            // Upload article
            const articleId = await uploader.createArticle({
                title: art.title,
                authorName: art.authorName,
                subtitle: art.subtitle,
                scripture: art.scripture,
                content: contentBlocks,
                language: flags.lang
            }, resolvedTagIds);
            
            articleIds.push(articleId);
        }

        // 6. Creating the Issue
        console.log('\n6. Lapszám (Issue) dokumentum létrehozása...');
        const issueId = await uploader.createIssue({
            title: issueTitle,
            issueNumber,
            publishedAt,
            coverImageUrl: flags.cover,
            pdfUrl: flags.pdf,
            youtubeUrl: flags.youtube
        }, articleIds);

        console.log(`\n=========================================`);
        console.log(`MIGRÁCIÓ SIKERESEN BEFEJEZŐDÖTT!`);
        console.log(`Lapszám ID: ${issueId}`);
        console.log(`Feltöltött cikkek száma: ${articleIds.length} db`);
        console.log(`=========================================\n`);

    } catch (error) {
        console.error('Súlyos hiba történt a migráció során:', error);
        process.exit(1);
    }
}

main();
