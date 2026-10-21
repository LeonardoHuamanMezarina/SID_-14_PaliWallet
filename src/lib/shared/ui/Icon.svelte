<script lang="ts">
	export type IconName =
		| 'home'
		| 'transfer'
		| 'search'
		| 'file-text'
		| 'scale'
		| 'store'
		| 'chart'
		| 'wallet'
		| 'history'
		| 'edit'
		| 'refresh'
		| 'check'
		| 'x'
		| 'message'
		| 'alert'
		| 'info'
		| 'faucet'
		| 'external'
		| 'eye'
		| 'trash'
		| 'upload'
		| 'award'
		| 'credit-card'
		| 'sparkles'
		| 'shield';

	interface Props {
		name: IconName;
		size?: number;
		class?: string;
		strokeWidth?: number;
	}

	let { name, size = 18, class: className = '', strokeWidth = 2 }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="app-icon {className}"
	aria-hidden="true"
>
	{#if name === 'home'}
		<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	{:else if name === 'transfer'}
		<path d="M17 3 21 7l-4 4" />
		<path d="M3 7h18" />
		<path d="m7 21-4-4 4-4" />
		<path d="M21 17H3" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	{:else if name === 'file-text'}
		<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
		<polyline points="14 2 14 8 20 8" />
		<line x1="16" x2="8" y1="13" y2="13" />
		<line x1="16" x2="8" y1="17" y2="17" />
		<line x1="10" x2="8" y1="9" y2="9" />
	{:else if name === 'scale'}
		<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
		<path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
		<path d="M7 21h10" />
		<path d="M12 3v18" />
		<path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
	{:else if name === 'store'}
		<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
		<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
		<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
		<path d="M2 7h20" />
		<path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
	{:else if name === 'chart'}
		<line x1="12" x2="12" y1="20" y2="10" />
		<line x1="18" x2="18" y1="20" y2="4" />
		<line x1="6" x2="6" y1="20" y2="16" />
	{:else if name === 'wallet'}
		<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
		<path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
		<path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
	{:else if name === 'history'}
		<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
		<path d="M3 3v5h5" />
		<path d="M12 7v5l3 2" />
	{:else if name === 'edit'}
		<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
		<path d="m15 5 4 4" />
	{:else if name === 'refresh'}
		<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
		<path d="M3 3v5h5" />
		<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
		<path d="M16 21h5v-5" />
	{:else if name === 'check'}
		<polyline points="20 6 9 17 4 12" />
	{:else if name === 'x'}
		<line x1="18" x2="6" y1="6" y2="18" />
		<line x1="6" x2="18" y1="6" y2="18" />
	{:else if name === 'message'}
		<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
	{:else if name === 'alert'}
		<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
		<line x1="12" x2="12" y1="9" y2="13" />
		<line x1="12" x2="12.01" y1="17" y2="17" />
	{:else if name === 'info'}
		<circle cx="12" cy="12" r="10" />
		<line x1="12" x2="12" y1="16" y2="12" />
		<line x1="12" x2="12.01" y1="8" y2="8" />
	{:else if name === 'faucet'}
		<path d="m12 2.69 5.66 5.66a8 8 0 1 1-11.31 0z" />
	{:else if name === 'external'}
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		<polyline points="15 3 21 3 21 9" />
		<line x1="10" x2="21" y1="14" y2="3" />
	{:else if name === 'eye'}
		<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
		<circle cx="12" cy="12" r="3" />
	{:else if name === 'trash'}
		<path d="M3 6h18" />
		<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
		<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
	{:else if name === 'upload'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="17 8 12 3 7 8" />
		<line x1="12" x2="12" y1="3" y2="15" />
	{:else if name === 'award'}
		<circle cx="12" cy="8" r="6" />
		<path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
	{:else if name === 'credit-card'}
		<rect width="20" height="14" x="2" y="5" rx="2" />
		<line x1="2" x2="22" y1="10" y2="10" />
	{:else if name === 'sparkles'}
		<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
	{:else if name === 'shield'}
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
	{/if}
</svg>

<style>
	.app-icon {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
	}
</style>
