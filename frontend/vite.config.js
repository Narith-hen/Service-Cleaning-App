import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite'
=======
import path from 'path'
>>>>>>> master

export default defineConfig({
<<<<<<< HEAD
  plugins: [react(), tailwindcss()],
})
=======
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
>>>>>>> master
