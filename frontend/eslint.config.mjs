import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "docs/**",
      "public/**",
      "*.zip"
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "no-console": "off",
    }
  }
];
