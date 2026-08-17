import { ethers } from 'ethers';
import type { WalletState } from './wallet.types';
import { connectWallet, switchWalletChain, getEthereumProvider } from './wallet.provider';
import { SUPPORTED_NETWORKS } from '../network/network.config';

class WalletStore {
	// Rune $state de Svelte 5 para estado reactivo
	state = $state<WalletState>({
		status: 'disconnected',
		account: null,
		chainId: null,
		balance: null,
		symbol: 'TSYS',
		selectedWallet: null,
		error: null
	});

	private listenersInitialized = false;
	private pollingTimer: ReturnType<typeof setInterval> | null = null;

	constructor() {
		// Inicializa los escuchadores de eventos en el cliente
		if (typeof window !== 'undefined') {
			this.initListeners();
		}
	}

	async connect(walletName: string = 'Pali Wallet') {
		this.state.status = 'connecting';
		this.state.error = null;
		this.state.selectedWallet = walletName;

		try {
			const { account, chainId, balance, symbol } = await connectWallet();
			this.state.account = account;
			this.state.chainId = chainId;
			this.state.balance = balance;
			this.state.symbol = symbol;
			this.state.status = 'connected';
			this.startPolling();
		} catch (err: any) {
			this.state.status = 'error';
			this.state.error = err.message || 'Error al conectar la billetera.';
		}
	}

	disconnect() {
		this.stopPolling();
		this.state.status = 'disconnected';
		this.state.account = null;
		this.state.chainId = null;
		this.state.balance = null;
		this.state.selectedWallet = null;
		this.state.error = null;
	}

	async switchNetwork(chainId: number) {
		const targetNetwork = SUPPORTED_NETWORKS[chainId];
		if (!targetNetwork) return;

		this.state.error = null;
		try {
			await switchWalletChain(targetNetwork.chainIdHex);
			this.state.chainId = chainId;
			this.state.symbol = targetNetwork.nativeCurrency.symbol;
			await this.refreshBalance();
		} catch (err: any) {
			this.state.error = err.message || 'Error al cambiar de red.';
		}
	}

	async refreshBalance() {
		if (!this.state.account) return;
		try {
			const chainId = this.state.chainId;
			const networkConfig = chainId ? SUPPORTED_NETWORKS[chainId] : null;

			// Consulta HTTP RPC directa (evita llamar a la extensión Pali Wallet, previniendo alertas anti-spam)
			if (networkConfig && networkConfig.rpcUrls && networkConfig.rpcUrls[0]) {
				const rpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
				const rawBalance = await rpcProvider.getBalance(this.state.account);
				this.state.balance = ethers.formatEther(rawBalance);
				return;
			}

			// Recurso alternativo mediante el proveedor de la extensión si no hay URL RPC pública
			const rawProvider = getEthereumProvider();
			if (!rawProvider) return;

			const provider = new ethers.BrowserProvider(rawProvider, 'any');
			const rawBalance = await provider.getBalance(this.state.account);
			this.state.balance = ethers.formatEther(rawBalance);
		} catch (err) {
			console.warn('Error al actualizar saldo:', err);
		}
	}

	private startPolling() {
		this.stopPolling();
		// Consulta el saldo cada 8 segundos mediante RPC HTTP directo (0 llamadas a la extensión)
		this.pollingTimer = setInterval(() => {
			if (this.state.status === 'connected') {
				this.refreshBalance();
			}
		}, 8000);
	}

	private stopPolling() {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
			this.pollingTimer = null;
		}
	}

	private initListeners() {
		if (this.listenersInitialized) return;
		const rawProvider = getEthereumProvider();
		if (!rawProvider) return;

		this.listenersInitialized = true;

		// Evento de cambio de cuenta
		rawProvider.on?.('accountsChanged', (accounts: string[]) => {
			if (!accounts || accounts.length === 0) {
				this.disconnect();
			} else if (this.state.status === 'connected') {
				this.state.account = accounts[0];
				this.refreshBalance();
			}
		});

		// Evento de cambio de red
		rawProvider.on?.('chainChanged', async (hexChainId: string) => {
			const chainIdNum = parseInt(hexChainId, 16);
			this.state.chainId = chainIdNum;
			if (SUPPORTED_NETWORKS[chainIdNum]) {
				this.state.symbol = SUPPORTED_NETWORKS[chainIdNum].nativeCurrency.symbol;
			}
			if (this.state.status === 'connected') {
				await this.refreshBalance();
			}
		});
	}
}

export const walletStore = new WalletStore();
