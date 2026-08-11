import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Fester Port, damit die Vorschau in VS Code immer unter derselben
  // Adresse liegt. Ist der Port belegt, bricht Vite ab statt still
  // auf 5174 auszuweichen.
  server: { port: 5173, strictPort: true },
})
