import { defineQuery } from "next-sanity";

/**
 * Fetch global editable website configuration and layout texts.
 */
export const GET_SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  headerTitle,
  headerSubtitle,
  headerSearchButtonLabel,
  headerMenu[]{
    label,
    url
  },
  footerCopyright,
  footerQuoteText,
  footerQuoteSource,
  footerMenu1Title,
  footerMenu1[]{
    label,
    url
  },
  footerMenu2Title,
  footerMenu2[]{
    label,
    url
  }
}`);

/**
 * Fetch home page content and configurable texts.
 */
export const GET_HOME_PAGE_QUERY = defineQuery(`*[_type == "homePage"][0]{
  heroImage {
    asset->{
      _id,
      url
    },
    alt
  },
  heroTitle,
  heroSubtitle,
  latestIssueTitle,
  welcomeTitle,
  welcomeContent[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "reference": reference->{
          _type,
          _id,
          title,
          slug,
          issueNumber,
          issueType,
          publishedAt
        }
      }
    }
  },
  popularTagsTitle
}`);

/**
 * Fetch magazine archive page texts.
 */
export const GET_MAGAZINE_PAGE_QUERY = defineQuery(`*[_type == "magazinePage"][0]{
  title,
  description,
  carouselSelectLabel,
  articlesTabLabel,
  audiobookTabLabel,
  audiobookUnavailableLabel,
  downloadPdfButtonLabel,
  emptyTitle,
  emptyDescription
}`);

/**
 * Fetch about page data.
 */
export const GET_ABOUT_PAGE_QUERY = defineQuery(`*[_type == "aboutPage"][0]{
  _id,
  title,
  content[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "reference": reference->{
          _type,
          _id,
          title,
          slug,
          issueNumber,
          issueType,
          publishedAt
        }
      }
    }
  }
}`);

/**
 * Fetch contact page data.
 */
export const GET_CONTACT_PAGE_QUERY = defineQuery(`*[_type == "contactPage"][0]{
  _id,
  title,
  content[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "reference": reference->{
          _type,
          _id,
          title,
          slug,
          issueNumber,
          issueType,
          publishedAt
        }
      }
    }
  },
  recipientEmail,
  formNameLabel,
  formNamePlaceholder,
  formEmailLabel,
  formEmailPlaceholder,
  formMessageLabel,
  formMessagePlaceholder,
  formSubmitButtonLabel,
  formSuccessTitle,
  formSuccessMessage,
  formSuccessButtonLabel,
  formErrorMessage
}`);

/**
 * Fetch English articles page header/description data.
 */
export const GET_ENGLISH_ARTICLES_PAGE_QUERY = defineQuery(`*[_type == "englishArticlesPage"][0]{
  title,
  description,
  readButtonLabel,
  emptyTitle,
  emptyDescription
}`);

/**
 * Fetch Privacy (Adatkezelés) page data.
 */
export const GET_PRIVACY_PAGE_QUERY = defineQuery(`*[_type == "privacyPage"][0]{
  _id,
  title,
  slug,
  content[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "reference": reference->{
          _type,
          _id,
          title,
          slug,
          issueNumber,
          issueType,
          publishedAt
        }
      }
    }
  }
}`);

/**
 * Fetch all English articles.
 */
export const GET_ENGLISH_ARTICLES_QUERY = defineQuery(`*[_type == "article" && language == "en"] | order(_createdAt desc){
  _id,
  title,
  subtitle,
  scripture,
  slug,
  language,
  author->{
    _id,
    name
  },
  tags[]->{
    _id,
    title,
    slug
  },
  "issue": issue->{
    _id,
    title,
    issueNumber,
    issueType,
    publishedAt
  }
}`);

/**
 * Fetch search page UI text configuration.
 */
export const GET_SEARCH_PAGE_QUERY = defineQuery(`*[_type == "searchPage"][0]{
  title,
  description,
  queryLabel,
  queryPlaceholder,
  authorLabel,
  authorAllOption,
  issueLabel,
  issueAllOption,
  tagLabel,
  tagSearchPlaceholder,
  resetButtonLabel,
  resultsHeading,
  readButtonLabel,
  noResultsTitle,
  noResultsDescription
}`);

/**
 * Fetch the newest issue (ordered by publication date descending).
 */
export const GET_NEWEST_ISSUE_QUERY = defineQuery(`*[_type == "issue"] | order(publishedAt desc, issueNumber desc)[0]{
    _id,
    title,
    issueNumber,
    issueType,
    publishedAt,
    youtubeUrl,
    "pdfUrl": pdfFile.asset->url,
    coverImage {
        asset->{
            _id,
            url
        },
        alt
    },
    "articles": *[_type == "article" && issue._ref == ^._id] | order(order asc) {
        _id,
        title,
        subtitle,
        scripture,
        slug,
        language,
        author->{
            _id,
            name
        },
        tags[]->{
            _id,
            title,
            slug
        }
    }
}`);

/**
 * Fetch all issues for the Magazine Archive view.
 */
export const GET_ALL_ISSUES_QUERY = defineQuery(`*[_type == "issue"] | order(publishedAt desc, issueNumber desc) {
    _id,
    title,
    issueNumber,
    issueType,
    publishedAt,
    youtubeUrl,
    "pdfUrl": pdfFile.asset->url,
    coverImage {
        asset->{
            _id,
            url
        },
        alt
    },
    "articleCount": count(*[_type == "article" && issue._ref == ^._id]),
    "articles": *[_type == "article" && issue._ref == ^._id] | order(order asc) {
        _id,
        title,
        subtitle,
        scripture,
        slug,
        language,
        author->{
            _id,
            name
        },
        tags[]->{
            _id,
            title,
            slug
        }
    }
}`);

/**
 * Fetch a single document by slug (supports both article and standaloneBook).
 * Fully dereferences internal link mark definitions in PortableText.
 */
export const GET_DOCUMENT_BY_SLUG_QUERY = defineQuery(`*[_type in ["article", "standaloneBook"] && slug.current == $slug][0]{
    _type,
    _id,
    title,
    subtitle,
    scripture,
    slug,
    language,
    coverImage {
        asset->{
            _id,
            url
        },
        alt
    },
    youtubeUrl,
    "pdfUrl": pdfFile.asset->url,
    author->{
        _id,
        name
    },
    tags[]->{
        _id,
        title,
        slug
    },
    footnotes[]{
        number,
        text,
        anchorId
    },
    "issue": issue->{
        _id,
        title,
        issueNumber,
        issueType,
        publishedAt,
        "articles": *[_type == "article" && issue._ref == ^._id] | order(order asc) {
            _id,
            title,
            slug
        }
    },
    "translation": coalesce(
        translation->{
            _id,
            title,
            slug,
            language
        },
        *[_type == "article" && translation._ref == ^._id][0]{
            _id,
            title,
            slug,
            language
        }
    ),
    content[]{
        ...,
        markDefs[]{
            ...,
            _type == "internalLink" => {
                "reference": reference->{
                    _type,
                    _id,
                    title,
                    slug,
                    issueNumber,
                    issueType,
                    publishedAt
                }
            }
        }
    }
}`);

/**
 * Fetch metadata parameters to populate the search dropdown lists.
 */
export const GET_SEARCH_FILTERS_QUERY = defineQuery(`{
    "authors": *[_type == "author"] | order(name asc){
        _id,
        name
    },
    "issues": *[_type == "issue"] | order(publishedAt desc, issueNumber desc){
        _id,
        title,
        issueNumber,
        issueType,
        publishedAt
    },
    "tags": *[_type == "tag"] | order(title asc){
        _id,
        title,
        slug,
        "articleCount": count(*[_type == "article" && references(^._id)])
    }
}`);

/**
 * Advanced search engine query.
 */
export const SEARCH_ARTICLES_QUERY = defineQuery(`*[
    _type == "article"
    && ($authorId == "" || author._ref == $authorId)
    && ($issueId == "" || issue._ref == $issueId)
    && (count($tagSlugs) == 0 || count((tags[]->slug.current)[@ in $tagSlugs]) > 0)
] | order(publishedAt desc, _createdAt desc) {
    _id,
    title,
    subtitle,
    scripture,
    slug,
    language,
    publishedAt,
    author->{
        _id,
        name
    },
    tags[]->{
        _id,
        title,
        slug
    },
    "issue": issue->{
        _id,
        title,
        issueNumber,
        issueType,
        publishedAt
    },
    "plainContent": pt::text(content)
}`);
