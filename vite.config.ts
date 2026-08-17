import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Forzar el modo runes para el proyecto, excepto para librerías. Se puede remover en Svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto solo soporta ciertos entornos, consulta https://svelte.dev/docs/kit/adapter-auto para la lista.
			// Si tu entorno no está soportado o decidiste usar uno específico, cambia el adaptador.
			// Consulta https://svelte.dev/docs/kit/adapters para más información sobre adaptadores.
			adapter: adapter()
		})
	]
});
