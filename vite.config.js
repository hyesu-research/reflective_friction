import { defineConfig } from 'vite';
export default defineConfig({
  build:{rollupOptions:{output:{
    entryFileNames:'assets/public-[name]-[hash].js',
    chunkFileNames:chunk=>chunk.name==='Archive'?'assets/archive-[hash].js':'assets/public-[name]-[hash].js',
    assetFileNames:'assets/public-[name]-[hash][extname]',
    manualChunks(id){if(id.includes('node_modules'))return 'vendor';}
  }}}
});
