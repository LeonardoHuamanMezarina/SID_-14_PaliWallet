<script lang="ts">
	import { walletStore } from '../../wallet/wallet.svelte';
	import { SUPPORTED_NETWORKS, DEFAULT_NETWORK, SUPPORTED_UTXO_NETWORKS } from '../network.config';
	import { utxoAdapter } from '../utxo.adapter';
	import Badge from '../../../shared/ui/Badge.svelte';
	import Icon from '../../../shared/ui/Icon.svelte';

	let isOpen = $state(false);
	let utxoNotice = $state<string | null>(null);

	const activeNetwork = $derived(
		walletStore.state.chainId ? SUPPORTED_NETWORKS[walletStore.state.chainId] : DEFAULT_NETWORK
	);

	function selectNetwork(chainId: number) {
		utxoNotice = null;
		walletStore.switchNetwork(chainId);
		isOpen = false;
	}

	async function selectUtxo(utxoId: string) {
		const res = await utxoAdapter.selectUtxoNetwork(utxoId);
		utxoNotice = res.notice;
		isOpen = false;
	}
</script>

<div class="network-selector-wrapper">
	<div class="network-selector">
		<button class="selector-btn" onclick={() => (isOpen = !isOpen)} title="Cambiar red activa">
			<span class="net-dot"></span>
			<span class="net-title">{activeNetwork?.shortName || 'zkSYS'}</span>
			<Badge variant="purple" size="sm">EVM</Badge>
			<svg class="chevron {isOpen ? 'open' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none">
				<path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		</button>

		{#if isOpen}
			<div class="dropdown-menu" role="menu" tabindex="-1">
				<!-- SECCIÓN EVM -->
				<div class="dropdown-header">
					<span>Redes EVM EIP-1193</span>
					<Badge variant="cyan" size="sm">Activas</Badge>
				</div>
				{#each Object.values(SUPPORTED_NETWORKS) as net}
					<button
						class="dropdown-item {net.chainId === walletStore.state.chainId ? 'active' : ''}"
						onclick={() => selectNetwork(net.chainId)}
					>
						<div class="net-info-col">
							<span class="item-name">{net.name}</span>
							<span class="item-meta">ID {net.chainId} ({net.chainIdHex}) • {net.nativeCurrency.symbol}</span>
						</div>
						{#if net.chainId === walletStore.state.chainId}
							<span class="active-check">
								<Icon name="check" size={14} />
							</span>
						{/if}
					</button>
				{/each}

				<!-- SECCIÓN UTXO -->
				<div class="dropdown-header utxo-header">
					<span>Familia UTXO (Syscoin Core)</span>
					<Badge variant="warning" size="sm">Pendiente</Badge>
				</div>
				<div class="utxo-disclaimer">
					Requiere API nativa de Pali UTXO; no usa wallet_switchEthereumChain.
				</div>
				{#each Object.values(SUPPORTED_UTXO_NETWORKS) as utxo}
					<button
						class="dropdown-item utxo-item"
						onclick={() => selectUtxo(utxo.id)}
					>
						<div class="net-info-col">
							<span class="item-name">{utxo.name}</span>
							<span class="item-meta">{utxo.bech32Prefix}... • 8 dec • No disponible</span>
						</div>
						<Badge variant="neutral" size="sm">Adapter</Badge>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if utxoNotice}
		<div class="utxo-notice-toast">
			<div class="toast-content">
				<Icon name="alert" size={16} />
				<span>{utxoNotice}</span>
			</div>
			<button class="toast-close" onclick={() => (utxoNotice = null)} aria-label="Cerrar">
				<Icon name="x" size={12} />
			</button>
		</div>
	{/if}
</div>

<style>
	.network-selector-wrapper {
		position: relative;
		display: inline-block;
	}

	.network-selector {
		position: relative;
	}

	.selector-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 14px;
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
		background-color: var(--surface);
		box-shadow:none;
	}

	.net-title {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		width: 310px;
		background: var(--bg-card);
		border: 1px solid var(--border-card-hover);
		border-radius: 16px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		box-shadow:none;
		z-index: 200;
		animation: fadeIn 0.15s ease-out;
		max-height: 480px;
		overflow-y: auto;
	}

	.dropdown-header {
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 8px 10px 4px 10px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.utxo-header {
		margin-top: 8px;
		border-top: 1px solid var(--border-card);
		padding-top: 10px;
	}

	.utxo-disclaimer {
		font-size: 0.7rem;
		color: var(--warning);
		background: rgba(234, 179, 8, 0.08);
		padding: 6px 10px;
		border-radius: 8px;
		margin: 2px 4px 6px 4px;
		line-height: 1.35;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-radius: 10px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.15s ease;
		text-align: left;
		gap: 8px;
	}

	.dropdown-item:hover {
		background: var(--bg-card-hover);
		color: var(--text-primary);
	}

	.dropdown-item.active {
		background: rgba(31, 58, 95, 0.15);
		color: var(--ink-muted);
		font-weight: 600;
	}

	.net-info-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.item-meta {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.active-check {
		font-weight: bold;
		color: var(--success);
	}

	.utxo-notice-toast {
		position: absolute;
		top: calc(100% + 12px);
		right: 0;
		width: 320px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 10px 14px;
		font-size: 0.78rem;
		color: var(--ink-muted);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		box-shadow:none;
		z-index: 210;
		animation: fadeIn 0.2s ease;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
	}

	.toast-close {
		color: var(--ink-muted);
		font-size: 0.9rem;
		padding: 2px 6px;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
