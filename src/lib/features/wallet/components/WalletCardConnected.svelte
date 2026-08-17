<script lang="ts">
	import { walletStore } from '../wallet.svelte';
	import { shortenAddress, formatBalance } from '../../../shared/utils/formatters';
	import { SUPPORTED_NETWORKS } from '../../network/network.config';
	import Badge from '../../../shared/ui/Badge.svelte';

	let copied = $state(false);
	let refreshing = $state(false);

	function copyAddress() {
		if (walletStore.state.account) {
			navigator.clipboard.writeText(walletStore.state.account);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		}
	}

	async function handleRefresh() {
		refreshing = true;
		await walletStore.refreshBalance();
		setTimeout(() => { refreshing = false; }, 600);
	}

	const activeNetwork = $derived(
		walletStore.state.chainId ? SUPPORTED_NETWORKS[walletStore.state.chainId] : null
	);
</script>

<div class="connected-card">
	<div class="card-header">
		<Badge variant="success">
			<span class="online-dot"></span> Conectado
		</Badge>

		<span class="wallet-type">
			{walletStore.state.selectedWallet || 'Pali Wallet'}
		</span>
	</div>

	<div class="balance-container">
		<div class="balance-header">
			<span class="balance-label">Saldo Disponible</span>
			<button class="refresh-btn {refreshing ? 'spinning' : ''}" title="Actualizar saldo" onclick={handleRefresh}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
				</svg>
			</button>
		</div>
		<div class="balance-amount">
			<span class="value">{formatBalance(walletStore.state.balance)}</span>
			<span class="symbol">{walletStore.state.symbol}</span>
		</div>
	</div>

	<div class="address-box">
		<div class="address-info">
			<span class="address-label">Dirección</span>
			<span class="address-value">{shortenAddress(walletStore.state.account, 6)}</span>
		</div>

		<button class="copy-btn" onclick={copyAddress}>
			{#if copied}
				<span>¡Copiado!</span>
			{:else}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
				</svg>
			{/if}
		</button>
	</div>

	<div class="network-info">
		<span class="net-label">Red Actual:</span>
		<span class="net-name">{activeNetwork?.name || 'Red desconocida'}</span>
	</div>

	<button class="disconnect-btn" onclick={() => walletStore.disconnect()}>
		Desconectar Billetera
	</button>
</div>

<style>
	.connected-card {
		width: 100%;
		max-width: 440px;
		background: var(--bg-card);
		border: 1px solid var(--border-card);
		border-radius: 20px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
		animation: fadeIn 0.3s ease-out;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.online-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #22c55e;
		box-shadow: 0 0 8px #22c55e;
	}

	.wallet-type {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.balance-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px;
		background: rgba(112, 66, 248, 0.06);
		border: 1px solid rgba(112, 66, 248, 0.2);
		border-radius: 14px;
	}

	.balance-header {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.balance-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.refresh-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		padding: 3px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.refresh-btn:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.1);
	}

	.refresh-btn.spinning svg {
		animation: spin 0.6s linear infinite;
	}

	.balance-amount {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-top: 4px;
	}

	.balance-amount .value {
		font-size: 2.2rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.balance-amount .symbol {
		font-size: 1.1rem;
		font-weight: 700;
		color: #a78bfa;
	}

	.address-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-card);
		border-radius: 12px;
	}

	.address-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.address-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.address-value {
		font-family: monospace;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.copy-btn {
		color: var(--text-secondary);
		font-size: 0.8rem;
		padding: 6px 12px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.copy-btn:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.1);
	}

	.network-info {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		padding: 0 4px;
	}

	.net-label {
		color: var(--text-muted);
	}

	.net-name {
		color: var(--text-primary);
		font-weight: 600;
	}

	.disconnect-btn {
		width: 100%;
		padding: 14px;
		border-radius: 12px;
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.2);
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.2s ease;
	}

	.disconnect-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.96); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
