<script lang="ts">
	interface Props {
		variant?: 'success' | 'warning' | 'info' | 'purple';
		children?: any;
	}

	let { variant = 'info', children }: Props = $props();
</script>

<span class="badge badge-{variant}">
	{@render children?.()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.badge-success {
		background: rgba(34, 197, 94, 0.12);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.25);
	}

	.badge-warning {
		background: rgba(234, 179, 8, 0.12);
		color: #facc15;
		border: 1px solid rgba(234, 179, 8, 0.25);
	}

	.badge-info {
		background: rgba(148, 163, 184, 0.12);
		color: #cbd5e1;
		border: 1px solid rgba(148, 163, 184, 0.25);
	}

	.badge-purple {
		background: rgba(112, 66, 248, 0.15);
		color: #a78bfa;
		border: 1px solid rgba(112, 66, 248, 0.3);
	}
</style>
