import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../network/network.config';

/**
 * Retorna el proveedor activo de la ventana EIP-1193 (Pali Wallet o proveedor Ethereum estándar)
 */
export function getEthereumProvider() {
	if (typeof window === 'undefined') return null;
	if (window.pali) return window.pali;
	if (window.ethereum) return window.ethereum;
	return null;
}

/**
 * Verifica si la extensión Pali Wallet está instalada
 */
export function isPaliInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	return Boolean(window.pali || window.ethereum?.isPali);
}

/**
 * Verifica si existe algún proveedor de billetera Web3 instalado
 */
export function isWalletInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	return Boolean(window.ethereum || window.pali);
}

/**
 * Conecta con el proveedor y solicita las cuentas de forma segura
 */
export async function connectWallet(): Promise<{ account: string; chainId: number; balance: string; symbol: string }> {
	const rawProvider = getEthereumProvider();
	if (!rawProvider) {
		throw new Error('No se detectó Pali Wallet o un navegador Web3 compatible.');
	}

	// Intenta primero una verificación silenciosa de permisos (eth_accounts) para no abrir la ventana si ya está conectado
	let accounts: string[] = [];
	try {
		accounts = await rawProvider.request({ method: 'eth_accounts' });
	} catch (e) {
		// Ignorar y recurrir a eth_requestAccounts
	}

	if (!accounts || accounts.length === 0) {
		// Solo activa la ventana emergente de la extensión si no estaba previamente conectado
		accounts = await rawProvider.request({ method: 'eth_requestAccounts' });
	}

	if (!accounts || accounts.length === 0) {
		throw new Error('No se seleccionó ninguna cuenta en la billetera.');
	}

	const account = accounts[0];

	// Obtiene el chainId activo directamente desde el proveedor para 100% de precisión
	const hexChainId: string = await rawProvider.request({ method: 'eth_chainId' });
	const chainId = parseInt(hexChainId, 16);

	let balance = '0';
	const targetChain = SUPPORTED_NETWORKS[chainId];
	if (targetChain && targetChain.rpcUrls && targetChain.rpcUrls[0]) {
		try {
			const rpcProvider = new ethers.JsonRpcProvider(targetChain.rpcUrls[0]);
			const rawBalance = await rpcProvider.getBalance(account);
			balance = ethers.formatEther(rawBalance);
		} catch (err) {
			console.warn('No se pudo obtener el saldo desde la red RPC:', err);
		}
	}

	const symbol = SUPPORTED_NETWORKS[chainId]?.nativeCurrency.symbol || 'TSYS';

	return { account, chainId, balance, symbol };
}

/**
 * Cambia la red activa mediante wallet_switchEthereumChain o la agrega si no existe
 */
export async function switchWalletChain(chainIdHex: string): Promise<void> {
	const rawProvider = getEthereumProvider();
	if (!rawProvider) throw new Error('Proveedor no disponible.');

	// Verifica primero el chainId actual; si ya está en esta red, ¡NO llama al cambio de la extensión para evitar ventanas emergentes!
	try {
		const currentHexChainId: string = await rawProvider.request({ method: 'eth_chainId' });
		if (currentHexChainId && currentHexChainId.toLowerCase() === chainIdHex.toLowerCase()) {
			return; // Omisión silenciosa
		}
	} catch (e) {
		// Ignorar error y proceder con la solicitud de cambio
	}

	const chainIdNum = parseInt(chainIdHex, 16);
	const targetChain = SUPPORTED_NETWORKS[chainIdNum];

	try {
		await rawProvider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: chainIdHex }]
		});
	} catch (switchError: any) {
		const isUnrecognizedChain =
			switchError?.code === 4902 ||
			switchError?.code === -32603 ||
			(typeof switchError?.message === 'string' &&
				(switchError.message.includes('4902') ||
				 switchError.message.toLowerCase().includes('unrecognized') ||
				 switchError.message.toLowerCase().includes('not added') ||
				 switchError.message.toLowerCase().includes('unknown')));

		if (isUnrecognizedChain && targetChain) {
			const addChainParams = {
				chainId: targetChain.chainIdHex,
				chainName: targetChain.name,
				rpcUrls: targetChain.rpcUrls,
				nativeCurrency: targetChain.nativeCurrency,
				blockExplorerUrls: targetChain.blockExplorerUrls,
			};
			await rawProvider.request({
				method: 'wallet_addEthereumChain',
				params: [addChainParams]
			});
		} else if (typeof switchError?.message === 'string' && switchError.message.toLowerCase().includes('spam filter')) {
			throw new Error('La red RPC limitó las peticiones por filtro anti-spam. Espera unos segundos e intenta nuevamente.');
		} else {
			throw new Error(switchError?.message || 'Error al cambiar de red en la billetera.');
		}
	}
}
