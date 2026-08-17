<script lang="ts">
	import { walletStore } from '$lib/features/wallet/wallet.svelte';
	import WalletSelector from '$lib/features/wallet/components/WalletSelector.svelte';
	import WalletCardConnected from '$lib/features/wallet/components/WalletCardConnected.svelte';
	import NetworkSelector from '$lib/features/network/components/NetworkSelector.svelte';
</script>

<svelte:head>
	<title>MicroFi P2P | Pali Wallet</title>
</svelte:head>

<div class="page-layout">
	<!-- Barra superior con Selector de Red -->
	<header class="header">
		<div class="header-logo">
			<span class="logo-dot"></span> MicroFi
		</div>
		<NetworkSelector />
	</header>

	<!-- Área de Contenido Principal -->
	<main class="main-content">
		<!-- Ícono Principal Púrpura -->
		<div class="hero-icon-wrapper">
			<div class="hero-icon-box">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="url(#purpleGlow)" fill-opacity="0.2"/>
					<path d="M7 11.5L9.5 9M9.5 9L12 11.5M9.5 9V15" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5" stroke="#D946EF" stroke-width="2" stroke-linecap="round"/>
					<circle cx="12" cy="12" r="2" fill="#7042F8"/>
					<defs>
						<radialGradient id="purpleGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 12) scale(10)">
							<stop stop-color="#7042F8"/>
							<stop offset="1" stop-color="#D946EF"/>
						</radialGradient>
					</defs>
				</svg>
			</div>
		</div>

		<!-- Título y Subtítulo -->
		<h1 class="title">MicroFi P2P</h1>
		<p class="subtitle">
			Microfinanzas descentralizadas multired.<br />
			Sin intermediarios. Sin permiso bancario.
		</p>

		<!-- Vista de Conexión de Billetera -->
		<div class="wallet-section">
			{#if walletStore.state.status === 'connected'}
				<WalletCardConnected />
			{:else}
				<WalletSelector />
			{/if}
		</div>
	</main>

	<!-- Pie de página -->
	<footer class="footer">
		<span>zkSYS • Hoodi • Sepolia</span>
		<span class="dot">•</span>
		<span>Gas &lt;$0.01</span>
		<span class="dot">•</span>
		<span>No custodial</span>
		<span class="dot">•</span>
		<span>Open source</span>
	</footer>
</div>

<style>
	.page-layout {
		width: 100%;
		max-width: 580px;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 24px 20px;
	}

	.header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 20px;
	}

	.header-logo {
		font-weight: 800;
		font-size: 1.1rem;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.logo-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--primary-purple);
		box-shadow: 0 0 10px var(--primary-purple);
	}

	.main-content {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin: auto 0;
		padding: 20px 0;
	}

	.hero-icon-wrapper {
		margin-bottom: 24px;
		position: relative;
	}

	.hero-icon-box {
		width: 88px;
		height: 88px;
		border-radius: 28px;
		background: linear-gradient(135deg, rgba(112, 66, 248, 0.2) 0%, rgba(217, 70, 239, 0.1) 100%);
		border: 1px solid rgba(112, 66, 248, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 
			0 12px 32px rgba(112, 66, 248, 0.25),
			inset 0 1px 1px rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
	}

	.title {
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.subtitle {
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--text-secondary);
		max-width: 420px;
		margin-bottom: 36px;
	}

	.wallet-section {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		font-size: 0.8rem;
		color: var(--text-muted);
		padding-top: 24px;
		flex-wrap: wrap;
	}

	.footer .dot {
		opacity: 0.4;
	}

	@media (max-width: 480px) {
		.title {
			font-size: 2.2rem;
		}
		.subtitle {
			font-size: 0.95rem;
		}
	}
</style>
