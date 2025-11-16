import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "window"
  },
  server: {
    host: '0.0.0.0',      // Allow LAN access
    allowedHosts: [
      '.ngrok-free.dev',
      'lizeth-curtate-kinetically.ngrok-free.dev'
    ],
    port: 5173,      // Optional: fix the port
  }
})
