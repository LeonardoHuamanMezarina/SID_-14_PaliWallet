<script lang="ts">
	import { walletStore } from '../wallet.svelte';
	import { isPaliInstalled } from '../wallet.provider';

	const paliAvailable = typeof window !== 'undefined' ? isPaliInstalled() : false;

	const wallets = [
		{
			id: 'pali',
			name: 'Pali Wallet',
			badge: 'Recomendada (Syscoin)',
			highlight: true,
			iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M19 7H5C3.89543 7 3 7.89543 3 9V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7Z" stroke="#7042F8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" fill="#7042F8"/>
				<path d="M7 7V5C7 4.46957 7.21071 3.96086 7.58579 3.58579C7.96086 3.21071 8.46957 3 9 3H15C15.5304 3 16.0391 3.21071 16.4142 3.58579C16.7893 3.96086 17 4.46957 17 5V7" stroke="#7042F8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`
		}
	];

	function handleConnect(walletId: string, walletName: string) {
		walletStore.connect(walletName);
	}
</script>

<div class="wallet-selector-container">
	{#if walletStore.state.error}
		<div class="error-banner">
			<span>⚠️ {walletStore.state.error}</span>
		</div>
	{/if}

	<div class="wallet-list">
		{#each wallets as wallet}
			<button 
				class="wallet-card {wallet.highlight ? 'wallet-highlight' : ''}" 
				onclick={() => handleConnect(wallet.id, wallet.name)}
				disabled={walletStore.state.status === 'connecting'}
			>
				<div class="wallet-icon-box">
					{@html wallet.iconSvg}
				</div>

				<div class="wallet-info">
					<span class="wallet-name">{wallet.name}</span>
					{#if wallet.badge}
						<span class="wallet-badge">{wallet.badge}</span>
					{/if}
				</div>

				<div class="wallet-action">
					{#if walletStore.state.status === 'connecting' && walletStore.state.selectedWallet === wallet.name}
						<div class="spinner"></div>
					{:else}
						<svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none">
							<path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.wallet-selector-container {
		width: 100%;
		max-width: 440px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #f87171;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 0.85rem;
		text-align: center;
		animation: fadeIn 0.3s ease;
	}

	.wallet-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.wallet-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 16px 20px;
		background-color: var(--bg-card);
		border: 1px solid var(--border-card);
		border-radius: 16px;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		text-align: left;
	}

	.wallet-card:hover:not(:disabled) {
		background-color: var(--bg-card-hover);
		border-color: var(--border-card-hover);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.wallet-card:active:not(:disabled) {
		transform: translateY(0);
		background-color: var(--bg-card-active);
	}

	.wallet-highlight {
		border-color: rgba(112, 66, 248, 0.4);
		background: linear-gradient(135deg, rgba(112, 66, 248, 0.08) 0%, rgba(17, 20, 37, 1) 100%);
	}

	.wallet-highlight:hover:not(:disabled) {
		border-color: var(--primary-purple);
		box-shadow: 0 8px 25px var(--primary-purple-glow);
	}

	.wallet-icon-box {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.wallet-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		margin-left: 16px;
	}

	.wallet-name {
		color: var(--text-primary);
		font-size: 1.05rem;
		font-weight: 600;
	}

	.wallet-badge {
		font-size: 0.72rem;
		color: #a78bfa;
		font-weight: 600;
	}

	.wallet-action {
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s ease, transform 0.2s ease;
	}

	.wallet-card:hover .wallet-action {
		color: var(--text-primary);
		transform: translateX(3px);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: var(--primary-purple);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
