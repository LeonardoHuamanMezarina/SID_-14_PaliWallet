export type TxType = 'create_vault' | 'deposit' | 'withdraw' | 'transfer';
export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface StoredTransaction {
	id?: number;
	hash: string;
	account: string;
	chainId: number;
	txType: TxType;
	vaultName?: string | null;
	amount: string;
	symbol: string;
	status: TxStatus;
	createdAt?: string;
}
