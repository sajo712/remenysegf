export interface PortableTextSpan {
    _type: 'span';
    _key: string;
    text: string;
    marks?: string[] | null;
}

export interface InternalLinkReference {
    _type: 'article' | 'standaloneBook' | 'issue' | string;
    _id: string;
    title?: string | null;
    slug?: {
        current?: string;
    } | null;
    issueNumber?: number | null;
    issueType?: string | null;
    publishedAt?: string | null;
}

export interface PortableTextMarkDef {
    _type: string;
    _key: string;
    href?: string;
    reference?: InternalLinkReference | null;
    [key: string]: unknown;
}

export interface PortableTextBlock {
    _type: string;
    _key?: string;
    style?: string | null;
    textAlign?: string | null;
    listItem?: string | null;
    level?: number | null;
    children?: PortableTextSpan[] | null;
    markDefs?: PortableTextMarkDef[] | null;
    [key: string]: unknown;
}

export interface Author {
    _id: string;
    name?: string | null;
}

export interface Tag {
    _id: string;
    title?: string | null;
    slug?: {
        current?: string;
    } | null;
    articleCount?: number | null;
}

export interface Footnote {
    number?: string | null;
    text?: string | null;
    anchorId?: string | null;
}

export interface CoverImage {
    asset?: {
        _id: string;
        url: string | null;
    } | null;
    alt?: string | null;
}

export interface Article {
    _type?: 'article';
    _id: string;
    title?: string | null;
    subtitle?: string | null;
    scripture?: string | null;
    slug?: {
        current?: string;
    } | null;
    language?: string | null;
    publishedAt?: string | null;
    plainContent?: string | null;
    content?: PortableTextBlock[] | null;
    author?: Author | null;
    tags?: Tag[] | null;
    footnotes?: Footnote[] | null;
    issue?: {
        _id: string;
        title?: string | null;
        issueNumber?: number | null;
        issueType?: string | null;
        publishedAt?: string | null;
        articles?: Array<{
            _id: string;
            title?: string | null;
            slug?: {
                current?: string;
            } | null;
        }> | null;
    } | null;
    translation?: {
        _id: string;
        title?: string | null;
        slug?: {
            current?: string;
        } | null;
        language?: string | null;
    } | null;
}

export interface Issue {
    _id: string;
    title?: string | null;
    issueNumber?: number | null;
    issueType?: string | null;
    publishedAt?: string | null;
    youtubeUrl?: string | null;
    pdfUrl?: string | null;
    coverImage?: CoverImage | null;
    articles?: Article[] | null;
    articleCount?: number | null;
}

export interface Book {
    _type?: 'standaloneBook';
    _id: string;
    title?: string | null;
    subtitle?: string | null;
    youtubeUrl?: string | null;
    coverImage?: CoverImage | null;
    pdfUrl?: string | null;
    content?: PortableTextBlock[] | null;
}

export interface ArticleDocument extends Article {
    _type: 'article';
}

export interface BookDocument extends Book {
    _type: 'standaloneBook';
}

export type UnifiedDocument = ArticleDocument | BookDocument;

export interface MenuItem {
    label?: string | null;
    url?: string | null;
}

export interface SiteSettings {
    headerTitle?: string | null;
    headerSubtitle?: string | null;
    headerSearchButtonLabel?: string | null;
    headerMenu?: MenuItem[] | null;
    footerCopyright?: string | null;
    footerQuoteText?: string | null;
    footerQuoteSource?: string | null;
    footerMenu1Title?: string | null;
    footerMenu1?: MenuItem[] | null;
    footerMenu2Title?: string | null;
    footerMenu2?: MenuItem[] | null;
}

export interface PrivacyPageData {
    _id?: string;
    title?: string | null;
    slug?: {
        current?: string | null;
    } | null;
    content?: PortableTextBlock[] | null;
}

export interface HomePageData {
    heroImage?: CoverImage | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    latestIssueTitle?: string | null;
    welcomeTitle?: string | null;
    welcomeContent?: PortableTextBlock[] | null;
    popularTagsTitle?: string | null;
}

export interface MagazinePageData {
    title?: string | null;
    description?: string | null;
    carouselSelectLabel?: string | null;
    articlesTabLabel?: string | null;
    audiobookTabLabel?: string | null;
    audiobookUnavailableLabel?: string | null;
    downloadPdfButtonLabel?: string | null;
    emptyTitle?: string | null;
    emptyDescription?: string | null;
}

export interface AboutPageData {
    _id?: string;
    title?: string | null;
    content?: PortableTextBlock[] | null;
}

export interface ContactPageData {
    _id?: string;
    title?: string | null;
    content?: PortableTextBlock[] | null;
    recipientEmail?: string | null;
    formNameLabel?: string | null;
    formNamePlaceholder?: string | null;
    formEmailLabel?: string | null;
    formEmailPlaceholder?: string | null;
    formMessageLabel?: string | null;
    formMessagePlaceholder?: string | null;
    formSubmitButtonLabel?: string | null;
    formSuccessTitle?: string | null;
    formSuccessMessage?: string | null;
    formSuccessButtonLabel?: string | null;
    formErrorMessage?: string | null;
}

export interface EnglishArticlesPageData {
    title?: string | null;
    description?: string | null;
    readButtonLabel?: string | null;
    emptyTitle?: string | null;
    emptyDescription?: string | null;
}

export interface SearchPageData {
    title?: string | null;
    description?: string | null;
    queryLabel?: string | null;
    queryPlaceholder?: string | null;
    authorLabel?: string | null;
    authorAllOption?: string | null;
    issueLabel?: string | null;
    issueAllOption?: string | null;
    tagLabel?: string | null;
    tagSearchPlaceholder?: string | null;
    resetButtonLabel?: string | null;
    resultsHeading?: string | null;
    readButtonLabel?: string | null;
    noResultsTitle?: string | null;
    noResultsDescription?: string | null;
}
