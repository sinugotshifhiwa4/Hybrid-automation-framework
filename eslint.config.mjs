/***
 * ESLint configuration for Playwright + TypeScript test automation framework.
 *
 * Includes:
 * - ESLint + TypeScript linting with @typescript-eslint
 * - Prettier integration to handle formatting
 * - Relaxed rules for test files
 * - Scoped configuration for .ts/.tsx only
 * - Ignores for generated/output folders and declaration files
 */

import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

const config = tseslint.config(
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),

  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty-pattern": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "warn",
    },
  },

  {
    files: ["**/*.spec.ts", "**/tests/**/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    ignores: [
      "src/testData/**",
      "node_modules/**",
      "logs/**",
      "playwright-report/**",
      "ortoni-report/**",
      "dist/**",
      "*.d.ts",
    ],
  },

  prettierConfig
);

export default config;
