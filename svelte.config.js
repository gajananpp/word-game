import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),
		prerender: {
			default: true
		}
	}
};

if (process.env.GITHUB_ACTION) {
	config.kit.paths = {
		base: '/word-game',
		assets: '/word-game'
	};
}

export default config;
