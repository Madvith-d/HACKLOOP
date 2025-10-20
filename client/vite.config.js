import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
                    'rpm-vendor': ['@readyplayerme/visage'],
                    'face-api-vendor': ['face-api.js'],
                    'recharts-vendor': ['recharts'],
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
});


