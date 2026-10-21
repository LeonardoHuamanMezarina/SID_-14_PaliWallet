<script lang="ts">
	import { walletStore } from '../../wallet/wallet.svelte';
	import { SUPPORTED_NETWORKS } from '../../network/network.config';
	import { balanceService } from '../balance.service';
	import type { NetworkBalanceItem, BalanceQueryResult } from '../balance.types';
	import { formatBalance, shortenAddress } from '../../../shared/utils/formatters';
	import Badge from '../../../shared/ui/Badge.svelte';
	import Icon from '../../../shared/ui/Icon.svelte';

	let inputAddress = $state('');
	let { useWallet = false }: {useWallet?:boolean} = $props();
	$effect(() => {
		if (useWallet && walletStore.state.account) {
			inputAddress = walletStore.state.account;
			queryResult = null;
		}
	});
	let networkScope = $state<string>('all');
	let isLoading = $state(false);
	let queryResult = $state<BalanceQueryResult | null>(null);
	let inputError = $state<string | null>(null);

	function useConnectedAddress() {
		if (walletStore.state.account) {
			inputAddress = walletStore.state.account;
			inputError = null;
		}
	}

	async function handleSearch() {
		inputError = null;
		const clean = inputAddress.trim();

		if (!clean) {
			inputError = 'Por favor ingresa una dirección EVM o UTXO.';
			return;
		}

		const family = balanceService.detectAddressFamily(clean);
		if (family === 'invalid') {
			inputError = 'Formato de dirección no reconocido. Debe ser EVM (0x... 40 hex) o Syscoin UTXO.';
			return;
		}

		isLoading = true;
		try {
			const scope = networkScope === 'all' ? 'all' : parseInt(networkScope, 10);
			const { result, isStale } = await balanceService.queryBalances(clean, scope, true);

			if (!isStale) {
				queryResult = result;
			}
		} catch (e: any) {
			inputError = e.message || 'Error al ejecutar la consulta de saldos.';
		} finally {
			isLoading = false;
		}
	}

	async function handleRetryItem(item: NetworkBalanceItem) {
		if (!queryResult) return;
		const updated = await balanceService.retrySingleNetwork(queryResult.address, item);
		queryResult.items = queryResult.items.map((i) => (i.id === updated.id ? updated : i));
	}
</script>

