/**
 * Estados posibles de la conexión de la billetera
 */
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Opción de billetera disponible en el selector
 */
export interface WalletOption {
	id: string;
	name: string;
	description?: string;
	iconSvg?: string;
	badge?: string;
	isInstalled: boolean;
}

/**
 * Estado global de la billetera en la aplicación
 */
export interface WalletState {
	status: WalletStatus;
	account: string | null;
	chainId: number | null;
	balance: string | null;
	symbol: string;
	selectedWallet: string | null;
	error: string | null;
}
