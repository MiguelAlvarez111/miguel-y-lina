import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
export default [
 {ignores:['dist/**','.astro/**','node_modules/**','.superpowers/**','test-results/**','playwright-report/**']},
 ...ts.configs.recommended,...astro.configs.recommended,
 {rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}}
];
