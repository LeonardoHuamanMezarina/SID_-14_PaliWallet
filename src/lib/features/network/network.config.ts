import type { ChainConfig, UtxoNetworkConfig } from './network.types';

/**
 * Configuración de las redes soportadas en la aplicación (Familia EVM)
 */
export const SUPPORTED_NETWORKS: Record<number, ChainConfig> = {
	// 1. zkSYS Testnet
	57057: {
		chainId: 57057,
		chainIdHex: '0xdee1',
		name: 'zkSYS Testnet',
		shortName: 'zkSYS Testnet',
		family: 'evm',
		nativeCurrency: { name: 'TSYS', symbol: 'TSYS', decimals: 18 },
		rpcUrls: ['https://rpc-zk.tanenbaum.io'],
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
		family: 'evm',
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
		family: 'evm',
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
 * Redes de la familia UTXO (Syscoin Core)
 * Documentadas honestamente como API pendiente ya que wallet_switchEthereumChain es exclusiva de EVM.
 */
export const SUPPORTED_UTXO_NETWORKS: Record<string, UtxoNetworkConfig> = {
	'sys-utxo-testnet': {
		id: 'sys-utxo-testnet',
		name: 'Syscoin UTXO Tanenbaum Testnet',
		shortName: 'Syscoin UTXO (Testnet)',
		family: 'utxo',
		symbol: 'tSYS',
		decimals: 8,
		bech32Prefix: 'tsys1',
		isTestnet: true,
		status: 'pending_api',
		notes: 'Requiere API nativa de Pali UTXO o Syscoin RPC; no utiliza wallet_switchEthereumChain.'
	},
	'sys-utxo-mainnet': {
		id: 'sys-utxo-mainnet',
		name: 'Syscoin UTXO Mainnet',
		shortName: 'Syscoin UTXO',
		family: 'utxo',
		symbol: 'SYS',
		decimals: 8,
		bech32Prefix: 'sys1',
		isTestnet: false,
		status: 'pending_api',
		notes: 'Requiere API nativa de Pali UTXO o Syscoin RPC; no utiliza wallet_switchEthereumChain.'
	}
};

/**
 * Red por defecto al iniciar la aplicación
 */
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS[57057];
