<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '../../wallet/wallet.svelte';
	import { SUPPORTED_NETWORKS } from '../../network/network.config';
	import { fetchTransactions } from '../history.service';
	import type { StoredTransaction, TxType } from '../history.types';
	import { shortenHash, formatDate } from '../../../shared/utils/formatters';
	import Icon from '../../../shared/ui/Icon.svelte';
	import Badge from '../../../shared/ui/Badge.svelte';

	let filterMode = $state<'current' | 'all'>('current');
	let transactions = $state<StoredTransaction[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const currentChainId = $derived(walletStore.state.chainId || 11155111);
	const currentAccount = $derived(walletStore.state.account);
	const activeNetwork = $derived(SUPPORTED_NETWORKS[currentChainId] || SUPPORTED_NETWORKS[11155111]);

	// Transacciones filtradas según el modo seleccionado
	const visibleTransactions = $derived(
		filterMode === 'current'
			? transactions.filter((t) => Number(t.chainId) === Number(currentChainId))
			: transactions
	);

	async function loadHistory() {
		if (!currentAccount) {
			transactions = [];
			return;
		}

		loading = true;
		error = null;
		try {
			// Consultar la API de Neon (con fallback local transparente)
			const list = await fetchTransactions(currentAccount);
			transactions = list;
		} catch (e: any) {
			console.error('Error cargando historial:', e);
			error = e.message || 'No se pudo cargar el historial de transacciones.';
		} finally {
			loading = false;
		}
	}

	// Recargar reactivamente al cambiar cuenta o red
	$effect(() => {
		if (currentAccount) {
			void loadHistory();
		}
	});

	onMount(() => {
		if (currentAccount) {
			void loadHistory();
		}
	});

	function getExplorerUrl(hash: string, chainId: number): string | null {
		const net = SUPPORTED_NETWORKS[chainId];
		if (!net || !net.blockExplorerUrls[0]) return null;
		const base = net.blockExplorerUrls[0].replace(/\/$/, '');
		return `${base}/tx/${hash}`;
	}

	function getTxLabel(type: TxType): string {
		switch (type) {
			case 'create_vault':
				return 'Creación de Alcancía';
			case 'deposit':
				return 'Aporte a Alcancía';
			case 'withdraw':
				return 'Retiro de Ahorro';
			case 'transfer':
				return 'Transferencia P2P';
			default:
				return 'Transacción Web3';
		}
	}

	function getTxIcon(type: TxType): any {
		switch (type) {
			case 'create_vault':
				return 'wallet';
			case 'deposit':
				return 'sparkles';
			case 'withdraw':
				return 'award';
			case 'transfer':
				return 'transfer';
			default:
				return 'history';
		}
	}
</script>

<div class="history-container">
	<!-- Encabezado de la Sección -->
	<div class="history-header">
		<div>
			<div class="title-row">
				<Icon name="history" size={24} />
				<h2>Historial de Transacciones</h2>
			</div>
			<p class="history-subtitle">
				Registro persistente en Neon PostgreSQL con filtrado en tiempo real según la red conectada en Pali Wallet.
			</p>
		</div>

		<div class="header-actions">
			<button class="refresh-btn" onclick={loadHistory} disabled={loading} title="Actualizar desde Neon">
				<Icon name="refresh" size={16} class={loading ? 'spin' : ''} />
				<span>{loading ? 'Consultando...' : 'Actualizar'}</span>
			</button>
		</div>
	</div>

	<!-- Selector de Filtro de Red -->
	<div class="filter-bar">
		<div class="filter-chips">
			<button
				class="filter-chip"
				class:active={filterMode === 'current'}
				onclick={() => (filterMode = 'current')}
			>
				<span class="net-dot"></span>
				<span>Red actual: <strong>{activeNetwork.name}</strong></span>
				<span class="count-badge">
					{transactions.filter((t) => Number(t.chainId) === Number(currentChainId)).length}
				</span>
			</button>

			<button
				class="filter-chip"
				class:active={filterMode === 'all'}
				onclick={() => (filterMode = 'all')}
			>
				<span>Todas las redes</span>
				<span class="count-badge">{transactions.length}</span>
			</button>
		</div>

		<div class="db-status">
			<span class="db-dot"></span>
			<span>Sincronizado con Neon DB</span>
		</div>
	</div>

	{#if error}
		<div class="error-banner">
			<Icon name="alert" size={18} />
			<span>{error}</span>
		</div>
	{/if}

	<!-- Lista de Transacciones -->
	{#if loading && visibleTransactions.length === 0}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Cargando historial desde la base de datos...</p>
		</div>
	{:else if visibleTransactions.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Icon name="history" size={38} />
			</div>
			<h3>Sin transacciones en esta red</h3>
			<p>
				{#if filterMode === 'current'}
					No se han registrado operaciones en <strong>{activeNetwork.name}</strong> para la cuenta actual.
					Realiza un depósito a tus alcancías o una transferencia para verla aquí.
				{:else}
					No hay transacciones registradas todavía con esta wallet.
				{/if}
			</p>
		</div>
	{:else}
		<div class="tx-table-wrapper">
			<table class="tx-table">
				<thead>
					<tr>
						<th>Operación</th>
						<th>Meta / Detalle</th>
						<th>Red</th>
						<th>Importe</th>
						<th>Estado</th>
						<th>Fecha</th>
						<th>Hash</th>
					</tr>
				</thead>
				<tbody>
					{#each visibleTransactions as tx (tx.hash)}
						{@const net = SUPPORTED_NETWORKS[tx.chainId]}
						{@const explorerUrl = getExplorerUrl(tx.hash, tx.chainId)}
						<tr class="tx-row">
							<td>
								<div class="type-cell">
									<div class="type-icon type-{tx.txType}">
										<Icon name={getTxIcon(tx.txType)} size={16} />
									</div>
									<strong>{getTxLabel(tx.txType)}</strong>
								</div>
							</td>
							<td>
								<span class="detail-cell">{tx.vaultName || 'MetaVault Directo'}</span>
							</td>
							<td>
								<span class="network-tag">
									{net ? net.shortName : `Chain ID: ${tx.chainId}`}
								</span>
							</td>
							<td>
								<span class="amount-cell">
									{tx.amount} <small>{tx.symbol}</small>
								</span>
							</td>
							<td>
								{#if tx.status === 'confirmed'}
									<Badge variant="success" size="sm">
										<Icon name="check" size={12} /> Confirmada
									</Badge>
								{:else if tx.status === 'pending'}
									<Badge variant="warning" size="sm">
										<span class="pulse-dot"></span> Pendiente
									</Badge>
								{:else}
									<Badge variant="danger" size="sm">
										<Icon name="x" size={12} /> Fallida
									</Badge>
								{/if}
							</td>
							<td class="date-cell">
								{tx.createdAt ? formatDate(new Date(tx.createdAt).getTime()) : 'Reciente'}
							</td>
							<td>
								{#if explorerUrl}
									<a
										href={explorerUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="hash-link"
										title="Ver en el explorador de bloques"
									>
										<span>{shortenHash(tx.hash, 4)}</span>
										<Icon name="external" size={13} />
									</a>
								{:else}
									<span class="hash-raw">{shortenHash(tx.hash, 4)}</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.history-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		flex-wrap: wrap;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.title-row h2 {
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.5px;
		color: var(--ink);
		margin: 0;
	}

	.history-subtitle {
		margin-top: 6px;
		font-size: 13px;
		color: var(--ink-muted);
		max-width: 620px;
		line-height: 1.5;
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #1e293b;
		color: #e2e8f0;
		border: 1px solid #334155;
		padding: 9px 15px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #334155;
		color: #ffffff;
	}

	.refresh-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.filter-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 18px;
		background: #111b2d;
		border: 1px solid #1e293b;
		border-radius: 14px;
		flex-wrap: wrap;
	}

	.filter-chips {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.filter-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 14px;
		background: #1a2436;
		border: 1px solid #2d3b54;
		border-radius: 10px;
		color: #94a3b8;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-chip.active {
		background: #312e81;
		border-color: #6366f1;
		color: #e0e7ff;
	}

	.net-dot {
		width: 7px;
		height: 7px;
		background: #10b981;
		border-radius: 50%;
	}

	.count-badge {
		background: #0f172a;
		padding: 2px 7px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 700;
	}

	.db-status {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 11px;
		color: #64748b;
	}

	.db-dot {
		width: 6px;
		height: 6px;
		background: #38bdf8;
		border-radius: 50%;
		box-shadow: 0 0 6px #38bdf8;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		background: #450a0a;
		border: 1px solid #991b1b;
		border-radius: 10px;
		color: #fca5a5;
		font-size: 13px;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 48px 24px;
		background: #0d1522;
		border: 1px solid #1e293b;
		border-radius: 18px;
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 16px;
		background: #1e293b;
		color: #64748b;
		border-radius: 50%;
		display: grid;
		place-items: center;
	}

	.empty-state h3 {
		font-size: 17px;
		color: var(--ink);
		margin-bottom: 8px;
	}

	.empty-state p {
		font-size: 13px;
		color: var(--ink-muted);
		max-width: 440px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.tx-table-wrapper {
		background: #0d1522;
		border: 1px solid #1e293b;
		border-radius: 18px;
		overflow-x: auto;
	}

	.tx-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 13px;
	}

	.tx-table th {
		padding: 14px 18px;
		background: #111b2d;
		color: #94a3b8;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		border-bottom: 1px solid #1e293b;
		font-weight: 600;
	}

	.tx-table td {
		padding: 16px 18px;
		border-bottom: 1px solid #162032;
		color: #e2e8f0;
	}

	.tx-row:hover td {
		background: #131d30;
	}

	.type-cell {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.type-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.type-create_vault {
		background: #312e81;
		color: #c7d2fe;
	}

	.type-deposit {
		background: #064e3b;
		color: #6ee7b7;
	}

	.type-withdraw {
		background: #4c1d95;
		color: #d8b4fe;
	}

	.type-transfer {
		background: #1e3a8a;
		color: #93c5fd;
	}

	.detail-cell {
		font-weight: 500;
		color: #f1f5f9;
	}

	.network-tag {
		background: #1e293b;
		padding: 4px 9px;
		border-radius: 6px;
		font-size: 11px;
		color: #94a3b8;
		border: 1px solid #334155;
	}

	.amount-cell {
		font-weight: 700;
		color: #f8fafc;
	}

	.amount-cell small {
		font-weight: 400;
		color: #94a3b8;
	}

	.date-cell {
		color: #64748b;
		font-size: 12px;
		white-space: nowrap;
	}

	.hash-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: #818cf8;
		text-decoration: none;
		font-family: monospace;
		font-size: 12px;
		padding: 4px 8px;
		background: #1e293b55;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.hash-link:hover {
		color: #a5b4fc;
		background: #312e8155;
		text-decoration: underline;
	}

	.hash-raw {
		font-family: monospace;
		font-size: 12px;
		color: #64748b;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		background: #f59e0b;
		border-radius: 50%;
		display: inline-block;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #334155;
		border-top-color: #6366f1;
		border-radius: 50%;
		margin: 0 auto 12px;
		animation: spin 0.8s linear infinite;
	}

	:global(.spin) {
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.filter-bar {
			flex-direction: column;
			align-items: flex-start;
		}
		.filter-chips {
			flex-direction: column;
			width: 100%;
		}
		.filter-chip {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
