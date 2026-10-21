/**
 * Familia de arquitectura de red blockchain
 */
export type NetworkFamily = 'evm' | 'utxo';

/**
 * Estructura de configuración para cada red EVM soportada
 */
export interface ChainConfig {
	chainId: number;
	chainIdHex: string;
	name: string;
	shortName: string;
	family?: NetworkFamily;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	rpcUrls: string[];
	blockExplorerUrls: string[];
	faucets?: string[];
	icon?: string;
	isTestnet?: boolean;
}

/**
 * Configuración de red para la familia UTXO (Syscoin Core / Bitcoin)
 */
export interface UtxoNetworkConfig {
	id: string;
	name: string;
	shortName: string;
	family: 'utxo';
	symbol: string;
	decimals: number;
	bech32Prefix: string;
	isTestnet: boolean;
	status: 'pending_api';
	notes: string;
}
