<script lang="ts">
	import { walletStore } from '../../wallet/wallet.svelte';
	import { SUPPORTED_NETWORKS } from '../../network/network.config';
	import { transferStore } from '../transfer.service';
	import { isValidEvmAddress, validateAmount } from '../../../shared/utils/validators';
	import { shortenAddress, shortenHash, formatDate } from '../../../shared/utils/formatters';
	import Badge from '../../../shared/ui/Badge.svelte';
	import Modal from '../../../shared/ui/Modal.svelte';
	import Icon from '../../../shared/ui/Icon.svelte';

	let toAddress = $state('');
	let amountStr = $state('');
	let selectedChainId = $state<number>(walletStore.state.chainId || 57057);

	let isReviewModalOpen = $state(false);
	let formError = $state<string | null>(null);
	let isExecuting = $state(false);

	const targetNetwork = $derived(SUPPORTED_NETWORKS[selectedChainId] || SUPPORTED_NETWORKS[57057]);
	const currentBalanceNum = $derived(
		walletStore.state.balance ? parseFloat(walletStore.state.balance) : 0
	);

	function setMaxBalance() {
		if (walletStore.state.balance) {
			// Dejar un pequeño margen para gas si es la red activa
			const bal = parseFloat(walletStore.state.balance);
			const safeBal = Math.max(0, bal - 0.002);
			amountStr = safeBal > 0 ? safeBal.toFixed(4) : bal.toString();
		}
	}

	function validateForm(): boolean {
		formError = null;

		if (!isValidEvmAddress(toAddress)) {
			formError = 'La dirección de destino no tiene un formato EVM válido (0x... 40 caracteres).';
			return false;
		}

		const valResult = validateAmount(amountStr, { min: 0.000001 });
		if (!valResult.valid) {
			formError = valResult.error || 'Monto inválido';
			return false;
		}

		if (walletStore.state.status === 'connected' && walletStore.state.chainId === selectedChainId) {
			const reqNum = parseFloat(amountStr);
			if (reqNum > currentBalanceNum) {
				formError = `Saldo insuficiente en ${targetNetwork.nativeCurrency.symbol}. Tienes ${walletStore.state.balance || '0'}`;
				return false;
			}
		}

		return true;
	}

	function handleOpenReview() {
		if (validateForm()) {
			isReviewModalOpen = true;
		}
	}

	async function executeReal() {
		if (!walletStore.state.account) {
			formError = 'Debes conectar tu billetera Pali o Web3 para enviar transferencias reales.';
			return;
		}

		// Comprobar que la billetera esté en la red seleccionada
		if (walletStore.state.chainId !== selectedChainId) {
			try {
				await walletStore.switchNetwork(selectedChainId);
			} catch (e: any) {
				formError = `Debes cambiar tu billetera a ${targetNetwork.name} para continuar.`;
				return;
			}
		}

		isExecuting = true;
		try {
			await transferStore.executeRealTransfer(
				walletStore.state.account,
				toAddress.trim(),
				amountStr.trim(),
				selectedChainId
			);
			isReviewModalOpen = false;
			toAddress = '';
			amountStr = '';
		} catch (e) {
			// El error ya queda en transferStore
		} finally {
			isExecuting = false;
		}
	}

	function resetCurrentStatus() {
		transferStore.resetStatus();
	}
</script>

