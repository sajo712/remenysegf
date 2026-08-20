import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
    api: {
        projectId: 'ijflvzga',
        dataset: 'production'
    },
    typegen: {
        schema: 'schema.json',
        path: '../web/src/**/*.{ts,tsx,js,jsx}',
        generates: '../web/src/sanity/types.ts',
    },
    vite: (config) => ({
        ...config,
        resolve: {
            ...config.resolve,
            dedupe: [
                ...(config.resolve?.dedupe || []),
                '@codemirror/state',
                '@codemirror/view',
                '@codemirror/language',
                '@codemirror/autocomplete',
                '@codemirror/commands',
                '@codemirror/lint',
                '@codemirror/search',
            ],
        },
    }),
})
