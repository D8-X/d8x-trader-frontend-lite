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
    'react-app',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'airbnb-typescript',
    'airbnb/hooks',
    'prettier',
  ],
  plugins: ['jsx-a11y', '@typescript-eslint', 'import', 'react-hooks', 'prettier'],
  rules: {
    'comma-dangle': [ERROR, 'only-multiline'],
    '@typescript-eslint/comma-dangle': [ERROR, 'only-multiline'],
    'react/jsx-props-no-spreading': OFF,
    '@typescript-eslint/ban-ts-comment': WARN,
    '@typescript-eslint/no-explicit-any': ERROR,
    'no-nested-ternary': WARN,
    'max-classes-per-file': WARN,
    'no-param-reassign': WARN,
    'react/react-in-jsx-scope': OFF,
    'react/jsx-uses-react': OFF,
    'react/no-array-index-key': WARN,
    'react/prop-types': OFF,
    'react/require-default-props': OFF,
    'react/no-unused-prop-types': OFF,
    'react/display-name': OFF,
    'react/jsx-tag-spacing': [
      WARN,
      {
        beforeSelfClosing: 'always',
      },
    ],
    'react/jsx-key': ERROR,
    'jsx-a11y/click-events-have-key-events': OFF,
    'jsx-a11y/no-noninteractive-element-inter': OFF,
    'jsx-a11y/no-noninteractive-element-interactions': OFF,
    'react/no-unescaped-entities': OFF,
    'jsx-a11y/no-static-element-interactions': OFF,
    'import/prefer-default-export': OFF,
    'react-hooks/rules-of-hooks': ERROR,
    'react-hooks/exhaustive-deps': ERROR,
    'no-plusplus': OFF,
    'no-unused-expressions': [WARN, { allowShortCircuit: true, allowTernary: true }],
    '@typescript-eslint/no-unused-expressions': [WARN, { allowShortCircuit: true, allowTernary: true }],
    'no-unused-vars': WARN,
    '@typescript-eslint/no-unused-vars': WARN,
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
