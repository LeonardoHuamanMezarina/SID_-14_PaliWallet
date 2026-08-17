<script lang="ts">
	import { walletStore } from '../../wallet/wallet.svelte';
	import { SUPPORTED_NETWORKS, DEFAULT_NETWORK } from '../network.config';

	let isOpen = $state(false);

	const activeNetwork = $derived(
		walletStore.state.chainId ? SUPPORTED_NETWORKS[walletStore.state.chainId] : DEFAULT_NETWORK
	);

	function selectNetwork(chainId: number) {
		walletStore.switchNetwork(chainId);
		isOpen = false;
	}
</script>

<div class="network-selector">
	<button class="selector-btn" onclick={() => isOpen = !isOpen}>
		<span class="net-dot"></span>
		<span class="net-title">{activeNetwork?.shortName || 'Syscoin'}</span>
		<svg class="chevron {isOpen ? 'open' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none">
			<path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
	</button>

	{#if isOpen}
		<div class="dropdown-menu">
			<div class="dropdown-header">Seleccionar Red</div>
			{#each Object.values(SUPPORTED_NETWORKS) as net}
				<button 
					class="dropdown-item {net.chainId === walletStore.state.chainId ? 'active' : ''}"
					onclick={() => selectNetwork(net.chainId)}
				>
					<span>{net.name}</span>
					{#if net.chainId === walletStore.state.chainId}
						<span class="active-check">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.network-selector {
		position: relative;
	}

	.selector-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-card);
		border-radius: 9999px;
		color: var(--text-primary);
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.selector-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--border-card-hover);
	}

	.net-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--primary-purple);
		box-shadow: 0 0 8px var(--primary-purple-glow);
	}

	.chevron {
		transition: transform 0.2s ease;
		color: var(--text-muted);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 220px;
		background: var(--bg-card);
		border: 1px solid var(--border-card-hover);
		border-radius: 14px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
		z-index: 100;
		animation: fadeIn 0.15s ease-out;
	}

	.dropdown-header {
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 6px 10px;
		font-weight: 700;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.15s ease;
		text-align: left;
	}

	.dropdown-item:hover {
		background: var(--bg-card-hover);
		color: var(--text-primary);
	}

	.dropdown-item.active {
		background: rgba(112, 66, 248, 0.15);
		color: #a78bfa;
		font-weight: 600;
	}

	.active-check {
		font-weight: bold;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
