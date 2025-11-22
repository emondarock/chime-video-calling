import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "window"
  },
  server: {     // Use IPv4 address explicitly
    allowedHosts: [
      '.ngrok-free.dev',
      'lizeth-curtate-kinetically.ngrok-free.dev'
    ],      // Use different port number
  }
})
