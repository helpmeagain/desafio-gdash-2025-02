import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { globalIgnores } from "eslint/config";

/**
 * ESLint config React + Vite + TypeScript
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const viteConfig = [
  globalIgnores(["dist"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...reactHooks.configs.recommended,
    plugins: {
      "react-hooks": reactHooks,
    },
  },
  {
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactRefresh.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
    },
  },
];

