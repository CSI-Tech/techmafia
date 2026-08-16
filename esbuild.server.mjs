// esbuild.server.mjs — Compiles server.ts into dist/server.js for production
// Run automatically as part of `npm run build`
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server.js',
  format: 'cjs',
  external: [
    // These are large native/binary modules that must not be bundled
    'mongoose',
    'next',
    'socket.io',
    '@next/*',
    // Exclude all node_modules (don't bundle dependencies, use them from node_modules at runtime)
  ],
  // Resolve the @/ path alias to ./src/
  alias: {
    '@': path.join(__dirname, 'src'),
  },
  sourcemap: false,
  minify: false,
});

console.log('✓ server.ts compiled to dist/server.js');
