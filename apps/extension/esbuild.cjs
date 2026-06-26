// @ts-check
const { build } = require('esbuild')

const watch = process.argv.includes('--watch')

// Firebase web SDK config — these are public identifiers, not secrets.
// In CI/CD, set them as environment variables. Locally, create a .env file.
// Without them, community preset search falls back to bundled-only presets.
const firebaseDefine = {
  'process.env.FIREBASE_API_KEY':            JSON.stringify(process.env.FIREBASE_API_KEY            ?? ''),
  'process.env.FIREBASE_AUTH_DOMAIN':        JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN        ?? ''),
  'process.env.FIREBASE_PROJECT_ID':         JSON.stringify(process.env.FIREBASE_PROJECT_ID         ?? ''),
  'process.env.FIREBASE_STORAGE_BUCKET':     JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET     ?? ''),
  'process.env.FIREBASE_MESSAGING_SENDER_ID':JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID?? ''),
  'process.env.FIREBASE_APP_ID':             JSON.stringify(process.env.FIREBASE_APP_ID             ?? ''),
}

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  // vscode is provided by the host at runtime — never bundle it
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: watch,
  minify: !watch,
  logLevel: 'info',
  define: firebaseDefine,
}

if (watch) {
  build({ ...options, sourcemap: true, minify: false }).then(async (ctx) => {
    await ctx.watch?.()
    console.log('[esbuild] watching…')
  }).catch(() => process.exit(1))
} else {
  build(options).catch(() => process.exit(1))
}
