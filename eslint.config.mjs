// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // External API responses are untyped JSON — allow any for now
      '@typescript-eslint/no-explicit-any': 'off',
      // Unused vars: prefix with _ to suppress
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Vue formatting — warnings only, not blocking
      'vue/first-attribute-linebreak': 'warn',
      'vue/html-self-closing': 'warn',
      'vue/attributes-order': 'warn',
    },
  }
)
