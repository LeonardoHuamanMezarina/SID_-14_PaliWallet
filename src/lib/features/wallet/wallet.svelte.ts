import { ethers } from 'ethers';
import type { WalletState } from './wallet.types';
import { connectWallet, switchWalletChain, getEthereumProvider, selectProvider, clearProvider } from './wallet.provider';
import { SUPPORTED_NETWORKS } from '../network/network.config';

class WalletStore {
	accountLabel = $state<string | null>(null);
	labelNotice = $state('');
	labelLoading = $state(false);
	private labelRequest = 0;

	async readAccountLabel() {
		const provider = getEthereumProvider();
		const address = this.state.account;
		if (!provider || !address || this.labelLoading) return;
		const request = ++this.labelRequest;
		this.labelLoading = true;
		this.labelNotice = '';
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const result = await Promise.race([
				provider.request({ method: 'wallet_getAccount' }),
				new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 10000); })
			]);
			if (request !== this.labelRequest || this.state.account !== address) return;
			if (typeof result?.address === 'string' && result.address.toLowerCase() === address.toLowerCase() && typeof result.label === 'string' && result.label.trim()) {
				this.accountLabel = result.label.trim().slice(0, 80);
				this.labelNotice = 'Nombre compartido por Pali; no es una identidad verificada.';
			} else {
				this.labelNotice = 'Pali no compartió un nombre para esta dirección. Se conserva la dirección conectada.';
			}
		} catch {
			if (request === this.labelRequest) this.labelNotice = 'Esta conexión no permite leer el nombre de Pali. La dirección sigue disponible.';
		} finally {
			clearTimeout(timer);
			if (request === this.labelRequest) this.labelLoading = false;
		}
	}
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

	private listeningProvider: any = null;
	private removeListeners: (()=>void) | null = null;
	private pollingTimer: ReturnType<typeof setInterval> | null = null;

	constructor() {
		// Inicializa los escuchadores de eventos en el cliente
		if (typeof window !== 'undefined') {
			this.initListeners();
		}
	}

	async connect(walletName: string = 'Pali Wallet', providerId = walletName) {
		if (this.state.status === 'connecting') return;
		this.disconnect();
		this.state.status = 'connecting';
		this.state.error = null;
		this.state.selectedWallet = walletName;

		try {
			selectProvider(providerId);
			const { account, chainId, balance, symbol } = await connectWallet();
			this.state.account = account;
			this.state.chainId = chainId;
			this.state.balance = balance;
			this.state.symbol = symbol;
			this.state.status = 'connected';
			this.initListeners();
			this.startPolling();
		} catch (err: any) {
			this.state.status = 'error';
			this.state.error = err.message || 'Error al conectar la billetera.';
		}
	}

	disconnect() {
		this.labelRequest++;
		this.accountLabel = null;
		this.labelNotice = '';
		this.labelLoading = false;
		this.removeListeners?.();
		this.removeListeners = null;
		this.listeningProvider = null;
		clearProvider();
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
			const verifiedChainId = await switchWalletChain(targetNetwork.chainIdHex);
			this.state.chainId = verifiedChainId;
			if (SUPPORTED_NETWORKS[verifiedChainId]) {
				this.state.symbol = SUPPORTED_NETWORKS[verifiedChainId].nativeCurrency.symbol;
			}
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
		const rawProvider = getEthereumProvider();
		if (!rawProvider) return;
		if (this.listeningProvider === rawProvider) return;
		this.removeListeners?.();
		this.listeningProvider = rawProvider;

		// Evento de cambio de cuenta
		const onAccounts = (accounts: string[]) => {
			this.labelRequest++;
			this.accountLabel = null;
			this.labelNotice = '';
			this.labelLoading = false;
			if (!accounts || accounts.length === 0) {
				this.disconnect();
			} else if (this.state.status === 'connected') {
				this.state.account = accounts[0];
				this.refreshBalance();
			}
		};

		// Evento de cambio de red
		const onChain = async (hexChainId: string) => {
			const chainIdNum = parseInt(hexChainId, 16);
			this.state.chainId = chainIdNum;
			if (SUPPORTED_NETWORKS[chainIdNum]) {
				this.state.symbol = SUPPORTED_NETWORKS[chainIdNum].nativeCurrency.symbol;
			}
			if (this.state.status === 'connected') {
				await this.refreshBalance();
			}
		};
		rawProvider.on?.('accountsChanged', onAccounts);
		rawProvider.on?.('chainChanged', onChain);
		this.removeListeners = () => { rawProvider.removeListener?.('accountsChanged',onAccounts); rawProvider.removeListener?.('chainChanged',onChain); };
	}
}

export const walletStore = new WalletStore();
