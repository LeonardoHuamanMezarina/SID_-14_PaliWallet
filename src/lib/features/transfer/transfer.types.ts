export type TransferStatus =
	| 'idle'
	| 'review'
	| 'pending_signature'
	| 'submitted'
	| 'confirmed'
	| 'rejected'
	| 'failed';

export interface TransferRecord {
	id: string;
	fromAddress: string;
	toAddress: string;
	amountEther: string;
	amountWei: string;
	chainId: number;
	networkName: string;
	symbol: string;
	txHash: string | null;
	explorerUrl: string | null;
	status: TransferStatus;
	isSimulation: boolean;
	timestamp: number;
	error: string | null;
}

export interface TransferFormInput {
	toAddress: string;
	amount: string;
	chainId: number;
}
