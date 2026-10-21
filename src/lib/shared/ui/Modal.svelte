<script lang="ts">
	interface Props {
		isOpen: boolean;
		title?: string;
		maxWidth?: string;
		onClose: () => void;
		children?: any;
	}

	let { isOpen = false, title = '', maxWidth = '480px', onClose, children }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div class="modal-backdrop">
		<button class="backdrop-hit" onclick={onClose} aria-label="Cerrar fondo"></button>
		<div
			class="modal-card"
			style="max-width: {maxWidth};"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				{#if title}
					<h3 class="modal-title">{title}</h3>
				{/if}
				<button class="modal-close-btn" onclick={onClose} aria-label="Cerrar modal">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(4, 6, 15, 0.78);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.backdrop-hit {
		position: absolute;
		inset: 0;
		background: transparent;
		border: none;
		cursor: default;
		width: 100%;
		height: 100%;
	}

	.modal-card {
		position: relative;
		z-index: 1001;
		width: 100%;
		background: var(--bg-card);
		border: 1px solid var(--border-card-hover);
		border-radius: 20px;
		box-shadow:none;
		overflow: hidden;
		animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		flex-direction: column;
		max-height: 90vh;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 24px;
		border-bottom: 1px solid var(--border-card);
	}

	.modal-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.modal-close-btn {
		color: var(--text-muted);
		padding: 4px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.modal-close-btn:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.08);
	}

	.modal-body {
		padding: 24px;
		overflow-y: auto;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleUp {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
