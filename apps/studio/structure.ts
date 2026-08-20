import type { StructureResolver } from 'sanity/structure'
import { UserIcon } from '@sanity/icons/User'
import { TagIcon } from '@sanity/icons/Tag'
import { DocumentIcon } from '@sanity/icons/Document'
import { BookIcon } from '@sanity/icons/Book'
import { DocumentsIcon } from '@sanity/icons/Documents'
import { CogIcon } from '@sanity/icons/Cog'
import { HomeIcon } from '@sanity/icons/Home'
import { InfoOutlineIcon } from '@sanity/icons/InfoOutline'
import { EnvelopeIcon } from '@sanity/icons/Envelope'
import { TranslateIcon } from '@sanity/icons/Translate'
import { SearchIcon } from '@sanity/icons/Search'
import { LockIcon } from '@sanity/icons/Lock'
import DocumentsPane from 'sanity-plugin-documents-pane'

export const structure: StructureResolver = (S) =>
    S.list()
        .title('Tartalomkezelő')
        .items([
            // 1. Global & Page Settings
            S.listItem()
                .title('Weboldal Beállítások (Settings)')
                .icon(CogIcon)
                .child(
                    S.document()
                        .schemaType('siteSettings')
                        .documentId('siteSettings')
                        .title('Fejléc, Lábléc és Oldal Beállítások')
                ),
            S.listItem()
                .title('Oldalak Szerkesztése')
                .icon(DocumentsIcon)
                .child(
                    S.list()
                        .title('Oldalak Szerkesztése')
                        .items([
                            S.listItem()
                                .title('Kezdőlap (Home)')
                                .icon(HomeIcon)
                                .child(
                                    S.document()
                                        .schemaType('homePage')
                                        .documentId('homePage')
                                        .title('Kezdőlap Beállításai')
                                ),
                            S.listItem()
                                .title('Folyóirat Archívum (/folyoirat)')
                                .icon(BookIcon)
                                .child(
                                    S.document()
                                        .schemaType('magazinePage')
                                        .documentId('magazinePage')
                                        .title('Folyóirat Archívum Oldal Beállításai')
                                ),
                            S.listItem()
                                .title('Magunkról Oldal (/magunkrol)')
                                .icon(InfoOutlineIcon)
                                .child(
                                    S.document()
                                        .schemaType('aboutPage')
                                        .documentId('aboutPage')
                                        .title('Magunkról Oldal Beállításai')
                                ),
                            S.listItem()
                                .title('Kapcsolat Oldal (/kapcsolat)')
                                .icon(EnvelopeIcon)
                                .child(
                                    S.document()
                                        .schemaType('contactPage')
                                        .documentId('contactPage')
                                        .title('Kapcsolat Oldal Beállításai')
                                ),
                            S.listItem()
                                .title('Angol Cikkek (/english-articles)')
                                .icon(TranslateIcon)
                                .child(
                                    S.document()
                                        .schemaType('englishArticlesPage')
                                        .documentId('englishArticlesPage')
                                        .title('Angol Cikkek Oldal Beállításai')
                                ),
                            S.listItem()
                                .title('Kereső Oldal (/kereses)')
                                .icon(SearchIcon)
                                .child(
                                    S.document()
                                        .schemaType('searchPage')
                                        .documentId('searchPage')
                                        .title('Kereső Oldal Beállításai')
                                ),
                            S.listItem()
                                .title('Adatkezelés (/adatkezeles)')
                                .icon(LockIcon)
                                .child(
                                    S.document()
                                        .schemaType('privacyPage')
                                        .documentId('privacyPage')
                                        .title('Adatkezelési Tájékoztató Beállításai')
                                ),
                        ])
                ),
            S.divider(),

            // 2. Main Content
            S.listItem()
                .title('Lapszámok (Issues)')
                .icon(BookIcon)
                .child(S.documentTypeList('issue').title('Lapszámok (Issues)')),
            S.listItem()
                .title('Cikkek (Articles)')
                .icon(DocumentIcon)
                .child(S.documentTypeList('article').title('Cikkek (Articles)')),
            S.listItem()
                .title('Önálló füzetek (Books)')
                .icon(DocumentsIcon)
                .child(S.documentTypeList('standaloneBook').title('Önálló füzetek (Books)')),
            S.divider(),

            // 3. Metadata
            S.listItem()
                .title('Szerzők (Authors)')
                .icon(UserIcon)
                .child(
                    S.documentTypeList('author')
                        .title('Szerzők (Authors)')
                        .child((documentId) =>
                            S.document()
                                .documentId(documentId)
                                .schemaType('author')
                                .views([
                                    S.view.form(),
                                    S.view
                                        .component(DocumentsPane)
                                        .options({
                                            query: `*[!(_id in path("drafts.**")) && references($id)]`,
                                            params: { id: `_id` },
                                            useDraft: false,
                                        })
                                        .title('Hivatkozó cikkek')
                                ])
                        )
                ),
            S.listItem()
                .title('Címkék (Tags)')
                .icon(TagIcon)
                .child(
                    S.documentTypeList('tag')
                        .title('Címkék (Tags)')
                        .child((documentId) =>
                            S.document()
                                .documentId(documentId)
                                .schemaType('tag')
                                .views([
                                    S.view.form(),
                                    S.view
                                        .component(DocumentsPane)
                                        .options({
                                            query: `*[!(_id in path("drafts.**")) && references($id)]`,
                                            params: { id: `_id` },
                                            useDraft: false,
                                        })
                                        .title('Hivatkozó cikkek')
                                ])
                        )
                ),
        ])
