// Consulta https://svelte.dev/docs/kit/types#app.d.ts
// para más información sobre estas interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		ethereum?: any;
		pali?: any;
	}
}

export {};
