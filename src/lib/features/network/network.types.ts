/**
 * Estructura de configuración para cada red EVM soportada
 */
export interface ChainConfig {
	chainId: number;
	chainIdHex: string;
	name: string;
	shortName: string;
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
