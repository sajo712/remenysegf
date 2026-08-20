import { author } from "./author";
import { tag } from "./tag";
import { article } from "./article";
import { issue } from "./issue";
import { standaloneBook } from "./standalone-book";
import { siteSettings } from "./site-settings";
import { homePage } from "./home-page";
import { magazinePage } from "./magazine-page";
import { aboutPage } from "./about-page";
import { contactPage } from "./contact-page";
import { englishArticlesPage } from "./english-articles-page";
import { searchPage } from "./search-page";
import { privacyPage } from "./privacy-page";
import { richText } from "./objects/rich-text";

export const schemaTypes = [
    // Global & Page Singletons
    siteSettings,
    homePage,
    magazinePage,
    aboutPage,
    contactPage,
    englishArticlesPage,
    searchPage,
    privacyPage,

    // Documents
    issue,
    article,
    standaloneBook,
    author,
    tag,

    // Objects
    richText,
];
