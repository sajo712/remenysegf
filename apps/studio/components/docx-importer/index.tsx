import React, { useState, useRef } from 'react';
import { useClient } from 'sanity';
import * as mammoth from 'mammoth';
import {
    Card,
    Container,
    Box,
    Stack,
    Heading,
    Text,
    Button,
    TextInput,
    Select,
    Label,
    Spinner,
    Flex
} from '@sanity/ui';
import { BookIcon } from '@sanity/icons/Book';
import { DocumentIcon } from '@sanity/icons/Document';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle';
import { ErrorOutlineIcon } from '@sanity/icons/ErrorOutline';
import { TrashIcon } from '@sanity/icons/Trash';
import { htmlToPortableText } from './html-to-portable-text';
import { SanityUploader } from './sanity-uploader';

const generateKey = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

function cleanWhitespace(doc: Document) {
    const elements = doc.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
    elements.forEach(el => {
        const trimLeft = (node: Node): boolean => {
            if (!node) return false;
            if (node.nodeType === Node.TEXT_NODE) {
                const val = node.textContent || '';
                const newVal = val.replace(/^[ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g, '');
                node.textContent = newVal;
                if (newVal.length > 0) return true;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const children = Array.from(node.childNodes);
                for (const child of children) {
                    if (trimLeft(child)) return true;
                }
            }
            return false;
        };
        
        const trimRight = (node: Node): boolean => {
            if (!node) return false;
            if (node.nodeType === Node.TEXT_NODE) {
                const val = node.textContent || '';
                const newVal = val.replace(/[ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/g, '');
                node.textContent = newVal;
                if (newVal.length > 0) return true;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const children = Array.from(node.childNodes);
                for (let i = children.length - 1; i >= 0; i--) {
                    if (trimRight(children[i])) return true;
                }
            }
            return false;
        };
        
        const children = Array.from(el.childNodes);
        for (const child of children) {
            if (trimLeft(child)) break;
        }
        
        for (let i = children.length - 1; i >= 0; i--) {
            if (trimRight(children[i])) break;
        }
        
        Array.from(el.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE && (child.textContent === '' || child.textContent === null)) {
                child.parentNode?.removeChild(child);
            }
        });
    });

    // Post-whitespace: Replace elements that are just stars, or strip trailing stars and insert hr
    const elementsToClean = doc.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
    elementsToClean.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (/^\s*(\*\s*){3,}$/.test(text) || text === '***') {
            const hr = doc.createElement('hr');
            el.parentNode?.replaceChild(hr, el);
        } else if (/(?:\s*\*\s*){3,}$/.test(text)) {
            const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            const textNodes: Text[] = [];
            let currentNode = walker.nextNode();
            while (currentNode) {
                textNodes.push(currentNode as Text);
                currentNode = walker.nextNode();
            }
            for (let i = textNodes.length - 1; i >= 0; i--) {
                const node = textNodes[i];
                const val = node.nodeValue || '';
                if (/^[\s*]+$/.test(val)) {
                    node.nodeValue = '';
                } else if (/[\s*]+$/.test(val)) {
                    node.nodeValue = val.replace(/(?:\s*\*\s*){3,}$/, '').replace(/[\s*]+$/, '');
                    break;
                } else {
                    break;
                }
            }
            const hr = doc.createElement('hr');
            el.after(hr);
        }
    });
}

