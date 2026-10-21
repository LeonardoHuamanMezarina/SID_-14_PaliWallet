<script lang="ts">
	interface Props {
		variant?: 'success' | 'warning' | 'info' | 'purple' | 'danger' | 'cyan' | 'neutral';
		size?: 'sm' | 'md';
		children?: any;
	}

	let { variant = 'info', size = 'md', children }: Props = $props();
</script>

<span class="badge badge-{variant} size-{size}">
	{@render children?.()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: 9999px;
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.size-sm {
		padding: 2px 8px;
		font-size: 0.7rem;
	}

	.size-md {
		padding: 4px 10px;
		font-size: 0.75rem;
	}

	.badge-success {
		background: rgba(34, 197, 94, 0.12);
		color: var(--success);
		border: 1px solid rgba(34, 197, 94, 0.25);
	}

	.badge-warning {
		background: rgba(234, 179, 8, 0.12);
		color: var(--warning);
		border: 1px solid rgba(234, 179, 8, 0.25);
	}

	.badge-danger {
		background: rgba(239, 68, 68, 0.12);
		color: var(--danger);
		border: 1px solid rgba(239, 68, 68, 0.25);
	}

	.badge-info {
		background: rgba(148, 163, 184, 0.12);
		color: var(--ink-muted);
		border: 1px solid rgba(148, 163, 184, 0.25);
	}

	.badge-purple {
		background: rgba(31, 58, 95, 0.15);
		color: var(--ink-muted);
		border: 1px solid rgba(31, 58, 95, 0.3);
	}

	.badge-cyan {
		background: rgba(31, 58, 95, 0.15);
		color: var(--ink-muted);
		border: 1px solid rgba(31, 58, 95, 0.3);
	}

	.badge-neutral {
		background: rgba(255, 255, 255, 0.06);
		color: var(--ink-muted);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>

