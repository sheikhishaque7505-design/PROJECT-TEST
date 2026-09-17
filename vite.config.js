import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function serveRootGLB() {
  return {
    name: 'serve-root-glb',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.match(/\.(glb|gltf|bin|png|jpg|jpeg|hdr|mp3)$/i)) {
          const filePath = path.join(process.cwd(), req.url.split('?')[0]);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const types = {
              '.glb': 'model/gltf-binary',
              '.gltf': 'model/gltf+json',
              '.bin': 'application/octet-stream',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.hdr': 'application/octet-stream',
              '.mp3': 'audio/mpeg',
            };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveRootGLB()],
  server: { port: 5173, open: true }
});
