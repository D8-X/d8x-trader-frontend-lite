const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    createDefaultProgram: true,
    ecmaVersion: 2021,
    project: './tsconfig.json',
    sourceType: 'module',
  },
  extends: [
    'plugin:react/recommended',
    'plugin:import/recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript',
    'airbnb/hooks',
    'prettier',
  ],
  plugins: ['jsx-a11y', '@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/ban-ts-comment': WARN,
    '@typescript-eslint/comma-dangle': [ERROR, 'only-multiline'],
    '@typescript-eslint/no-explicit-any': ERROR,
    '@typescript-eslint/no-unused-expressions': [WARN, { allowShortCircuit: true, allowTernary: true }],
    '@typescript-eslint/no-unused-vars': WARN,
    'comma-dangle': [ERROR, 'only-multiline'],
    'import/prefer-default-export': OFF,
    'jsx-a11y/click-events-have-key-events': OFF,
    'jsx-a11y/no-noninteractive-element-inter': OFF,
    'jsx-a11y/no-noninteractive-element-interactions': OFF,
    'jsx-a11y/no-static-element-interactions': OFF,
    'max-classes-per-file': WARN,
    'no-nested-ternary': WARN,
    'no-param-reassign': WARN,
    'no-plusplus': OFF,
    'no-restricted-imports': [
      ERROR,
      {
        patterns: ['@mui/*/*/*'],
      },
    ],
    'no-unused-expressions': [WARN, { allowShortCircuit: true, allowTernary: true }],
    'no-unused-vars': WARN,
    'react-hooks/exhaustive-deps': ERROR,
    'react-hooks/rules-of-hooks': ERROR,
    'react/display-name': OFF,
    'react/jsx-key': ERROR,
    'react/jsx-props-no-spreading': OFF,
    'react/jsx-tag-spacing': [
      WARN,
      {
        beforeSelfClosing: 'always',
      },
    ],
    'react/jsx-uses-react': OFF,
    'react/no-array-index-key': WARN,
    'react/no-unescaped-entities': OFF,
    'react/no-unused-prop-types': OFF,
    'react/prop-types': OFF,
    'react/react-in-jsx-scope': OFF,
    'react/require-default-props': OFF,
    'max-len': [
      WARN,
      {
        code: 120,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      },
    ],
    '@typescript-eslint/naming-convention': [
      WARN,
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
        suffix: ['T'],
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        suffix: ['I'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
        suffix: ['E'],
      },
    ],
  },
};
