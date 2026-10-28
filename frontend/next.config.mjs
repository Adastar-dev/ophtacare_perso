import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Export statique : `npm run build` produit le dossier `out/`, copié ensuite
 * dans `backend/public/` (voir scripts/deploy-frontend.sh). Laravel sert alors
 * l'application et l'API depuis le même serveur.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
}

export default nextConfig
