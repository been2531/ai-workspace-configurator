// @ts-check
const { build } = require('esbuild')

const watch = process.argv.includes('--watch')

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
}

if (watch) {
  build({ ...options, sourcemap: true, minify: false }).then(async (ctx) => {
    await ctx.watch?.()
    console.log('[esbuild] watching…')
  }).catch(() => process.exit(1))
} else {
  build(options).catch(() => process.exit(1))
}
