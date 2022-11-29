module.exports = {
    extends: [
        'eslint-config-standard',
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'plugin:prettier/recommended',
    ],
    settings: {
    },
    plugins: ['unused-imports', 'filename-rules'],
    rules: {
        'no-unused-vars': 'off', // Provided by TypeScript
        'no-undef': 'off', // Provided by TypeScript
        'no-void': 'off',
        'no-prototype-builtins': 'off',
        'no-use-before-define': 'off',

        '@typescript-eslint/member-delimiter-style': 'off', // Provided by Prettier
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unused-vars': 'off', // Use TS compiler option instead,
        '@typescript-eslint/ban-ts-comment': 'off', // Need to be able to do ts-ignore when needed
        // Just a warning for now. Eventually we will make this an error
        camelcase: [
            'warn',
            {
                // Otherwise, we would have to rename everything coming from the backend
                // that is passed down as props
                properties: 'never',
            },
        ],
        // use single quotations for string
        quotes: ['error', 'single', { 'avoidEscape': true }],

        eqeqeq: ['error'],

        // Don't allow unused imports
        'unused-imports/no-unused-imports': 'error',

        // Don't allow unused vars
        'unused-imports/no-unused-vars': [
            'warn',
            { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
        ],

        // Let prettier deal with this.
        'comma-dangle': 'off',

        // Lint file naming
        'filename-rules/match': [
            'warn',
            {
                '.js': 'kebab-case',
                '.ts': 'kebab-case',
                '.jsx': 'PascalCase',
                '.tsx': 'PascalCase',
            },
        ],

        // Make it so ts properties declared in constructors are not considered useless
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': ['error'],
        '@typescript-eslint/naming-convention': [
            "warn",
            {
                selector: 'typeLike',
                format: ['PascalCase']
            }
        ]
    },
    ignorePatterns: ['!node_modules/*']
};
