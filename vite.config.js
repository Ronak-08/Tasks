import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
plugins: [
        sveltekit(),
    tailwindcss(),
    Icons({
      compiler: "svelte"
    })
        // visualizer({
        //     open: true, 
        //     filename: 'bundle-analysis.html',
        // })
    ]
});
