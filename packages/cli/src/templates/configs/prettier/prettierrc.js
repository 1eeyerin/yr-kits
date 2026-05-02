/** @type {import("prettier").Options} */
module.exports = {
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: "es5",
  printWidth: 100,
  tabWidth: 2,
  endOfLine: "auto",
  arrowParens: "always",
  bracketSpacing: true,
  plugins: ["prettier-plugin-tailwindcss"],
};
