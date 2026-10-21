import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../network/network.config';

let selectedProvider: any = null;
const discovered = new Map<string, {name:string;provider:any}>();
let discoveryStarted = false;
export function discoverWallets() {
	if (typeof window === 'undefined') return [];
	if (!discoveryStarted) {
		discoveryStarted = true;
		window.addEventListener('eip6963:announceProvider', (event: Event) => {
			const detail = (event as CustomEvent).detail;
			if (typeof detail?.info?.uuid === 'string' && typeof detail.info.name === 'string' && typeof detail.provider?.request === 'function') {
				discovered.set(detail.info.uuid, {name:detail.info.name,provider:detail.provider});
			}
		});
	}
	window.dispatchEvent(new Event('eip6963:requestProvider'));
	const win = window as any;
	const providers = [...(Array.isArray(win.ethereum?.providers) ? win.ethereum.providers : []), win.pali, win.ethereum].filter(Boolean);
	for (const provider of providers) {
		if (typeof provider.request !== 'function' || [...discovered.values()].some(v=>v.provider===provider)) continue;
		const name = provider===win.pali || provider.isPali ? 'Pali Wallet' : provider.isMetaMask ? 'MetaMask' : 'Wallet del navegador';
		discovered.set('legacy-'+name, {name,provider});
	}
	return [...discovered.entries()].map(([id,v])=>({id,name:v.name}));
}
export function selectProvider(id: string) {
	discoverWallets();
	const choice = discovered.get(id) || [...discovered.values()].find(v=>v.name===id);
	if (!choice) throw new Error('No se detectó esta wallet. Instala o habilita su extensión y vuelve a buscar.');
	selectedProvider = choice.provider;
}
export function clearProvider() { selectedProvider = null; }

/**
 * Retorna el proveedor activo de la ventana EIP-1193 (Pali Wallet o proveedor Ethereum estándar)
 */
export function getEthereumProvider(): any {
	if (typeof window === 'undefined') return null;
	return selectedProvider;
}

/**
 * Verifica si la extensión Pali Wallet está instalada
 */
export function isPaliInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	const win = window as any;
	return Boolean(win.pali || win.ethereum?.isPali);
}

/**
 * Verifica si existe algún proveedor de billetera Web3 instalado
 */
export function isWalletInstalled(): boolean {
	if (typeof window === 'undefined') return false;
	const win = window as any;
	return Boolean(win.ethereum || win.pali);
}

/**
 * Conecta con el proveedor y solicita las cuentas de forma segura
 */
export async function connectWallet(): Promise<{ account: string; chainId: number; balance: string; symbol: string }> {
	const rawProvider = getEthereumProvider();
	if (!rawProvider) {
		throw new Error('No se detectó Pali Wallet o un navegador Web3 compatible.');
	}

	// Intenta primero una verificación silenciosa de permisos (eth_accounts) para no abrir ventanas si ya está autorizado
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
 * Determina si un error de cambio de red corresponde a una red ausente/no reconocida (código 4902)
 * Incluye inspección de errores anidados en data u originalError
 * IMPORTANTE: No trata el error genérico -32603 como red ausente.
 */
function isUnrecognizedChainError(err: any): boolean {
	if (!err) return false;

	// Código 4902 directo
	if (err.code === 4902) return true;

	// Errores anidados frecuentes en MetaMask / Pali / EIP-1193
	if (err.data?.originalError?.code === 4902) return true;
	if (err.data?.code === 4902) return true;
	if (err.error?.code === 4902) return true;

	// Búsqueda en mensaje textual específico
	const msg = String(err.message || '').toLowerCase();
	if (msg.includes('4902') || msg.includes('unrecognized chain') || msg.includes('chain has not been added')) {
		return true;
	}

	return false;
}

/**
 * Cambia la red activa mediante wallet_switchEthereumChain o la agrega si no existe (4902)
 * Comprueba el chainId real tras el cambio para garantizar la sincronización.
 */
export async function switchWalletChain(chainIdHex: string): Promise<number> {
	const rawProvider = getEthereumProvider();
	if (!rawProvider) throw new Error('Proveedor Web3 no disponible.');

	// Normalizar hexadecimal (ej. 0xdee1)
	const normalizedTargetHex = chainIdHex.toLowerCase();
	const chainIdNum = parseInt(chainIdHex, 16);
	const targetChain = SUPPORTED_NETWORKS[chainIdNum];

	if (!targetChain) {
		throw new Error(`Configuración de red no encontrada para chainId ${chainIdHex}.`);
	}

	// Verifica primero el chainId actual; si ya está en esta red, no activa popup
	try {
		const currentHexChainId: string = await rawProvider.request({ method: 'eth_chainId' });
		if (currentHexChainId && currentHexChainId.toLowerCase() === normalizedTargetHex) {
			return chainIdNum; // Ya se encuentra en la red destino
		}
	} catch (e) {
		// Continuar con la solicitud de cambio
	}

	try {
		await rawProvider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: chainIdHex }]
		});
	} catch (switchError: any) {
		// Rechazo explícito del usuario
		if (switchError?.code === 4001) {
			throw new Error('Cambio de red cancelado por el usuario.');
		}

		// Detección estricta de red no registrada (4902)
		if (isUnrecognizedChainError(switchError)) {
			try {
				const addChainParams = {
					chainId: targetChain.chainIdHex,
					chainName: targetChain.name,
					rpcUrls: targetChain.rpcUrls,
					nativeCurrency: targetChain.nativeCurrency,
					blockExplorerUrls: targetChain.blockExplorerUrls
				};
				await rawProvider.request({
					method: 'wallet_addEthereumChain',
					params: [addChainParams]
				});
			} catch (addError: any) {
				if (addError?.code === 4001) {
					throw new Error('El usuario rechazó agregar la red a la billetera.');
				}
				throw new Error(addError?.message || 'Error al solicitar agregar la red a la billetera.');
			}
		} else if (switchError?.code === -32603) {
			// Error interno del RPC/nodo; NO inferir que la red falta
			throw new Error(`Error interno del proveedor (-32603): ${switchError.message || 'Fallo de comunicación con el nodo RPC'}`);
		} else {
			throw new Error(switchError?.message || 'Error al cambiar de red en la billetera.');
		}
	}

	// Verificación rigurosa del chainId real tras el cambio/adición
	const verifiedHexChainId: string = await rawProvider.request({ method: 'eth_chainId' });
	const verifiedChainId = parseInt(verifiedHexChainId, 16);

	if (verifiedChainId !== chainIdNum) {
		console.warn(`Discrepancia de chainId: esperado ${chainIdNum}, actual ${verifiedChainId}`);
	}

	return verifiedChainId;
}
