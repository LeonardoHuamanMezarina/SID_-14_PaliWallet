import type { ChainConfig } from './network.types';

/**
 * Configuración de las redes soportadas en la aplicación
 */
export const SUPPORTED_NETWORKS: Record<number, ChainConfig> = {
	// 1. zkSYS Testnet
	57057: {
		chainId: 57057,
		chainIdHex: '0xdf49',
		name: 'zkSYS Testnet',
		shortName: 'zkSYS Testnet',
		nativeCurrency: { name: 'TSYS', symbol: 'TSYS', decimals: 18 },
		rpcUrls: ['https://rpc.tanenbaum.io', 'https://rpc-zk.tanenbaum.io/'],
		blockExplorerUrls: ['https://explorer-zk.tanenbaum.io'],
		faucets: [
			'https://faucet-zk.tanenbaum.io'
		],
		isTestnet: true
	},
	// 2. Ethereum Hoodi
	560048: {
		chainId: 560048,
		chainIdHex: '0x88bb0',
		name: 'Ethereum Hoodi',
		shortName: 'Ethereum Hoodi',
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		rpcUrls: ['https://0xrpc.io/hoodi'],
		blockExplorerUrls: ['https://hoodi.etherscan.io/'],
		faucets: [
			'https://cloud.google.com/application/web3/faucet/ethereum/hoodi'
		],
		isTestnet: true
	},
	// 3. Ethereum Sepolia
	11155111: {
		chainId: 11155111,
		chainIdHex: '0xaa36a7',
		name: 'Ethereum Sepolia',
		shortName: 'Ethereum Sepolia',
		nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
		rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com/'],
		blockExplorerUrls: ['https://sepolia.etherscan.io/'],
		faucets: [
			'https://cloud.google.com/application/web3/faucet/ethereum/sepolia'
		],
		isTestnet: true
	}
};

/**
 * Red por defecto al iniciar la aplicación
 */
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS[57057];