<div class="transfer-wrapper">
	<div class="header-card">
		<div class="header-top">
			<div>
				<h2 class="section-title">
					<Icon name="transfer" size={22} />
					<span>Requisito 2: Transferencias Cuenta a Cuenta</span>
				</h2>
				<p class="section-subtitle">
					Envío EVM responsable con validación estricta, revisión previa de firma y trazabilidad real en explorador.
				</p>
			</div>
			<div class="badge-row">
				<Badge variant="cyan" size="md">EVM Real Habilitado</Badge>
			</div>
		</div>

		<!-- Estado de Transacción en Progreso -->
		{#if transferStore.currentStatus !== 'idle'}
			<div class="status-panel status-{transferStore.currentStatus}">
				<div class="status-top">
					<div class="status-indicator">
						{#if transferStore.currentStatus === 'pending_signature'}
							<span class="spinner"></span>
							<strong>Firma Pendiente en Billetera</strong>
						{:else if transferStore.currentStatus === 'submitted'}
							<span class="spinner"></span>
							<strong>Transacción Enviada al Mempool</strong>
						{:else if transferStore.currentStatus === 'confirmed'}
							<Icon name="check" size={16} />
							<strong>¡Transacción Confirmada!</strong>
						{:else if transferStore.currentStatus === 'rejected'}
							<Icon name="x" size={16} />
							<strong>Firma Rechazada por el Usuario</strong>
						{:else}
							<Icon name="x" size={16} />
							<strong>Fallo en la Transacción</strong>
						{/if}
					</div>

					<button class="btn-dismiss" onclick={resetCurrentStatus} aria-label="Cerrar">
						<Icon name="x" size={14} />
					</button>
				</div>

				<div class="status-details">
					{#if transferStore.currentRecord}
						<div class="status-row">
							<span>Destino:</span>
							<code>{shortenAddress(transferStore.currentRecord.toAddress, 8)}</code>
						</div>
						<div class="status-row">
							<span>Importe:</span>
							<strong>{transferStore.currentRecord.amountEther} {transferStore.currentRecord.symbol}</strong>
						</div>
						<div class="status-row">
							<span>Red:</span>
							<span>{transferStore.currentRecord.networkName}</span>
						</div>
						{#if transferStore.currentRecord.txHash}
							<div class="status-row">
								<span>Hash Real:</span>
								{#if transferStore.currentRecord.explorerUrl}
									<a
										href={transferStore.currentRecord.explorerUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="tx-link"
									>
										{shortenHash(transferStore.currentRecord.txHash, 8)} ↗
									</a>
								{:else}
									<code>{shortenHash(transferStore.currentRecord.txHash, 8)}</code>
								{/if}
							</div>
						{/if}
						
					{/if}

					{#if transferStore.errorMessage}
						<div class="error-msg-box">
							<Icon name="alert" size={16} />
							<span>{transferStore.errorMessage}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Formulario de Transferencia -->
		<form class="transfer-form" onsubmit={(e) => { e.preventDefault(); handleOpenReview(); }}>
			<div class="form-grid">
				<!-- Red Destino -->
				<div class="field-item full-width">
					<label for="transfer-chain">Red de Transmisión:</label>
					<div class="select-wrapper">
						<select id="transfer-chain" bind:value={selectedChainId}>
							{#each Object.values(SUPPORTED_NETWORKS) as net}
								<option value={net.chainId}>
									{net.name} ({net.nativeCurrency.symbol}) - Chain ID: {net.chainId}
								</option>
							{/each}
						</select>
					</div>
					<small class="field-hint">
						{#if walletStore.state.chainId !== selectedChainId && walletStore.state.status === 'connected'}
							<span class="warn-hint">
								<Icon name="alert" size={14} />
								Tu billetera está en otra red. Al enviar se solicitará cambiar de red.
							</span>
						{:else}
							Red EVM seleccionada para emitir la transacción.
						{/if}
					</small>
				</div>

				<!-- Dirección Destino -->
				<div class="field-item full-width">
					<label for="dest-address">Dirección de Destino (EVM):</label>
					<input
						id="dest-address"
						type="text"
						bind:value={toAddress}
						placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
						required
					/>
					<small class="field-hint">Debe ser una dirección EVM hexadecimal de 42 caracteres (0x...).</small>
				</div>

				<!-- Monto a Transferir -->
				<div class="field-item full-width">
					<div class="label-with-action">
						<label for="transfer-amount">Monto a Enviar:</label>
						{#if walletStore.state.status === 'connected'}
							<button type="button" class="btn-max" onclick={setMaxBalance}>
								Máximo: {walletStore.state.balance || '0'} {targetNetwork.nativeCurrency.symbol}
							</button>
						{/if}
					</div>
					<div class="input-with-symbol">
						<input
							id="transfer-amount"
							type="text"
							bind:value={amountStr}
							placeholder="0.05"
							required
						/>
						<span class="currency-badge">{targetNetwork.nativeCurrency.symbol}</span>
					</div>
					<small class="field-hint">
						Las unidades on-chain se procesan en Wei estricto sin pérdida de precisión por redondeo flotante.
					</small>
				</div>
			</div>

			{#if formError}
				<div class="form-error-alert">
					<Icon name="alert" size={16} />
					<span>{formError}</span>
				</div>
			{/if}

			<div class="form-submit-row">
				<button type="submit" class="btn-review">
					<Icon name="search" size={16} />
					<span>Revisar Transferencia Antes de Firmar</span>
				</button>
			</div>
		</form>
	</div>

	<!-- Historial de Transferencias Inmutable -->
	<div class="history-section">
		<div class="history-header">
			<div>
				<h3 class="history-title">
					<Icon name="file-text" size={18} />
					<span>Registro de Transferencias</span>
				</h3>
				<p class="history-subtitle">
					Red y hash preservados con inmutabilidad original, independiente de cambios posteriores de red en la billetera.
				</p>
			</div>
			{#if transferStore.history.length > 0}
				<button class="btn-clear" onclick={() => transferStore.clearHistory()}>
					Limpiar Historial
				</button>
			{/if}
		</div>

		{#if transferStore.history.length === 0}
			<div class="empty-history">
				<p>Aún no has realizado transferencias en esta sesión.</p>
				<small>Usa el formulario superior para probar una transferencia en la red de prueba.</small>
			</div>
		{:else}
			<div class="history-table-wrapper">
				<table class="history-table">
					<thead>
						<tr>
							<th>Fecha</th>
							<th>Red Original</th>
							<th>Destino</th>
							<th>Importe</th>
							<th>Hash / Explorador</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						{#each transferStore.history as item}
							<tr>
								<td class="col-date">{formatDate(item.timestamp)}</td>
								<td>
									<Badge variant="purple" size="sm">{item.networkName}</Badge>
								</td>
								<td class="col-mono">{shortenAddress(item.toAddress, 4)}</td>
								<td><strong>{item.amountEther} {item.symbol}</strong></td>
								<td>
									{#if item.explorerUrl && item.txHash}
										<a href={item.explorerUrl} target="_blank" rel="noopener noreferrer" class="tx-link">
											{shortenHash(item.txHash, 4)} ↗
										</a>
									{:else if item.txHash}
										<span class="col-mono">{shortenHash(item.txHash, 4)}</span>
									{:else}
										<span class="text-muted">-</span>
									{/if}
								</td>
								<td>
									{#if item.status === 'confirmed'}
										<Badge variant="success" size="sm">Confirmada</Badge>
									{:else if item.status === 'submitted'}
										<Badge variant="cyan" size="sm">Enviada</Badge>
									{:else if item.status === 'pending_signature'}
										<Badge variant="warning" size="sm">Pendiente Firma</Badge>
									{:else if item.status === 'rejected'}
										<Badge variant="danger" size="sm">Rechazada</Badge>
									{:else}
										<Badge variant="danger" size="sm">Fallida</Badge>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Modal de Revisión Previa a la Firma -->
<Modal
	isOpen={isReviewModalOpen}
	title="Revisar Detalles de Transferencia"
	onClose={() => { if (!isExecuting) isReviewModalOpen = false; }}
>
	<div class="review-modal-content">
		<div class="review-alert">
			<Icon name="alert" size={16} />
			<span><strong>Advertencia de Seguridad:</strong> Las transacciones emitidas a la blockchain son permanentes e irreversibles. Asegúrate de que la dirección de destino pertenezca a la red seleccionada.</span>
		</div>

		<div class="review-grid">
			<div class="review-item">
				<span class="review-label">Red Destino:</span>
				<span class="review-value highlight">{targetNetwork.name} (Chain ID: {targetNetwork.chainId})</span>
			</div>
			<div class="review-item">
				<span class="review-label">Dirección Origen:</span>
				<span class="review-value font-mono">
					{walletStore.state.account ? walletStore.state.account : 'Cuenta conectada en billetera'}
				</span>
			</div>
			<div class="review-item">
				<span class="review-label">Dirección Destino:</span>
				<span class="review-value font-mono">{toAddress}</span>
			</div>
			<div class="review-item">
				<span class="review-label">Importe a Transferir:</span>
				<span class="review-value amount-lg">
					{amountStr} {targetNetwork.nativeCurrency.symbol}
				</span>
			</div>
		</div>

		<div class="review-actions">
			

			<button
				type="button"
				class="btn-real-transfer"
				onclick={executeReal}
				disabled={isExecuting || walletStore.state.status !== 'connected'}
				title={walletStore.state.status !== 'connected' ? 'Conecta tu billetera para firmar' : ''}
			>
				{#if isExecuting}
					<span class="spinner-sm"></span> Transmitiendo...
				{:else}
					<Icon name="transfer" size={16} />
					<span>Confirmar y Firmar con Billetera (EVM Real)</span>
				{/if}
			</button>
		</div>

		{#if walletStore.state.status !== 'connected'}
			<p class="connect-hint">
				* Para enviar con firma real, conecta tu billetera Pali o Web3 en la parte superior.
			</p>
		{/if}
	</div>
</Modal>

<style>
	.transfer-wrapper {
		display: flex;
		flex-direction: column;
		gap: 32px;
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		animation: fadeIn 0.2s ease-out;
	}

	.header-card {
		background: var(--bg-card);
		border: 1px solid var(--border-card);
		border-radius: 20px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.header-top {
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
		flex-wrap: wrap;
	}

	/* Panel de Estado */
	.status-panel {
		border-radius: 14px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		animation: fadeIn 0.2s ease-out;
	}

	.status-pending_signature, .status-submitted {
		background: rgba(31, 58, 95, 0.1);
		border: 1px solid rgba(31, 58, 95, 0.3);
		color: var(--ink-muted);
	}

	.status-confirmed {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: var(--success);
	}

	.status-rejected, .status-failed {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--danger);
	}

	.status-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.95rem;
	}

	.check-icon {
		color: var(--success);
		font-weight: bold;
		font-size: 1.1rem;
	}

	.error-icon {
		color: var(--danger);
		font-weight: bold;
		font-size: 1.1rem;
	}

	.btn-dismiss {
		color: var(--text-muted);
		padding: 2px 6px;
		font-size: 0.85rem;
		border-radius: 4px;
	}

	.status-details {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.82rem;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	

	.tx-link {
		color: var(--ink-muted);
		text-decoration: underline;
		font-weight: 600;
	}

	.error-msg-box {
		padding: 8px 12px;
		background: rgba(239, 68, 68, 0.15);
		border-radius: 8px;
		color: var(--danger);
		margin-top: 4px;
	}

	/* Formulario */
	.transfer-form {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-item label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.field-hint {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.select-wrapper select,
	.field-item input {
		width: 100%;
		background: var(--surface-inset);
		border: 1px solid var(--border-card);
		border-radius: 12px;
		padding: 12px 16px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.92rem;
		transition: border-color 0.2s;
	}

	.select-wrapper select:focus,
	.field-item input:focus {
		border-color: var(--primary-purple);
		outline: none;
		box-shadow:none;
	}

	.label-with-action {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.btn-max {
		font-size: 0.75rem;
		color: var(--ink-muted);
		background: rgba(31, 58, 95, 0.12);
		padding: 2px 8px;
		border-radius: 6px;
		font-weight: 600;
	}

	.btn-max:hover {
		background: rgba(31, 58, 95, 0.25);
	}

	.input-with-symbol {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-symbol input {
		padding-right: 70px;
	}

	.currency-badge {
		position: absolute;
		right: 12px;
		font-weight: 700;
		color: var(--ink-muted);
		font-size: 0.85rem;
		pointer-events: none;
	}

	.form-error-alert {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--danger);
		padding: 10px 14px;
		border-radius: 10px;
		font-size: 0.82rem;
	}

	.btn-review {
		width: 100%;
		background: var(--primary-purple);
		color: #ffffff;
		padding: 14px;
		border-radius: 12px;
		font-weight: 700;
		font-size: 0.95rem;
		box-shadow:none;
		transition: all 0.2s;
	}

	.btn-review:hover {
		opacity: 0.93;
		transform: translateY(-1px);
	}

	/* Historial */
	.history-section {
		background: var(--bg-card);
		border: 1px solid var(--border-card);
		border-radius: 20px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.history-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
	}

	.history-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.history-subtitle {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.btn-clear {
		font-size: 0.75rem;
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.empty-history {
		padding: 24px;
		text-align: center;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.01);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.history-table-wrapper {
		overflow-x: auto;
	}

	.history-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
		text-align: left;
	}

	.history-table th {
		padding: 10px 12px;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-card);
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.7rem;
		letter-spacing: 0.05em;
	}

	.history-table td {
		padding: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		color: var(--text-secondary);
	}

	.col-date {
		white-space: nowrap;
		color: var(--text-muted);
	}

	.col-mono {
		font-family: monospace;
		font-size: 0.85rem;
	}

	/* Modal de Revisión */
	.review-modal-content {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.review-alert {
		background: rgba(234, 179, 8, 0.1);
		border: 1px solid rgba(234, 179, 8, 0.25);
		color: var(--warning);
		padding: 10px 14px;
		border-radius: 10px;
		font-size: 0.78rem;
		line-height: 1.4;
	}

	.review-grid {
		background: var(--surface-inset);
		border: 1px solid var(--border-card);
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.review-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.review-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.review-value {
		font-size: 0.9rem;
		color: var(--text-primary);
		word-break: break-all;
	}

	.review-value.highlight {
		color: var(--ink-muted);
		font-weight: 600;
	}

	.review-value.font-mono {
		font-family: monospace;
	}

	.review-value.amount-lg {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--ink-muted);
	}

	.review-actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	

	

	.btn-real-transfer {
		background: var(--primary-purple);
		color: #ffffff;
		padding: 14px;
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.92rem;
		box-shadow:none;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.btn-real-transfer:hover:not(:disabled) {
		opacity: 0.92;
	}

	.btn-real-transfer:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.connect-hint {
		font-size: 0.72rem;
		color: var(--text-muted);
		text-align: center;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: #a78bfa;
		border-radius: 50%;
		display: inline-block;
		animation: spin 0.8s linear infinite;
	}

	.spinner-sm {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		display: inline-block;
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