function shouldBeH3(el: HTMLElement): boolean {
    const text = el.textContent?.trim() || '';
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

function isMostlyBold(el: HTMLElement): boolean {
    const text = el.textContent?.trim() || '';
    if (!text) return false;
    
    let boldText = '';
    el.querySelectorAll('strong, b').forEach(boldEl => {
        boldText += boldEl.textContent + ' ';
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

function shouldBeH2(el: HTMLElement): boolean {
    const text = el.textContent?.trim() || '';
    if (text.length > 150) {
        return false;
    }
    if (!/^\d+\.\s+/.test(text)) {
        return false;
    }
    return isMostlyBold(el);
}

function isEntirelyBold(el: HTMLElement): boolean {
    const text = el.textContent?.trim() || '';
    if (!text || text.length > 150) {
        return false;
    }
    
    let boldText = '';
    el.querySelectorAll('strong, b').forEach(boldEl => {
        boldText += boldEl.textContent + ' ';
    });
    boldText = boldText.trim();
    
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const cleanBoldText = boldText.replace(/\s+/g, ' ').trim();
    
    return cleanBoldText === cleanText;
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

function getListItemPrefix(el: HTMLElement): string {
    const text = el.textContent?.trim() || '';
    if (/^\d+(\.\d+)*\.\s+/.test(text) || /^[a-zA-Z]\.\s+/.test(text)) {
        return '';
    }
    
    const parent = el.parentNode as HTMLElement;
    if (parent && parent.tagName.toLowerCase() === 'ol') {
        const siblings = Array.from(parent.children) as HTMLElement[];
        const index = siblings.indexOf(el);
        if (index === -1) return '';
        
        const startAttr = parent.getAttribute('start');
        const start = startAttr ? parseInt(startAttr, 10) : 1;
        const value = start + index;
        
        const type = parent.getAttribute('type') || '1';
        
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

function getListItemHeadingType(el: HTMLElement): 'h2' | 'h3' | null {
    const text = el.textContent?.trim() || '';
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
        if (shouldBeH2(el)) {
            return 'h2';
        }
    }
    
    const isBold = isEntirelyBold(el) || isMostlyBold(el);
    if (isBold) {
        const parent = el.parentNode as HTMLElement;
        if (parent && parent.tagName.toLowerCase() === 'ol') {
            const type = parent.getAttribute('type');
            if (type === 'a' || type === 'A') {
                return 'h3';
            }
            return 'h2';
        }
    }
    
    return null;
}

function splitListsWithHeadings(doc: Document) {
    const lists = doc.querySelectorAll('ol, ul');
    lists.forEach(list => {
        const listTagName = list.tagName.toLowerCase();
        const items = Array.from(list.children) as HTMLElement[];
        
        let hasHeading = false;
        for (const item of items) {
            if (getListItemHeadingType(item) !== null) {
                hasHeading = true;
                break;
            }
        }
        
        if (!hasHeading) return;
        
        const parent = list.parentNode;
        if (!parent) return;
        
        let currentList = doc.createElement(listTagName);
        
        for (const item of items) {
            const headingType = getListItemHeadingType(item);
            if (headingType !== null) {
                if (currentList.children.length > 0) {
                    parent.insertBefore(currentList, list);
                    currentList = doc.createElement(listTagName);
                }
                const h = doc.createElement(headingType);
                const prefix = getListItemPrefix(item);
                h.textContent = prefix + (item.textContent?.trim() || '');
                parent.insertBefore(h, list);
            } else {
                currentList.appendChild(item.cloneNode(true));
            }
        }
        
        if (currentList.children.length > 0) {
            parent.insertBefore(currentList, list);
        }
        
        parent.removeChild(list);
    });
}

function convertParagraphsToHeadings(doc: Document) {
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
        if (shouldBeH3(p)) {
            const h3 = doc.createElement('h3');
            h3.textContent = p.textContent?.trim() || '';
            p.parentNode?.replaceChild(h3, p);
            return;
        }
        if (shouldBeH2(p)) {
            const h2 = doc.createElement('h2');
            h2.textContent = p.textContent?.trim() || '';
            p.parentNode?.replaceChild(h2, p);
            return;
        }
        if (isEntirelyBold(p)) {
            const h2 = doc.createElement('h2');
            h2.textContent = p.textContent?.trim() || '';
            p.parentNode?.replaceChild(h2, p);
            return;
        }
    });
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

/**
 * Checks if the filename contains "rf" followed by a number (denoting a magazine issue).
 */
function isRfIssueFilename(filename: string): boolean {
    const name = filename.toLowerCase();
    // Matches e.g. "rf-54", "RF 54", "rf07", "rf_12", "rf54", etc.
    const rfPattern = /(^|[\s_.-])rf[\s_.-]*\d+/i;
    return rfPattern.test(name) || /rf\d+/i.test(name);
}

export type ImportTargetType = 'issue' | 'standaloneArticle' | 'standaloneBook';

export const DocxImporter: React.FC = () => {
    const client = useClient({ apiVersion: '2026-05-31' });
    
    // Import Target Mode
    const [importTarget, setImportTarget] = useState<ImportTargetType>('issue');
    const [detectedAsStandalone, setDetectedAsStandalone] = useState(false);

    // Form States
    const [file, setFile] = useState<File | null>(null);
    
    // Issue Specific States
    const [issueTitle, setIssueTitle] = useState('');
    const [issueNumber, setIssueNumber] = useState('');
    const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().split('T')[0]);
    const [language, setLanguage] = useState<'hu' | 'en'>('hu');
    const [issueType, setIssueType] = useState<'regular' | 'special'>('regular');
    
    // Standalone Article / Book States
    const [standaloneTitle, setStandaloneTitle] = useState('');
    const [standaloneSubtitle, setStandaloneSubtitle] = useState('');
    const [standaloneScripture, setStandaloneScripture] = useState('');
    const [standaloneAuthor, setStandaloneAuthor] = useState('');

    // Attachments (Cover image, PDF file, YouTube audio/video)
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');

    // Status States
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [errorStack, setErrorStack] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [successType, setSuccessType] = useState<string>('issue');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    /**
     * Sentence casing: Capitalize the first letter and keep the rest lowercase.
     */
    const toHungarianSentenceCase = (input: string): string => {
        const trimmed = input.trim();
        if (!trimmed) return '';
        const lower = trimmed.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    const slugify = (input: string) =>
        input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .slice(0, 96);

    const processSelectedFile = (selectedFile: File) => {
        setFile(selectedFile);
        
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "").trim();
        const isRf = isRfIssueFilename(selectedFile.name);

        if (isRf) {
            setImportTarget('issue');
            setDetectedAsStandalone(false);
            
            const numMatch = nameWithoutExt.match(/\d+/);
            if (numMatch) {
                const num = parseInt(numMatch[0], 10);
                setIssueNumber(String(num));
                setIssueTitle(`RF-${num}`);
            } else {
                setIssueTitle(nameWithoutExt);
            }
        } else {
            // Standalone document detected (does not contain RF + number)
            setImportTarget('standaloneArticle');
            setDetectedAsStandalone(true);
            setStandaloneTitle(nameWithoutExt.replace(/[-_]+/g, ' '));
        }
    };

    const handleFiles = (files: FileList | File[] | null) => {
        if (!files) return;
        
        const unrecognizedFiles: string[] = [];
        
        Array.from(files).forEach((selectedFile) => {
            const name = selectedFile.name.toLowerCase();
            const type = selectedFile.type;
            
            if (name.endsWith('.docx')) {
                processSelectedFile(selectedFile);
            } else if (name.endsWith('.pdf') || type === 'application/pdf') {
                setPdfFile(selectedFile);
            } else if (
                type.startsWith('image/') || 
                name.endsWith('.png') || 
                name.endsWith('.jpg') || 
                name.endsWith('.jpeg') || 
                name.endsWith('.webp') || 
                name.endsWith('.gif')
            ) {
                setCoverFile(selectedFile);
            } else {
                unrecognizedFiles.push(selectedFile.name);
            }
        });
        
        if (unrecognizedFiles.length > 0) {
            alert(`A következő fájlokat nem sikerült szétválogatni (nem támogatott kiterjesztés): ${unrecognizedFiles.join(', ')}. Csak .docx, .pdf és képfájlok tölthetők fel.`);
        }
    };

    const handleMergedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleMergedDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.startsWith('image/')) {
                setCoverFile(selectedFile);
            } else {
                alert('Csak képfájlok tölthetők fel a borítóképhez!');
            }
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
                setPdfFile(selectedFile);
            } else {
                alert('Csak PDF fájlok tölthetők fel a letölthető dokumentumhoz!');
            }
        }
    };

    // -------------------------------------------------------------
    // Main Import Trigger
    // -------------------------------------------------------------
    const triggerImport = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setErrorStack(null);
        setSuccessId(null);
        setLogs([]);

        const uploader = new SanityUploader(client, addLog);

        const reader = new FileReader();

        reader.onerror = () => {
            setError('Fájl olvasási hiba történt.');
            setIsProcessing(false);
        };

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;

                // 1. Mammoth Conversion
                addLog('1. Word (.docx) fájl konvertálása HTML-lé...');
                const conversionResult = await mammoth.convertToHtml({ arrayBuffer });
                const rawHtml = conversionResult.value;

                // 2. DOM Parser & Cleanups
                addLog('2. Szemantikai tisztítások és formázások javítása...');
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHtml, 'text/html');

                cleanWhitespace(doc);

                // Typo Cleanup: Sibling citation merging
                const paragraphsAndLists = Array.from(doc.querySelectorAll('p, li'));
                let mergedCitesCount = 0;
                paragraphsAndLists.forEach((el, idx) => {
                    const text = el.textContent?.trim() || '';
                    if (text.startsWith('(') && text.endsWith(')') && idx > 0) {
                        const prevEl = paragraphsAndLists[idx - 1] as HTMLElement;
                        if (prevEl) {
                            prevEl.innerHTML = prevEl.innerHTML.trim() + ' ' + el.innerHTML.trim();
                            el.remove();
                            mergedCitesCount++;
                        }
                    }
                });
                if (mergedCitesCount > 0) {
                    addLog(`[Tisztítás] ${mergedCitesCount} db leszakadt idézet-hivatkozás összevonva az előtte álló sorral.`);
                }

                splitListsWithHeadings(doc);
                convertParagraphsToHeadings(doc);

                // Extract Footnotes
                addLog('3. Lábjegyzetek kinyerése a dokumentumból...');
                const footnotesMap: Record<string, string> = {};
                const footnoteElements = doc.querySelectorAll('[id^="_ftn"], [id^="footnote"], [id^="fn-"]');
                footnoteElements.forEach(el => {
                    const id = el.getAttribute('id');
                    if (id && !id.includes('ref')) {
                        const links = el.querySelectorAll('a');
                        links.forEach(l => l.remove());
                        const text = el.textContent?.trim() || '';
                        if (text) {
                            footnotesMap[id] = text;
                        }
                        el.remove();
                    }
                });
                const ftnCount = Object.keys(footnotesMap).length;
                if (ftnCount > 0) {
                    addLog(`Sikeresen kinyerve: ${ftnCount} db lábjegyzet.`);
                }

                // Helper to build structured footnotes for a given HTML slice
                const processFootnotesAndLinks = (htmlContent: string) => {
                    const artParser = new DOMParser();
                    const artDoc = artParser.parseFromString(htmlContent, 'text/html');
                    const links = Array.from(artDoc.querySelectorAll('a'));
                    
                    const articleFootnotes: Array<{ _key: string; _type: string; number: string; text: string; anchorId: string }> = [];
                    let footnoteCount = 0;
                    const ftnIdMapping: Record<string, string> = {};
                    
                    links.forEach(link => {
                        const href = link.getAttribute('href') || '';
                        if (href.startsWith('#_ftn') || href.includes('footnote') || href.startsWith('#fn-') || href.startsWith('#fn')) {
                            const originalFtnId = href.substring(1);
                            const noteText = footnotesMap[originalFtnId];
                            if (noteText) {
                                let newFtnId = ftnIdMapping[originalFtnId];
                                if (!newFtnId) {
                                    footnoteCount++;
                                    newFtnId = `footnote-${footnoteCount}`;
                                    ftnIdMapping[originalFtnId] = newFtnId;
                                    
                                    articleFootnotes.push({
                                        _key: generateKey(),
                                        _type: 'footnoteItem',
                                        number: String(footnoteCount),
                                        text: noteText,
                                        anchorId: newFtnId
                                    });
                                }
                                link.setAttribute('href', `#${newFtnId}`);
                                link.textContent = String(footnoteCount);
                            }
                        }
                    });
                    
                    return {
                        rewrittenHtml: artDoc.body.innerHTML,
                        articleFootnotes
                    };
                };

                // Optional asset uploads
                let coverAssetId: string | undefined = undefined;
                let pdfAssetId: string | undefined = undefined;

                if (coverFile) {
                    addLog(`[Feltöltés] Borítókép feltöltése...`);
                    coverAssetId = await uploader.uploadAsset('image', coverFile, coverFile.name);
                }
                if (pdfFile) {
                    addLog(`[Feltöltés] PDF fájl feltöltése...`);
                    pdfAssetId = await uploader.uploadAsset('file', pdfFile, pdfFile.name);
                }

                // =========================================================
                // CASE A: STANDALONE BOOK IMPORT (Könyv / Önálló füzet)
                // =========================================================
                if (importTarget === 'standaloneBook') {
                    addLog('4. Önálló könyv / füzet feldolgozása...');
                    
                    let finalTitle = standaloneTitle.trim();
                    const firstH1 = doc.querySelector('h1');
                    if (!finalTitle && firstH1) {
                        finalTitle = toHungarianSentenceCase(firstH1.textContent || '');
                        firstH1.remove();
                    } else if (firstH1 && firstH1.textContent?.trim().toLowerCase() === finalTitle.toLowerCase()) {
                        firstH1.remove(); // Remove duplicate title from content
                    }
                    if (!finalTitle) {
                        finalTitle = file.name.replace(/\.[^/.]+$/, "").trim();
                    }

                    const { rewrittenHtml } = processFootnotesAndLinks(doc.body.innerHTML);
                    const content = await htmlToPortableText(rewrittenHtml, client, addLog);

                    const bookSlug = slugify(finalTitle);
                    const existingBookId = await uploader.checkExistingStandaloneBook(finalTitle, bookSlug);

                    const bookData = {
                        title: finalTitle,
                        subtitle: standaloneSubtitle.trim() || undefined,
                        youtubeUrl: youtubeUrl.trim() || undefined,
                        coverAssetId,
                        pdfAssetId,
                        content
                    };

                    let finalBookId: string;
                    if (existingBookId) {
                        const confirmed = window.confirm(`Ezzel a címmel vagy sluggal ("${finalTitle}") már létezik önálló könyv/füzet. Szeretnéd felülírni?`);
                        if (!confirmed) {
                            addLog('Feltöltés megszakítva a felhasználó által.');
                            setIsProcessing(false);
                            return;
                        }
                        await uploader.updateStandaloneBook(existingBookId, bookData);
                        finalBookId = existingBookId;
                    } else {
                        finalBookId = await uploader.createStandaloneBook(bookData);
                    }

                    addLog(`KÉSZ! Önálló könyv/füzet sikeresen elkészítve. ID: ${finalBookId}`);
                    setSuccessId(finalBookId);
                    setSuccessType('standaloneBook');
                    setIsProcessing(false);
                    return;
                }

                // =========================================================
                // CASE B: STANDALONE ARTICLE IMPORT (Önálló cikk)
                // =========================================================
                if (importTarget === 'standaloneArticle') {
                    addLog('4. Önálló cikk feldolgozása...');
                    
                    const existingAuthorsSet = await uploader.fetchAllAuthors();
                    let finalTitle = standaloneTitle.trim();
                    let autoAuthor = standaloneAuthor.trim();
                    let autoSubtitle = standaloneSubtitle.trim();
                    let autoScripture = standaloneScripture.trim();

                    const firstH1 = doc.querySelector('h1');
                    if (firstH1) {
                        if (!finalTitle) {
                            finalTitle = toHungarianSentenceCase(firstH1.textContent || '');
                        }

                        // Inspect sibling nodes for metadata
                        const siblings: Node[] = [];
                        let cur = firstH1.nextSibling;
                        while (cur && siblings.length < 4) {
                            if (cur.nodeType === Node.ELEMENT_NODE) {
                                siblings.push(cur);
                            } else if (cur.nodeType === Node.TEXT_NODE && cur.textContent?.trim()) {
                                siblings.push(cur);
                            }
                            cur = cur.nextSibling;
                        }

                        siblings.forEach(sib => {
                            const text = sib.textContent?.trim() || '';
                            if (isScriptureReference(text) && !autoScripture) {
                                autoScripture = text.slice(1, -1).trim();
                                sib.parentNode?.removeChild(sib);
                            } else if (!autoAuthor && isLikelyAuthor(text, existingAuthorsSet)) {
                                autoAuthor = text;
                                sib.parentNode?.removeChild(sib);
                            }
                        });

                        firstH1.remove();
                    }

                    if (!finalTitle) {
                        finalTitle = file.name.replace(/\.[^/.]+$/, "").trim();
                    }

                    const { rewrittenHtml, articleFootnotes } = processFootnotesAndLinks(doc.body.innerHTML);
                    const content = await htmlToPortableText(rewrittenHtml, client, addLog);

                    const artSlug = slugify(finalTitle);
                    const existingArtId = await uploader.checkExistingArticleBySlug(artSlug, finalTitle);

                    const articleData = {
                        title: finalTitle,
                        authorName: autoAuthor || undefined,
                        subtitle: autoSubtitle || undefined,
                        scripture: autoScripture || undefined,
                        content,
                        language,
                        footnotes: articleFootnotes.length > 0 ? articleFootnotes : undefined,
                    };

                    let finalArticleId: string;
                    if (existingArtId) {
                        const confirmed = window.confirm(`Ezzel a címmel vagy sluggal ("${finalTitle}") már létezik cikk. Szeretnéd felülírni?`);
                        if (!confirmed) {
                            addLog('Feltöltés megszakítva a felhasználó által.');
                            setIsProcessing(false);
                            return;
                        }
                        await uploader.updateArticle(existingArtId, articleData);
                        finalArticleId = existingArtId;
                    } else {
                        finalArticleId = await uploader.createArticle(articleData);
                    }

                    addLog(`KÉSZ! Önálló cikk sikeresen feltöltve. ID: ${finalArticleId}`);
                    setSuccessId(finalArticleId);
                    setSuccessType('article');
                    setIsProcessing(false);
                    return;
                }

                // =========================================================
                // CASE C: ISSUE IMPORT (Lapszám és cikkek - default RF flow)
                // =========================================================
                if (!issueTitle) {
                    alert('A lapszám címe kötelező!');
                    setIsProcessing(false);
                    return;
                }
                if (!issueNumber || isNaN(parseInt(issueNumber, 10))) {
                    alert('Kérlek, adj meg egy érvényes sorszámot!');
                    setIsProcessing(false);
                    return;
                }

                addLog('4. Meglévő lapszám ellenőrzése a Sanity-ben...');
                const num = parseInt(issueNumber, 10);
                
                let existingIssueId: string | undefined = undefined;
                let existingArticles: Array<{ _id: string; title: string; slug: string }> = [];
                
                try {
                    const existing = await uploader.checkExistingIssue(issueTitle, num, issueType);
                    if (existing) {
                        const confirmMsg = `Ezzel a címmel ("${issueTitle}") vagy sorszámmal (${num}) már létezik lapszám a Sanity-ben.\n\nSzeretnéd felülírni a meglévő lapszámot és frissíteni a cikkeket?`;
                        const confirmed = window.confirm(confirmMsg);
                        if (!confirmed) {
                            addLog('Feltöltés megszakítva a felhasználó által.');
                            setIsProcessing(false);
                            return;
                        }
                        existingIssueId = existing.id;
                        existingArticles = existing.articles;
                    }
                } catch (checkErr) {
                    addLog(`Figyelmeztetés: Nem sikerült ellenőrizni a létező lapszámot: ${String(checkErr)}`);
                }
                
                const isNewIssue = !existingIssueId;
                const issueId = existingIssueId || `issue-${generateKey()}`;

                const existingAuthorsSet = await uploader.fetchAllAuthors();

                // Multi-article H1 splitting
                const articles: Array<{ title: string; authorName?: string; subtitle?: string; scripture?: string; htmlContent: string }> = [];
                let currentArticle: { title: string; authorName?: string; subtitle?: string; scripture?: string; contentNodes: Node[]; skipNodes: Set<Node> } | null = null;
                
                const bodyNodes = Array.from(doc.body.childNodes);
                bodyNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        const tagName = element.tagName.toLowerCase();
                        
                        if (tagName === 'h1') {
                            if (currentArticle) {
                                const tempDiv = doc.createElement('div');
                                currentArticle.contentNodes.forEach(n => tempDiv.appendChild(n.cloneNode(true)));
                                articles.push({
                                    title: currentArticle.title,
                                    authorName: currentArticle.authorName,
                                    subtitle: currentArticle.subtitle,
                                    scripture: currentArticle.scripture,
                                    htmlContent: tempDiv.innerHTML
                                });
                            }
                            
                            const title = toHungarianSentenceCase(element.textContent || '');
                            
                            const siblings: Node[] = [];
                            let cur = element.nextSibling;
                            while (cur && siblings.length < 4) {
                                if (cur.nodeType === Node.ELEMENT_NODE) {
                                    siblings.push(cur);
                                } else if (cur.nodeType === Node.TEXT_NODE && cur.textContent?.trim()) {
                                    siblings.push(cur);
                                }
                                cur = cur.nextSibling;
                            }
                            
                            let authorName = '';
                            let subtitle = '';
                            let scripture = '';
                            const skipNodesSet = new Set<Node>();
                            
                            let j = 0;
                            while (j < siblings.length) {
                                const sib = siblings[j];
                                const text = sib.textContent?.trim() || '';
                                const siblingTagName = sib.nodeType === Node.ELEMENT_NODE ? (sib as HTMLElement).tagName.toLowerCase() : '';
                                
                                if (isScriptureReference(text)) {
                                    scripture = text.trim().slice(1, -1).trim();
                                    skipNodesSet.add(sib);
                                    j++;
                                    continue;
                                }
                                
                                if (siblingTagName === 'h2' && !subtitle) {
                                    subtitle = text;
                                    skipNodesSet.add(sib);
                                    j++;
                                    continue;
                                }

                                const isQuoted = /^[„"”?''??»«]/.test(text);
                                if (isQuoted) {
                                    const scriptureMatch = text.match(/\(([^)]+)\)$/);
                                    if (scriptureMatch && text.length < 150) {
                                        subtitle = text.replace(/\s*\([^)]+\)$/, '').trim();
                                        scripture = scriptureMatch[1].trim();
                                        skipNodesSet.add(sib);
                                        j++;
                                        continue;
                                    }
                                    break;
                                }
                                
                                if (!authorName && isLikelyAuthor(text, existingAuthorsSet)) {
                                    authorName = text;
                                    skipNodesSet.add(sib);
                                    j++;
                                    continue;
                                }
                                
                                if (!authorName && text.length < 40 && !/^\d+\./.test(text)) {
                                    authorName = text;
                                    skipNodesSet.add(sib);
                                    j++;
                                    continue;
                                }
                                
                                break;
                            }
                            
                            currentArticle = {
                                title,
                                authorName: authorName || undefined,
                                subtitle: subtitle || undefined,
                                scripture: scripture || undefined,
                                contentNodes: [],
                                skipNodes: skipNodesSet
                            };
                            
                        } else {
                            if (currentArticle) {
                                const skipSet = (currentArticle as any).skipNodes as Set<Node>;
                                if (!skipSet || !skipSet.has(element)) {
                                    currentArticle.contentNodes.push(element);
                                }
                            }
                        }
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        if (currentArticle) {
                            const skipSet = (currentArticle as any).skipNodes as Set<Node>;
                            if (!skipSet || !skipSet.has(node)) {
                                if (node.textContent?.trim()) {
                                    currentArticle.contentNodes.push(node);
                                }
                            }
                        }
                    }
                });
                
                if (currentArticle) {
                    const tempDiv = doc.createElement('div');
                    (currentArticle as any).contentNodes.forEach((n: any) => tempDiv.appendChild(n.cloneNode(true)));
                    articles.push({
                        title: (currentArticle as any).title,
                        authorName: (currentArticle as any).authorName,
                        subtitle: (currentArticle as any).subtitle,
                        scripture: (currentArticle as any).scripture,
                        htmlContent: tempDiv.innerHTML
                    });
                }

                addLog(`Sikeresen felosztva: ${articles.length} db cikk.`);
                
                if (articles.length === 0) {
                    throw new Error('Nem található <h1> címsor a dokumentumban a lapszám cikkeinek felosztásához.');
                }

                // Save Issue document
                addLog('5. Lapszám (Issue) dokumentum mentése/létrehozása...');
                const numVal = parseInt(issueNumber, 10);
                const finalIssueId = await uploader.createIssue({
                    title: issueTitle,
                    issueNumber: numVal,
                    publishedAt,
                    issueType,
                    coverAssetId,
                    pdfAssetId,
                    youtubeUrl: youtubeUrl || undefined
                }, issueId, isNewIssue);

                // Upload Articles
                addLog('6. Cikkek konvertálása és feltöltése a Sanity-be...');
                for (let i = 0; i < articles.length; i++) {
                    const art = articles[i];
                    addLog(`[Cikk ${i+1}/${articles.length}] "${art.title}"`);
                    
                    const { rewrittenHtml, articleFootnotes } = processFootnotesAndLinks(art.htmlContent);
                    const content = await htmlToPortableText(rewrittenHtml, client, addLog);

                    const artSlug = slugify(art.title);
                    const existingArt = existingArticles.find(
                        a => a.slug === artSlug || a.title.toLowerCase() === art.title.toLowerCase()
                    );
                    
                    const articleData = {
                        title: art.title,
                        authorName: art.authorName,
                        subtitle: art.subtitle,
                        scripture: art.scripture,
                        content,
                        language,
                        footnotes: articleFootnotes.length > 0 ? articleFootnotes : undefined,
                        issueId,
                        order: i
                    };

                    if (existingArt) {
                        await uploader.updateArticle(existingArt._id, articleData);
                    } else {
                        await uploader.createArticle(articleData);
                    }
                }

                addLog(`KÉSZ! Lapszám sikeresen elkészítve. ID: ${finalIssueId}`);
                setSuccessId(finalIssueId);
                setSuccessType('issue');
                setIsProcessing(false);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Hiba történt a feldolgozás során.');
                setErrorStack(err.stack || null);
                setIsProcessing(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <Container width={2}>
            <Box padding={4}>
                <Card padding={4} shadow={1} radius={3}>
                    <Stack space={4}>
                        <Flex align="center">
                            <Box marginRight={3}>
                                {importTarget === 'standaloneBook' ? (
                                    <DocumentsIcon style={{ fontSize: 32 }} />
                                ) : importTarget === 'standaloneArticle' ? (
                                    <DocumentIcon style={{ fontSize: 32 }} />
                                ) : (
                                    <BookIcon style={{ fontSize: 32 }} />
                                )}
                            </Box>
                            <Heading as="h1" size={3}>Word (.docx) Dokumentum és Lapszám Importőr</Heading>
                        </Flex>
                        
                        <Text size={1} muted>
                            Tölts fel egy Word dokumentumot (.docx). A stúdió automatikusan felismeri, ha lapszámról (RF + szám) van szó, 
                            vagy felajánlja az önálló cikk / önálló könyv importálási lehetőséget.
                        </Text>

                        {/* Mode Selector Segmented Group */}
                        {!isProcessing && !successId && (
                            <Card padding={3} tone="transparent" border radius={2}>
                                <Stack space={2}>
                                    <Label size={1}>Importálás Típusa</Label>
                                    <Flex gap={2} wrap="wrap">
                                        <Button
                                            icon={BookIcon}
                                            mode={importTarget === 'issue' ? 'default' : 'ghost'}
                                            tone={importTarget === 'issue' ? 'primary' : 'default'}
                                            text="Lapszám és cikkek (RF)"
                                            onClick={() => setImportTarget('issue')}
                                        />
                                        <Button
                                            icon={DocumentIcon}
                                            mode={importTarget === 'standaloneArticle' ? 'default' : 'ghost'}
                                            tone={importTarget === 'standaloneArticle' ? 'primary' : 'default'}
                                            text="Önálló Cikk"
                                            onClick={() => setImportTarget('standaloneArticle')}
                                        />
                                        <Button
                                            icon={DocumentsIcon}
                                            mode={importTarget === 'standaloneBook' ? 'default' : 'ghost'}
                                            tone={importTarget === 'standaloneBook' ? 'primary' : 'default'}
                                            text="Könyv / Önálló Füzet"
                                            onClick={() => setImportTarget('standaloneBook')}
                                        />
                                    </Flex>
                                </Stack>
                            </Card>
                        )}

                        {/* Confirmation Banner if Standalone Document Detected */}
                        {!isProcessing && !successId && detectedAsStandalone && file && (
                            <Card padding={3} tone="caution" border radius={2}>
                                <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                                    <Box flex={1}>
                                        <Text size={1} weight="bold">Egyedi dokumentum észlelve (nem tartalmaz &apos;RF&apos; lapszámszámot)</Text>
                                        <Text size={1} muted>Kérlek erősítsd meg: önálló cikként vagy könyvként szeretnéd importálni?</Text>
                                    </Box>
                                    <Flex gap={2}>
                                        <Button
                                            icon={DocumentIcon}
                                            tone={importTarget === 'standaloneArticle' ? 'primary' : 'default'}
                                            mode={importTarget === 'standaloneArticle' ? 'default' : 'ghost'}
                                            text="Önálló cikként"
                                            onClick={() => setImportTarget('standaloneArticle')}
                                        />
                                        <Button
                                            icon={DocumentsIcon}
                                            tone={importTarget === 'standaloneBook' ? 'primary' : 'default'}
                                            mode={importTarget === 'standaloneBook' ? 'default' : 'ghost'}
                                            text="Könyvként / Füzetként"
                                            onClick={() => setImportTarget('standaloneBook')}
                                        />
                                    </Flex>
                                </Flex>
                            </Card>
                        )}

                        {/* Unified File Upload Zone */}
                        {!isProcessing && !successId && (
                            <Card
                                border
                                style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                                padding={5}
                                radius={2}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e: any) => e.preventDefault()}
                                onDrop={handleMergedDrop}
                            >
                                <Flex direction="column" align="center" justify="center" gap={3}>
                                    {importTarget === 'standaloneBook' ? (
                                        <DocumentsIcon style={{ fontSize: 40, opacity: 0.7 }} />
                                    ) : importTarget === 'standaloneArticle' ? (
                                        <DocumentIcon style={{ fontSize: 40, opacity: 0.7 }} />
                                    ) : (
                                        <BookIcon style={{ fontSize: 40, opacity: 0.7 }} />
                                    )}
                                    <Text size={2} weight="bold" align="center">
                                        Húzd ide a dokumentum fájljait (.docx, .pdf, borítókép), vagy kattints a tallózáshoz
                                    </Text>
                                    <Text size={1} muted align="center">
                                        Egyszerre több fájlt is behúzhatsz vagy kijelölhetsz
                                    </Text>
                                </Flex>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept=".docx,.pdf,image/*"
                                    multiple
                                    onChange={handleMergedFileChange}
                                />
                            </Card>
                        )}

                        {/* Metadata Inputs & File Status Row */}
                        {!isProcessing && !successId && (file || coverFile || pdfFile) && (
                            <Stack space={4}>
                                {/* File Upload Statuses */}
                                <Stack space={3}>
                                    {/* .docx file */}
                                    <Card padding={3} border radius={2} tone={file ? "positive" : "transparent"}>
                                        <Flex align="center" justify="space-between">
                                            <Stack space={2} flex={1}>
                                                <Label size={1} muted>Word tartalom-fájl (.docx) - *Kötelező*</Label>
                                                <Text size={1} weight={file ? "bold" : "regular"} style={{ wordBreak: 'break-all' }}>
                                                    {file ? file.name : "Nincs kiválasztva"}
                                                </Text>
                                            </Stack>
                                            <Flex gap={2} align="center">
                                                {file && (
                                                    <Button
                                                        fontSize={1}
                                                        padding={2}
                                                        mode="bleed"
                                                        tone="critical"
                                                        icon={TrashIcon}
                                                        onClick={(e: any) => {
                                                            e.stopPropagation();
                                                            setFile(null);
                                                        }}
                                                    />
                                                )}
                                            </Flex>
                                        </Flex>
                                    </Card>

                                    {/* Borítókép file */}
                                    {importTarget !== 'standaloneArticle' && (
                                        <>
                                            <Card padding={3} border radius={2} tone={coverFile ? "positive" : "transparent"}>
                                                <Flex align="center" justify="space-between">
                                                    <Stack space={2} flex={1}>
                                                        <Label size={1} muted>Borítókép (kép) - *Opcionális*</Label>
                                                        <Text size={1} weight={coverFile ? "bold" : "regular"} style={{ wordBreak: 'break-all' }}>
                                                            {coverFile ? coverFile.name : "Nincs kiválasztva"}
                                                        </Text>
                                                    </Stack>
                                                    <Flex gap={2} align="center">
                                                        <Button
                                                            fontSize={1}
                                                            padding={2}
                                                            mode="bleed"
                                                            text={coverFile ? "Módosítás" : "Kiválasztás"}
                                                            onClick={(e: any) => {
                                                                e.stopPropagation();
                                                                coverInputRef.current?.click();
                                                            }}
                                                        />
                                                        {coverFile && (
                                                            <Button
                                                                fontSize={1}
                                                                padding={2}
                                                                mode="bleed"
                                                                tone="critical"
                                                                icon={TrashIcon}
                                                                onClick={(e: any) => {
                                                                    e.stopPropagation();
                                                                    setCoverFile(null);
                                                                }}
                                                            />
                                                        )}
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                            <input
                                                type="file"
                                                ref={coverInputRef}
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                            />
                                        </>
                                    )}

                                    {/* PDF file */}
                                    {importTarget !== 'standaloneArticle' && (
                                        <>
                                            <Card padding={3} border radius={2} tone={pdfFile ? "positive" : "transparent"}>
                                                <Flex align="center" justify="space-between">
                                                    <Stack space={2} flex={1}>
                                                        <Label size={1} muted>Letölthető kiadvány (.pdf) - *Opcionális*</Label>
                                                        <Text size={1} weight={pdfFile ? "bold" : "regular"} style={{ wordBreak: 'break-all' }}>
                                                            {pdfFile ? pdfFile.name : "Nincs kiválasztva"}
                                                        </Text>
                                                    </Stack>
                                                    <Flex gap={2} align="center">
                                                        <Button
                                                            fontSize={1}
                                                            padding={2}
                                                            mode="bleed"
                                                            text={pdfFile ? "Módosítás" : "Kiválasztás"}
                                                            onClick={(e: any) => {
                                                                e.stopPropagation();
                                                                pdfInputRef.current?.click();
                                                            }}
                                                        />
                                                        {pdfFile && (
                                                            <Button
                                                                fontSize={1}
                                                                padding={2}
                                                                mode="bleed"
                                                                tone="critical"
                                                                icon={TrashIcon}
                                                                onClick={(e: any) => {
                                                                    e.stopPropagation();
                                                                    setPdfFile(null);
                                                                }}
                                                            />
                                                        )}
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                            <input
                                                type="file"
                                                ref={pdfInputRef}
                                                style={{ display: 'none' }}
                                                accept="application/pdf"
                                                onChange={handlePdfChange}
                                            />
                                        </>
                                    )}
                                </Stack>

                                {/* --------------------------------------------- */}
                                {/* TARGET A: ISSUE FIELDS */}
                                {/* --------------------------------------------- */}
                                {importTarget === 'issue' && (
                                    <>
                                        <Flex gap={3}>
                                            <Box flex={1}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Lapszám megnevezése (Cím)</Label>
                                                <TextInput
                                                    value={issueTitle}
                                                    onChange={(e: any) => setIssueTitle(e.currentTarget.value)}
                                                    placeholder="pl. RF-54"
                                                />
                                            </Box>
                                            <Box style={{ width: '120px' }}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Sorszám</Label>
                                                <TextInput
                                                    type="number"
                                                    value={issueNumber}
                                                    onChange={(e: any) => setIssueNumber(e.currentTarget.value)}
                                                    placeholder="pl. 54"
                                                />
                                            </Box>
                                            <Box style={{ width: '180px' }}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Típus</Label>
                                                <Select
                                                    value={issueType}
                                                    onChange={(e: any) => setIssueType(e.currentTarget.value as 'regular' | 'special')}
                                                >
                                                    <option value="regular">Rendes lapszám</option>
                                                    <option value="special">Különszám</option>
                                                </Select>
                                            </Box>
                                        </Flex>

                                        <Flex gap={3}>
                                            <Box flex={1}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Megjelenés dátuma</Label>
                                                <TextInput
                                                    type="date"
                                                    value={publishedAt}
                                                    onChange={(e: any) => setPublishedAt(e.currentTarget.value)}
                                                />
                                            </Box>
                                            <Box style={{ width: '200px' }}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Nyelv</Label>
                                                <Select
                                                    value={language}
                                                    onChange={(e: any) => setLanguage(e.currentTarget.value as 'hu' | 'en')}
                                                >
                                                    <option value="hu">Magyar (HU)</option>
                                                    <option value="en">Angol (EN)</option>
                                                </Select>
                                            </Box>
                                        </Flex>

                                        <Box>
                                            <Label size={1} style={{ marginBottom: 8, display: 'block' }}>YouTube hangoskönyv URL (Opcionális)</Label>
                                            <TextInput
                                                value={youtubeUrl}
                                                onChange={(e: any) => setYoutubeUrl(e.currentTarget.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </Box>
                                    </>
                                )}

                                {/* --------------------------------------------- */}
                                {/* TARGET B: STANDALONE ARTICLE FIELDS */}
                                {/* --------------------------------------------- */}
                                {importTarget === 'standaloneArticle' && (
                                    <>
                                        <Box>
                                            <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Cikk Címe (Ha üres, a dokumentum fejlécéből olvassa ki)</Label>
                                            <TextInput
                                                value={standaloneTitle}
                                                onChange={(e: any) => setStandaloneTitle(e.currentTarget.value)}
                                                placeholder="pl. A kegyelem munkája a hívő életében"
                                            />
                                        </Box>

                                        <Flex gap={3}>
                                            <Box flex={1}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Alcím (Opcionális)</Label>
                                                <TextInput
                                                    value={standaloneSubtitle}
                                                    onChange={(e: any) => setStandaloneSubtitle(e.currentTarget.value)}
                                                    placeholder="pl. Rövid magyarázat"
                                                />
                                            </Box>
                                            <Box flex={1}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Alapige (Opcionális)</Label>
                                                <TextInput
                                                    value={standaloneScripture}
                                                    onChange={(e: any) => setStandaloneScripture(e.currentTarget.value)}
                                                    placeholder="pl. Róma 8:28"
                                                />
                                            </Box>
                                        </Flex>

                                        <Flex gap={3}>
                                            <Box flex={1}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Szerző (Opcionális)</Label>
                                                <TextInput
                                                    value={standaloneAuthor}
                                                    onChange={(e: any) => setStandaloneAuthor(e.currentTarget.value)}
                                                    placeholder="pl. Keresztény író neve"
                                                />
                                            </Box>
                                            <Box style={{ width: '200px' }}>
                                                <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Nyelv</Label>
                                                <Select
                                                    value={language}
                                                    onChange={(e: any) => setLanguage(e.currentTarget.value as 'hu' | 'en')}
                                                >
                                                    <option value="hu">Magyar (HU)</option>
                                                    <option value="en">Angol (EN)</option>
                                                </Select>
                                            </Box>
                                        </Flex>
                                    </>
                                )}

                                {/* --------------------------------------------- */}
                                {/* TARGET C: STANDALONE BOOK FIELDS */}
                                {/* --------------------------------------------- */}
                                {importTarget === 'standaloneBook' && (
                                    <>
                                        <Box>
                                            <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Könyv / Füzet Címe (Ha üres, a dokumentumból olvassa ki)</Label>
                                            <TextInput
                                                value={standaloneTitle}
                                                onChange={(e: any) => setStandaloneTitle(e.currentTarget.value)}
                                                placeholder="pl. A zarándok útja"
                                            />
                                        </Box>

                                        <Box>
                                            <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Alcím (Opcionális)</Label>
                                            <TextInput
                                                value={standaloneSubtitle}
                                                onChange={(e: any) => setStandaloneSubtitle(e.currentTarget.value)}
                                                placeholder="pl. Rövid ismertető vagy leírás"
                                            />
                                        </Box>

                                        <Box>
                                            <Label size={1} style={{ marginBottom: 8, display: 'block' }}>YouTube videó / Hangoskönyv URL (Opcionális)</Label>
                                            <TextInput
                                                value={youtubeUrl}
                                                onChange={(e: any) => setYoutubeUrl(e.currentTarget.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </Box>
                                    </>
                                )}

                                <Button
                                    text={
                                        !file
                                            ? "A feltöltéshez kötelező a Word (.docx) fájl kijelölése"
                                            : importTarget === 'standaloneBook'
                                            ? "Önálló Könyv / Füzet Feltöltése a Sanity-be"
                                            : importTarget === 'standaloneArticle'
                                            ? "Önálló Cikk Feltöltése a Sanity-be"
                                            : "Lapszám és Cikkek Feltöltése a Sanity-be"
                                    }
                                    tone="primary"
                                    disabled={!file}
                                    fontSize={2}
                                    padding={3}
                                    onClick={triggerImport}
                                />
                            </Stack>
                        )}

                        {/* Processing screen */}
                        {isProcessing && (
                            <Card padding={4} tone="transparent" border radius={2}>
                                <Flex direction="column" align="center" justify="center" padding={4}>
                                    <Spinner size={3} />
                                    <Text size={2} weight="bold" style={{ marginTop: 16 }}>
                                        {importTarget === 'standaloneBook'
                                            ? "Könyv feldolgozása folyamatban..."
                                            : importTarget === 'standaloneArticle'
                                            ? "Önálló cikk feldolgozása folyamatban..."
                                            : "Lapszám feldolgozása folyamatban..."}
                                    </Text>
                                </Flex>
                                
                                <Box padding={3} style={{ backgroundColor: '#1a1a1a', borderRadius: 6, maxHeight: '200px', overflowY: 'auto' }}>
                                    <Stack space={2}>
                                        {logs.map((log, i) => (
                                            <Text key={i} size={1} style={{ fontFamily: 'monospace', color: '#00ff00' }}>
                                                {log}
                                            </Text>
                                        ))}
                                    </Stack>
                                </Box>
                            </Card>
                        )}

                        {/* Success view */}
                        {successId && (
                            <Card padding={4} tone="positive" border radius={2}>
                                <Flex align="center" style={{ marginBottom: 16 }}>
                                    <Box marginRight={2}>
                                        <CheckmarkCircleIcon style={{ fontSize: 24 }} />
                                    </Box>
                                    <Heading size={1}>Sikeres importálás!</Heading>
                                </Flex>
                                <Text size={1} style={{ marginBottom: 16 }}>
                                    {successType === 'standaloneBook'
                                        ? "Az önálló könyv / füzet sikeresen feldolgozásra és feltöltésre került."
                                        : successType === 'article'
                                        ? "Az önálló cikk sikeresen feldolgozásra és feltöltésre került."
                                        : "A lapszám és az összes cikk sikeresen feldolgozásra és feltöltésre került."}
                                </Text>
                                <Flex gap={3}>
                                    <Button
                                        text="Új dokumentum importálása"
                                        mode="ghost"
                                        onClick={() => {
                                            setFile(null);
                                            setCoverFile(null);
                                            setPdfFile(null);
                                            setSuccessId(null);
                                            setDetectedAsStandalone(false);
                                            setStandaloneTitle('');
                                            setStandaloneSubtitle('');
                                            setStandaloneScripture('');
                                            setStandaloneAuthor('');
                                            setLogs([]);
                                        }}
                                    />
                                    <Button
                                        text={
                                            successType === 'standaloneBook'
                                                ? "Ugrás a könyv szerkesztéséhez"
                                                : successType === 'article'
                                                ? "Ugrás a cikk szerkesztéséhez"
                                                : "Ugrás a lapszám szerkesztéséhez"
                                        }
                                        tone="positive"
                                        as="a"
                                        href={`/intent/edit/id=${successId};type=${successType}`}
                                    />
                                </Flex>
                            </Card>
                        )}

                        {/* Error view */}
                        {error && (
                            <Card padding={4} tone="critical" border radius={2}>
                                <Stack space={4}>
                                    <Flex align="center">
                                        <Box marginRight={2}>
                                            <ErrorOutlineIcon style={{ fontSize: 24 }} />
                                        </Box>
                                        <Heading size={1}>Feldolgozási hiba!</Heading>
                                    </Flex>
                                    <Text size={1} weight="bold">{error}</Text>
                                    
                                    {/* Show logs for debugging */}
                                    {logs.length > 0 && (
                                        <Box>
                                            <Label size={1} style={{ marginBottom: 8, display: 'block' }}>Feldolgozási napló (Logok):</Label>
                                            <Box padding={3} style={{ backgroundColor: '#1d1d1f', borderRadius: 6, maxHeight: '200px', overflowY: 'auto' }}>
                                                <Stack space={2}>
                                                     {logs.map((log, i) => (
                                                         <Text key={i} size={1} style={{ fontFamily: 'monospace', color: '#ffaaaa' }}>
                                                             {log}
                                                         </Text>
                                                     ))}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Show stack trace under details */}
                                    {errorStack && (
                                        <details style={{ cursor: 'pointer' }}>
                                            <summary><Text size={1} style={{ display: 'inline' }} muted>Részletes hibaüzenet (Stack trace)</Text></summary>
                                            <Box marginTop={2} padding={3} style={{ backgroundColor: '#1d1d1f', borderRadius: 6, overflowX: 'auto' }}>
                                                <Text size={1} style={{ fontFamily: 'monospace', whiteSpace: 'pre', color: '#ff8888' }}>
                                                    {errorStack}
                                                </Text>
                                            </Box>
                                        </details>
                                    )}

                                    <Flex gap={3}>
                                        <Button
                                            text="Újra"
                                            tone="critical"
                                            onClick={() => {
                                                setError(null);
                                                setErrorStack(null);
                                            }}
                                        />
                                        <Button
                                            text="Napló másolása"
                                            mode="ghost"
                                            onClick={() => {
                                                const textToCopy = `Hiba: ${error}\n\nNapló:\n${logs.join('\n')}\n\nStack:\n${errorStack || ''}`;
                                                navigator.clipboard.writeText(textToCopy);
                                                alert('Napló kimásolva a vágólapra!');
                                            }}
                                        />
                                    </Flex>
                                </Stack>
                            </Card>
                        )}
                    </Stack>
                </Card>
            </Box>
        </Container>
    );
};