<div class="balance-checker-container">
	<!-- Encabezado del Requisito 4 -->
	<div class="section-card header-card">
		<div class="card-header-row">
			<div>
				<h2 class="section-title">
					<Icon name="search" size={22} />
					<span>{useWallet ? 'Mis saldos por red' : 'Consulta pública de saldos'}</span>
				</h2>
				<p class="section-subtitle">
					Consulta directa por HTTP RPC por dirección (con o sin billetera conectada), sin alterar la red activa ni abrir popups.
				</p>
			</div>
			<div class="badge-row">
				<Badge variant="cyan" size="md">EVM RPC Directo</Badge>
				<Badge variant="warning" size="md">UTXO Pendiente</Badge>
			</div>
		</div>

		<!-- Panel Educativo de Identidad y Riesgo -->
		<div class="identity-notice">
			<Icon name="info" size={20} class="notice-icon" />
			<div class="notice-body">
				<strong>Distinción Crítica de Identidad:</strong>
				<span>
					Una dirección pública o una billetera conectada <em>no constituye identidad jurídica ni solvencia económica</em>. Las herramientas de indexación on-chain (como The Graph o RPC) solo leen registros públicos de saldos y no reemplazan la validación de identidad (KYC), fuentes de ingreso ni centrales de riesgo tradicionales.
				</span>
			</div>
		</div>

		<!-- Formulario de Consulta -->
		<form class="search-form" onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
			<div class="form-row">
				<div class="input-col">
					<div class="label-row">
						<label for="search-addr">Dirección a Consultar (EVM o UTXO):</label>
						{#if walletStore.state.account}
							<button type="button" class="btn-fill-connected" onclick={useConnectedAddress}>
								Usar mi billetera ({shortenAddress(walletStore.state.account, 4)})
							</button>
						{/if}
					</div>
					<input
						id="search-addr"
						type="text"
						bind:value={inputAddress}
						placeholder="0x... o tsys1..."
						required
					/>
				</div>

				<div class="select-col">
					<label for="scope-select">Alcance de Redes:</label>
					<select id="scope-select" bind:value={networkScope}>
						<option value="all">Todas las redes configuradas</option>
						{#each Object.values(SUPPORTED_NETWORKS) as net}
							<option value={String(net.chainId)}>{net.name} ({net.nativeCurrency.symbol})</option>
						{/each}
					</select>
				</div>

				<div class="button-col">
					<button type="submit" class="btn-search" disabled={isLoading}>
						{#if isLoading}
							<span class="spinner-sm"></span> Consultando...
						{:else}
							<Icon name="search" size={16} />
							<span>Consultar RPC</span>
						{/if}
					</button>
				</div>
			</div>

			{#if inputError}
				<div class="input-error-alert">
					<Icon name="alert" size={16} />
					<span>{inputError}</span>
				</div>
			{/if}
		</form>
	</div>

	<!-- Resultados de la Consulta -->
	{#if queryResult}
		<div class="results-section">
			<div class="results-header">
				<div>
					<h3 class="results-title">
						Resultados para: <code class="target-addr">{queryResult.address}</code>
					</h3>
					<span class="family-tag">
						Familia detectada:
						<Badge variant={queryResult.detectedFamily === 'evm' ? 'purple' : 'cyan'} size="sm">
							{queryResult.detectedFamily.toUpperCase()}
						</Badge>
					</span>
				</div>
				<div class="no-sum-notice">
					<Icon name="alert" size={14} />
					<span>No se suman monedas de distintas redes (los saldos son independientes).</span>
				</div>
			</div>

			<div class="cards-grid">
				{#each queryResult.items as item}
					<div class="network-card status-{item.status}">
						<div class="card-top">
							<div class="net-title-group">
								<span class="card-net-name">{item.networkName}</span>
								<Badge variant={item.family === 'evm' ? 'purple' : 'warning'} size="sm">
									{item.family.toUpperCase()}
								</Badge>
							</div>
							<span class="currency-tag">{item.symbol}</span>
						</div>

						<div class="card-body">
							{#if item.status === 'loading'}
								<div class="loading-box">
									<span class="spinner"></span>
									<span>Consultando RPC público...</span>
								</div>
							{:else if item.status === 'success'}
								<div class="balance-display">
									<span class="balance-number">{formatBalance(item.balance, 5)}</span>
									<span class="balance-sym">{item.symbol}</span>
								</div>
								<span class="success-note">
									<Icon name="check" size={14} />
									<span>Saldo verificado por nodo RPC</span>
								</span>
							{:else if item.status === 'error'}
								<div class="error-box">
									<Badge variant="danger" size="sm">Fallo de RPC</Badge>
									<p class="error-text">{item.error}</p>
									<small class="error-disclaimer">Nota: Un error de conexión NUNCA se interpreta como saldo 0.</small>
									<button
										type="button"
										class="btn-retry"
										onclick={() => handleRetryItem(item)}
									>
										<Icon name="refresh" size={13} />
										<span>Reintentar esta red</span>
									</button>
								</div>
							{:else if item.status === 'pending_feature'}
								<div class="pending-box">
									<Badge variant="warning" size="sm">Pendiente de Integración</Badge>
									<p class="pending-text">{item.error}</p>
									<small class="pending-info">
										El protocolo UTXO de Syscoin requiere interfaz con nodo Bitcoin/Syscoin Core.
									</small>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.balance-checker-container {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		max-width: 950px;
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
		gap: 20px;
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
	}

	.section-subtitle {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.badge-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.identity-notice {
		background: rgba(31, 58, 95, 0.08);
		border: 1px solid rgba(31, 58, 95, 0.25);
		border-radius: 14px;
		padding: 14px 18px;
		display: flex;
		gap: 12px;
		font-size: 0.82rem;
		color: var(--ink-muted);
		line-height: 1.45;
	}

	.notice-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.notice-body strong {
		color: var(--ink);
		display: block;
		margin-bottom: 2px;
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 240px auto;
		gap: 14px;
		align-items: flex-end;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.input-col, .select-col {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.label-row label, .select-col label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.btn-fill-connected {
		font-size: 0.72rem;
		color: var(--ink-muted);
		background: rgba(31, 58, 95, 0.1);
		padding: 2px 8px;
		border-radius: 6px;
		font-weight: 600;
	}

	.btn-fill-connected:hover {
		background: rgba(31, 58, 95, 0.2);
	}

	.input-col input, .select-col select {
		background: var(--surface-inset);
		border: 1px solid var(--border-card);
		border-radius: 12px;
		padding: 12px 16px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.9rem;
	}

	.input-col input:focus, .select-col select:focus {
		border-color: var(--primary-purple);
		outline: none;
		box-shadow:none;
	}

	.button-col {
		display: flex;
	}

	.btn-search {
		background: var(--primary-purple);
		color: #ffffff;
		padding: 12px 20px;
		border-radius: 12px;
		font-weight: 700;
		font-size: 0.9rem;
		box-shadow:none;
		transition: all 0.2s;
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 8px;
		height: 46px;
	}

	.btn-search:hover:not(:disabled) {
		opacity: 0.92;
		transform: translateY(-1px);
	}

	.btn-search:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input-error-alert {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--danger);
		padding: 10px 14px;
		border-radius: 10px;
		font-size: 0.82rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* Sección de Resultados */
	.results-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		padding: 0 6px;
	}

	.results-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.target-addr {
		font-family: monospace;
		font-size: 0.95rem;
		color: var(--ink-muted);
		word-break: break-all;
	}

	.family-tag {
		font-size: 0.78rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
	}

	.no-sum-notice {
		font-size: 0.75rem;
		color: var(--warning);
		background: rgba(234, 179, 8, 0.1);
		padding: 4px 10px;
		border-radius: 8px;
		border: 1px solid rgba(234, 179, 8, 0.2);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	.network-card {
		background: var(--bg-card);
		border: 1px solid var(--border-card);
		border-radius: 18px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		transition: all 0.2s ease;
	}

	.network-card:hover {
		border-color: var(--border-card-hover);
		transform: translateY(-2px);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--border-card);
	}

	.net-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.card-net-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.currency-tag {
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}

	.card-body {
		min-height: 80px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.loading-box {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.balance-display {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.balance-number {
		font-size: 1.9rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.balance-sym {
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink-muted);
	}

	.success-note {
		font-size: 0.72rem;
		color: var(--success);
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.error-box {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-text {
		font-size: 0.78rem;
		color: var(--danger);
		line-height: 1.35;
	}

	.error-disclaimer {
		font-size: 0.68rem;
		color: var(--text-muted);
	}

	.btn-retry {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: var(--ink-muted);
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 600;
		align-self: flex-start;
		transition: all 0.2s;
		cursor: pointer;
	}

	.btn-retry:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	.pending-box {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.pending-text {
		font-size: 0.78rem;
		color: var(--ink-muted);
		line-height: 1.35;
	}

	.pending-info {
		font-size: 0.68rem;
		color: var(--text-muted);
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: var(--primary-purple);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner-sm {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
