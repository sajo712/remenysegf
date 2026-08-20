import type { SanityClient } from 'sanity';

export interface ArticleInput {
    title: string;
    authorName?: string;
    subtitle?: string;
    scripture?: string;
    content: any[];
    language: 'hu' | 'en';
    footnotes?: Array<{ _key: string; _type: string; number: string; text: string; anchorId: string }>;
    issueId?: string;
    order?: number;
}

export interface IssueInput {
    title: string;
    issueNumber: number;
    publishedAt: string;
    issueType?: 'regular' | 'special';
    coverAssetId?: string;
    pdfAssetId?: string;
    youtubeUrl?: string;
}

export interface StandaloneBookInput {
    title: string;
    subtitle?: string;
    youtubeUrl?: string;
    coverAssetId?: string;
    pdfAssetId?: string;
    content: any[];
}

export class SanityUploader {
    private client: SanityClient;
    private authorCache: Record<string, string> = {};
    private logCallback: (message: string) => void;

    constructor(client: SanityClient, logCallback: (message: string) => void) {
        this.client = client;
        this.logCallback = logCallback;
    }

    generateKey(): string {
        return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    }

    private slugify(input: string): string {
        return input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .slice(0, 96);
    }

    /**
     * Uploads a local file/blob as a Sanity asset.
     */
    async uploadAsset(type: 'image' | 'file', file: File | Blob, filename: string): Promise<string> {
        try {
            this.logCallback(`[Feltöltés] ${filename} feltöltése (${type === 'image' ? 'Kép' : 'PDF'})...`);
            const asset = await this.client.assets.upload(type, file, { filename });
            this.logCallback(`[Sikeres feltöltés] ${filename} -> Asset ID: ${asset._id}`);
            return asset._id;
        } catch (error) {
            this.logCallback(`Hiba a(z) ${filename} feltöltésekor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Fetches all pre-existing author names in the system to verify against.
     */
    async fetchAllAuthors(): Promise<Set<string>> {
        try {
            const query = `*[_type == "author"].name`;
            const names = await this.client.fetch<string[]>(query);
            const authorSet = new Set(names.map(name => name.trim().toLowerCase()));
            this.logCallback(`Rendszerben létező szerzők sikeresen lekérve (${authorSet.size} db).`);
            return authorSet;
        } catch (error) {
            this.logCallback(`Nem sikerült lekérni a meglévő szerzőket: ${String(error)}`);
            console.error(error);
            return new Set();
        }
    }

    /**
     * Resolves an author name to a Sanity document reference ID.
     */
    async getOrCreateAuthor(name: string): Promise<string> {
        const cleanedName = name.trim();
        if (this.authorCache[cleanedName]) {
            return this.authorCache[cleanedName];
        }

        try {
            // Check if author already exists
            const query = `*[_type == "author" && name == $name][0]._id`;
            const existingId = await this.client.fetch(query, { name: cleanedName });
            
            if (existingId) {
                this.authorCache[cleanedName] = existingId;
                this.logCallback(`Szerző megtalálva: "${cleanedName}" -> ID: ${existingId}`);
                return existingId;
            }

            // Create new author
            const newAuthor = await this.client.create({
                _type: 'author',
                name: cleanedName
            });
            
            this.authorCache[cleanedName] = newAuthor._id;
            this.logCallback(`Szerző létrehozva: "${cleanedName}" -> ID: ${newAuthor._id}`);
            return newAuthor._id;
        } catch (error) {
            this.logCallback(`Hiba a(z) "${cleanedName}" szerző feloldásakor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Checks if an article with the given slug or title already exists.
     */
    async checkExistingArticleBySlug(slug: string, title: string): Promise<string | null> {
        try {
            const query = `*[_type == "article" && (slug.current == $slug || title == $title)][0]._id`;
            const res = await this.client.fetch(query, { slug, title: title.trim() });
            return res ? res.replace(/^drafts\./, '') : null;
        } catch (error) {
            this.logCallback(`Hiba a létező cikk ellenőrzésekor: ${String(error)}`);
            return null;
        }
    }

    /**
     * Creates an article document.
     */
    async createArticle(article: ArticleInput): Promise<string> {
        let authorRef: any = undefined;
        if (article.authorName) {
            const authorId = await this.getOrCreateAuthor(article.authorName);
            authorRef = {
                _type: 'reference',
                _ref: authorId
            };
        }
        
        const doc: any = {
            _type: 'article',
            title: article.title.trim(),
            slug: {
                _type: 'slug',
                current: this.slugify(article.title)
            },
            language: article.language,
            content: article.content,
        };

        if (authorRef) {
            doc.author = authorRef;
        }

        if (article.subtitle) {
            doc.subtitle = article.subtitle.trim();
        }

        if (article.scripture) {
            doc.scripture = article.scripture.trim();
        }

        if (article.footnotes && article.footnotes.length > 0) {
            doc.footnotes = article.footnotes;
        }

        if (article.issueId) {
            doc.issue = {
                _type: 'reference',
                _ref: article.issueId
            };
        }

        if (article.order !== undefined) {
            doc.order = article.order;
        }

        try {
            const newArticle = await this.client.create(doc);
            this.logCallback(`Cikk sikeresen feltöltve: "${article.title}" -> ID: ${newArticle._id}`);
            return newArticle._id;
        } catch (error) {
            this.logCallback(`Hiba a(z) "${article.title}" cikk feltöltésekor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Updates an existing article document, only overwriting fields that are present in the import.
     */
    async updateArticle(id: string, article: ArticleInput): Promise<void> {
        const patchData: any = {
            title: article.title.trim(),
            slug: {
                _type: 'slug',
                current: this.slugify(article.title)
            },
            language: article.language,
            content: article.content,
        };

        if (article.authorName) {
            const authorId = await this.getOrCreateAuthor(article.authorName);
            patchData.author = {
                _type: 'reference',
                _ref: authorId
            };
        }

        if (article.subtitle) {
            patchData.subtitle = article.subtitle.trim();
        }

        if (article.scripture) {
            patchData.scripture = article.scripture.trim();
        }

        if (article.footnotes && article.footnotes.length > 0) {
            patchData.footnotes = article.footnotes;
        }

        if (article.issueId) {
            patchData.issue = {
                _type: 'reference',
                _ref: article.issueId
            };
        }

        if (article.order !== undefined) {
            patchData.order = article.order;
        }

        try {
            await this.client.patch(id).set(patchData).commit();
            this.logCallback(`Cikk sikeresen frissítve (patch): "${article.title}" -> ID: ${id}`);
        } catch (error) {
            this.logCallback(`Hiba a(z) "${article.title}" cikk frissítésekor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Checks if a standalone book with the given title or slug already exists.
     */
    async checkExistingStandaloneBook(title: string, slug: string): Promise<string | null> {
        try {
            const query = `*[_type == "standaloneBook" && (title == $title || slug.current == $slug)][0]._id`;
            const res = await this.client.fetch(query, { title: title.trim(), slug });
            return res ? res.replace(/^drafts\./, '') : null;
        } catch (error) {
            this.logCallback(`Hiba a létező könyv ellenőrzésekor: ${String(error)}`);
            return null;
        }
    }

    /**
     * Creates a standalone book document.
     */
    async createStandaloneBook(book: StandaloneBookInput, bookId?: string): Promise<string> {
        const doc: any = {
            _type: 'standaloneBook',
            title: book.title.trim(),
            slug: {
                _type: 'slug',
                current: this.slugify(book.title)
            },
            content: book.content
        };

        if (bookId) {
            doc._id = bookId;
        }

        if (book.subtitle) {
            doc.subtitle = book.subtitle.trim();
        }

        if (book.youtubeUrl) {
            doc.youtubeUrl = book.youtubeUrl.trim();
        }

        if (book.coverAssetId) {
            doc.coverImage = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: book.coverAssetId
                }
            };
        }

        if (book.pdfAssetId) {
            doc.pdfFile = {
                _type: 'file',
                asset: {
                    _type: 'reference',
                    _ref: book.pdfAssetId
                }
            };
        }

        try {
            const created = await this.client.create(doc);
            this.logCallback(`Önálló füzet/könyv sikeresen mentve: "${book.title}" -> ID: ${created._id}`);
            return created._id;
        } catch (error) {
            this.logCallback(`Hiba a(z) "${book.title}" könyv mentésekor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Updates an existing standalone book document.
     */
    async updateStandaloneBook(id: string, book: StandaloneBookInput): Promise<void> {
        const patchData: any = {
            title: book.title.trim(),
            slug: {
                _type: 'slug',
                current: this.slugify(book.title)
            },
            content: book.content
        };

        if (book.subtitle) {
            patchData.subtitle = book.subtitle.trim();
        }

        if (book.youtubeUrl) {
            patchData.youtubeUrl = book.youtubeUrl.trim();
        }

        if (book.coverAssetId) {
            patchData.coverImage = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: book.coverAssetId
                }
            };
        }

        if (book.pdfAssetId) {
            patchData.pdfFile = {
                _type: 'file',
                asset: {
                    _type: 'reference',
                    _ref: book.pdfAssetId
                }
            };
        }

        try {
            await this.client.patch(id).set(patchData).commit();
            this.logCallback(`Önálló füzet/könyv sikeresen frissítve (patch): "${book.title}" -> ID: ${id}`);
        } catch (error) {
            this.logCallback(`Hiba a(z) "${book.title}" könyv frissítésekor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Checks if an issue with the given title or sorszám already exists.
     * Returns its ID and referenced articles (with title and slug).
     */
    async checkExistingIssue(
        title: string, 
        issueNumber: number, 
        issueType: 'regular' | 'special'
    ): Promise<{ id: string; articles: Array<{ _id: string; title: string; slug: string }> } | null> {
        try {
            // Find the issue document matching the title or the same number & type combination
            const issueQuery = `*[_type == "issue" && (title == $title || (issueNumber == $issueNumber && coalesce(issueType, "regular") == $issueType))][0] { _id }`;
            const issueRes = await this.client.fetch(issueQuery, { title: title.trim(), issueNumber, issueType });
            
            if (issueRes) {
                const issueId = issueRes._id;
                const cleanIssueId = issueId.replace(/^drafts\./, "");
                
                // Query all articles referencing the clean issue ID or the draft/published issue ID
                const articlesQuery = `*[_type == "article" && (issue._ref == $cleanIssueId || issue._ref == $issueId || references($cleanIssueId) || references($issueId))] | order(order asc) {
                    _id,
                    title,
                    "slug": slug.current
                }`;
                const articles = await this.client.fetch<any[]>(articlesQuery, { cleanIssueId, issueId });
                
                const mappedArticles = articles.map((a: any) => ({
                    _id: a._id.replace(/^drafts\./, ""), // Strip draft prefix to avoid duplication on patch
                    title: a.title || '',
                    slug: a.slug || ''
                }));
                
                this.logCallback(`Meglévő lapszám megtalálva (ID: ${issueId}). Cikkek száma a Sanity-ben: ${mappedArticles.length} db.`);
                return { id: issueId, articles: mappedArticles };
            }
            return null;
        } catch (error) {
            this.logCallback(`Hiba a létező lapszám ellenőrzésekor: ${String(error)}`);
            console.error(error);
            return null;
        }
    }

    /**
     * Deletes multiple documents by their IDs.
     */
    async deleteDocuments(ids: string[]): Promise<void> {
        try {
            if (ids.length === 0) return;

            this.logCallback(`[Törlés] Dokumentumok törlése (${ids.length} db)...`);
            let tx = this.client.transaction();
            ids.forEach(id => {
                tx = tx.delete(id);
            });
            await tx.commit();
            this.logCallback(`[Törlés] Dokumentumok sikeresen törölve!`);
        } catch (error) {
            this.logCallback(`Hiba a dokumentumok törlésekor: ${String(error)}`);
            console.error(error);
            throw error;
        }
    }

    /**
     * Creates or updates an issue document.
     */
    async createIssue(issue: IssueInput, issueId: string, isNew: boolean): Promise<string> {
        const baseDoc: any = {
            _type: 'issue',
            title: issue.title.trim(),
            issueNumber: issue.issueNumber,
            publishedAt: issue.publishedAt,
        };

        if (issue.issueType) {
            baseDoc.issueType = issue.issueType;
        }

        if (issue.coverAssetId) {
            baseDoc.coverImage = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: issue.coverAssetId
                }
            };
        }

        if (issue.pdfAssetId) {
            baseDoc.pdfFile = {
                _type: 'file',
                asset: {
                    _type: 'reference',
                    _ref: issue.pdfAssetId
                }
            };
        }

        if (issue.youtubeUrl) {
            baseDoc.youtubeUrl = issue.youtubeUrl.trim();
        }

        if (isNew) {
            try {
                const doc = {
                    _id: issueId,
                    ...baseDoc
                };
                const result = await this.client.create(doc);
                this.logCallback(`Lapszám sikeresen mentve: "${issue.title}" -> ID: ${result._id}`);
                return result._id;
            } catch (error) {
                this.logCallback(`Hiba a(z) "${issue.title}" lapszám mentésekor: ${String(error)}`);
                console.error(error);
                throw error;
            }
        } else {
            try {
                await this.client.patch(issueId).set(baseDoc).commit();
                this.logCallback(`Lapszám sikeresen frissítve (patch): "${issue.title}" -> ID: ${issueId}`);
                return issueId;
            } catch (error) {
                this.logCallback(`Hiba a(z) "${issue.title}" lapszám frissítésekor: ${String(error)}`);
                console.error(error);
                throw error;
            }
        }
    }
}
