import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { structure } from './structure'
import { visionTool } from '@sanity/vision'
import { table } from '@sanity/table'
import { schemaTypes } from './schema-types'
import { DocxImporter } from './components/docx-importer'
import { BookIcon } from '@sanity/icons/Book'

export default defineConfig({
    name: 'default',
    title: 'Reménység foglyai',

    projectId: 'ijflvzga',
    dataset: 'production',

    plugins: [
        structureTool({ structure }),
        visionTool(),
        table()
    ],

    tools: (prev: any) => [
        ...prev,
        {
            name: 'docx-importer',
            title: 'Word Importőr',
            icon: BookIcon,
            component: DocxImporter,
        }
    ],

    schema: {
        types: schemaTypes,
    },
} as any)
