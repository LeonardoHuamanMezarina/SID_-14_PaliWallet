import type { NetworkFamily } from '../network/network.types';

export type BalanceStatus = 'idle' | 'loading' | 'success' | 'error' | 'pending_feature';

export interface NetworkBalanceItem {
	id: string; // chainId numérico o id de UTXO
	networkName: string;
	family: NetworkFamily;
	symbol: string;
	status: BalanceStatus;
	balance: string | null;
	balanceRaw: string | null;
	error: string | null;
	lastChecked: number | null;
	rpcUrl: string;
}

export interface BalanceQueryResult {
	address: string;
	detectedFamily: NetworkFamily | 'invalid';
	items: NetworkBalanceItem[];
	queryTimestamp: number;
}
