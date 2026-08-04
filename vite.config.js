import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true
      },
      includeAssets: ['diksha logo 01.png'],
      manifest: {
        name: 'Bill Maker',
        short_name: 'BillMaker',
        description: 'Bill Maker Application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'diksha logo 01.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'diksha logo 01.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'diksha logo 01.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
