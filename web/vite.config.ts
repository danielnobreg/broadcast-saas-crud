import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind como plugin Vite — sem postcss.config separado
  ],
  build: {
    sourcemap: false, // Desativa mapeamentos de código, impedindo que o código TS original apareça no "Inspecionar Elemento"
  },
})
