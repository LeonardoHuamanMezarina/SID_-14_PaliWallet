<script lang="ts">
	import { walletStore } from '../wallet.svelte';
	import WalletSelector from './WalletSelector.svelte';
	import WalletCardConnected from './WalletCardConnected.svelte';
	import { SUPPORTED_NETWORKS } from '../../network/network.config';
	import Badge from '../../../shared/ui/Badge.svelte';
	import Icon from '../../../shared/ui/Icon.svelte';

	const activeNetwork = $derived(
		walletStore.state.chainId ? SUPPORTED_NETWORKS[walletStore.state.chainId] : null
	);
</script>

<div class="wallet-view-container">
	<div class="section-card">
		<div class="card-header-row">
			<div>
				<h2 class="section-title">
					<Icon name="wallet" size={22} />
					Billetera Web3 / Pali Wallet
				</h2>
				<p class="section-subtitle">
					Gestión de conexión no custodial con el proveedor EIP-1193, consulta de saldo activo y faucets de prueba.
				</p>
			</div>
			<Badge variant={walletStore.state.status === 'connected' ? 'success' : 'info'} size="md">
				{walletStore.state.status === 'connected' ? 'Billetera Conectada' : 'Desconectada'}
			</Badge>
		</div>

		<!-- Card de Conexión / Desconexión -->
		<div class="wallet-center-card">
			{#if walletStore.state.status === 'connected'}
				<WalletCardConnected />
			{:else}
				<div class="selector-wrapper">
					<p class="connect-instruction">
						Conecta tu extensión Pali Wallet o proveedor Web3 compatible para interactuar con las redes de prueba (zkSYS Tanenbaum, Hoodi o Sepolia).
					</p>
					<WalletSelector />
				</div>
			{/if}
		</div>

		<!-- Faucets y Recursos de Prueba Oficiales -->
		<div class="faucets-section">
			<h3 class="faucets-title">
				<Icon name="faucet" size={18} />
				Faucets Oficiales de Testnet para Gas
			</h3>
			<div class="faucets-grid">
				{#each Object.values(SUPPORTED_NETWORKS) as net}
					{#if net.faucets && net.faucets.length > 0}
						<div class="faucet-card">
							<div class="faucet-head">
								<span class="faucet-net">{net.name}</span>
								<Badge variant="purple" size="sm">{net.nativeCurrency.symbol}</Badge>
							</div>
							<p class="faucet-desc">
								Obtén fondos de prueba para realizar transferencias reales en {net.name}.
							</p>
							<a href={net.faucets[0]} target="_blank" rel="noopener noreferrer" class="btn-faucet">
								Abrir Faucet ↗
							</a>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.wallet-view-container {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		animation: fadeIn 0.2s ease-out;
	}

	.section-card {
		background: var(--bg-card);
		border: 1px solid var(--border-card);
		border-radius: 20px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.card-header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border-card);
	}

	.section-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-subtitle {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.wallet-center-card {
		display: flex;
		justify-content: center;
		padding: 10px 0;
	}

	.selector-wrapper {
		width: 100%;
		max-width: 440px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.connect-instruction {
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-align: center;
		line-height: 1.45;
	}

	.faucets-section {
		border-top: 1px solid var(--border-card);
		padding-top: 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.faucets-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.faucets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
	}

	.faucet-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border-card);
		border-radius: 14px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.faucet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.faucet-net {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.faucet-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.35;
	}

	.btn-faucet {
		margin-top: 6px;
		align-self: flex-start;
		background: rgba(31, 58, 95, 0.12);
		border: 1px solid rgba(31, 58, 95, 0.25);
		color: var(--ink-muted);
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-faucet:hover {
		background: rgba(31, 58, 95, 0.25);
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
