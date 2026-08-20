import { createClient } from '@sanity/client';
import { randomBytes } from 'crypto';

const generateMockId = () => `mock_${randomBytes(8).toString('hex')}`;

export interface ArticleInput {
    title: string;
    authorName: string;
    subtitle?: string;
    scripture?: string;
    content: any[]; // Portable Text blocks
    language: 'hu' | 'en';
}

export interface IssueInput {
    title: string;
    issueNumber: number;
    coverImageUrl?: string;
    pdfUrl?: string;
    youtubeUrl?: string;
    publishedAt: string;
}

export class SanityUploader {
    private client: any;
    private dryRun: boolean;
    private authorCache: Record<string, string> = {};
    private tagCache: Record<string, string> = {};

    constructor(config: { projectId: string; dataset: string; token: string; dryRun: boolean }) {
        this.dryRun = config.dryRun;
        if (!this.dryRun) {
            this.client = createClient({
                projectId: config.projectId,
                dataset: config.dataset,
                token: config.token,
                useCdn: false,
                apiVersion: '2026-05-31',
            });
        }
    }

    private slugify(input: string): string {
        return input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .slice(0, 96);
    }

    /**
     * Fetches all pre-existing author names in the system.
     */
    async fetchAllAuthors(): Promise<Set<string>> {
        if (this.dryRun) {
            return new Set();
        }
        try {
            const query = `*[_type == "author"].name`;
            const names = await this.client.fetch(query);
            return new Set((names || []).map((name: string) => name.trim().toLowerCase()));
        } catch (error) {
            console.error('Error fetching authors:', error);
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

        if (this.dryRun) {
            const mockId = generateMockId();
            this.authorCache[cleanedName] = mockId;
            console.log(`[DRY-RUN] Author checked/created: "${cleanedName}" -> ID: ${mockId}`);
            return mockId;
        }

        try {
            // Check if author already exists
            const query = `*[_type == "author" && name == $name][0]._id`;
            const existingId = await this.client.fetch(query, { name: cleanedName });
            
            if (existingId) {
                this.authorCache[cleanedName] = existingId;
                console.log(`Author found: "${cleanedName}" -> ID: ${existingId}`);
                return existingId;
            }

            // Create new author
            const newAuthor = await this.client.create({
                _type: 'author',
                name: cleanedName
            });
            
            this.authorCache[cleanedName] = newAuthor._id;
            console.log(`Author created: "${cleanedName}" -> ID: ${newAuthor._id}`);
            return newAuthor._id;
        } catch (error) {
            console.error(`Error resolving author "${cleanedName}":`, error);
            throw error;
        }
    }

    /**
     * Resolves a tag title to a Sanity document reference ID.
     */
    async getOrCreateTag(title: string): Promise<string> {
        const cleanedTitle = title.trim();
        if (this.tagCache[cleanedTitle]) {
            return this.tagCache[cleanedTitle];
        }

        if (this.dryRun) {
            const mockId = generateMockId();
            this.tagCache[cleanedTitle] = mockId;
            console.log(`[DRY-RUN] Tag checked/created: "${cleanedTitle}" -> ID: ${mockId}`);
            return mockId;
        }

        try {
            // Check if tag already exists
            const query = `*[_type == "tag" && title == $title][0]._id`;
            const existingId = await this.client.fetch(query, { title: cleanedTitle });
            
            if (existingId) {
                this.tagCache[cleanedTitle] = existingId;
                console.log(`Tag found: "${cleanedTitle}" -> ID: ${existingId}`);
                return existingId;
            }

            // Create new tag
            const newTag = await this.client.create({
                _type: 'tag',
                title: cleanedTitle,
                slug: {
                    _type: 'slug',
                    current: this.slugify(cleanedTitle)
                }
            });
            
            this.tagCache[cleanedTitle] = newTag._id;
            console.log(`Tag created: "${cleanedTitle}" -> ID: ${newTag._id}`);
            return newTag._id;
        } catch (error) {
            console.error(`Error resolving tag "${cleanedTitle}":`, error);
            throw error;
        }
    }

    /**
     * Creates an article document.
     */
    async createArticle(article: ArticleInput, tagIds: string[] = []): Promise<string> {
        const authorId = await this.getOrCreateAuthor(article.authorName);
        
        const doc: any = {
            _type: 'article',
            title: article.title.trim(),
            slug: {
                _type: 'slug',
                current: this.slugify(article.title)
            },
            author: {
                _type: 'reference',
                _ref: authorId
            },
            language: article.language,
            content: article.content,
        };

        if (article.subtitle) {
            doc.subtitle = article.subtitle.trim();
        }

        if (article.scripture) {
            doc.scripture = article.scripture.trim();
        }

        if (tagIds.length > 0) {
            doc.tags = tagIds.map(id => ({
                _type: 'reference',
                _ref: id
            }));
        }

        if (this.dryRun) {
            const mockId = generateMockId();
            console.log(`[DRY-RUN] Article document mock payload:`, JSON.stringify({ ...doc, _id: mockId }, null, 2));
            return mockId;
        }

        try {
            const newArticle = await this.client.create(doc);
            console.log(`Article uploaded successfully: "${article.title}" -> ID: ${newArticle._id}`);
            return newArticle._id;
        } catch (error) {
            console.error(`Error creating article "${article.title}":`, error);
            throw error;
        }
    }

    /**
     * Creates an issue document referencing the articles.
     */
    async createIssue(issue: IssueInput, articleIds: string[]): Promise<string> {
        const doc: any = {
            _type: 'issue',
            title: issue.title.trim(),
            issueNumber: issue.issueNumber,
            publishedAt: issue.publishedAt,
            articles: articleIds.map(id => ({
                _type: 'reference',
                _ref: id
            }))
        };

        // Support importing assets via full URLs if supplied
        if (issue.coverImageUrl) {
            doc.coverImage = {
                _type: 'image',
                _sanityAsset: `image@${issue.coverImageUrl}`
            };
        }
        
        if (issue.pdfUrl) {
            doc.pdfFile = {
                _type: 'file',
                _sanityAsset: `file@${issue.pdfUrl}`
            };
        }

        if (issue.youtubeUrl) {
            doc.youtubeUrl = issue.youtubeUrl.trim();
        }

        if (this.dryRun) {
            const mockId = generateMockId();
            console.log(`[DRY-RUN] Issue document mock payload:`, JSON.stringify({ ...doc, _id: mockId }, null, 2));
            return mockId;
        }

        try {
            const newIssue = await this.client.create(doc);
            console.log(`Issue created successfully: "${issue.title}" -> ID: ${newIssue._id}`);
            return newIssue._id;
        } catch (error) {
            console.error(`Error creating issue "${issue.title}":`, error);
            throw error;
        }
    }
}
