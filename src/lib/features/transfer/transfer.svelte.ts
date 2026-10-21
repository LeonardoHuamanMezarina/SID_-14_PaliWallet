import { ethers } from 'ethers';
import type { TransferRecord, TransferStatus } from './transfer.types';
import { SUPPORTED_NETWORKS } from '../network/network.config';
import { getEthereumProvider } from '../wallet/wallet.provider';
import { recordTransaction } from '../history/history.service';

const STORAGE_KEY = 'microfi_transfer_history';

class TransferStore {
	currentStatus = $state<TransferStatus>('idle');
	currentRecord = $state<TransferRecord | null>(null);
	history = $state<TransferRecord[]>(this.loadHistory());
	errorMessage = $state<string | null>(null);

	private loadHistory(): TransferRecord[] {
		if (typeof window === 'undefined') return [];
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) { const items = JSON.parse(saved); return Array.isArray(items) ? items.filter(item => item && item.isSimulation === false) : []; }
		} catch (e) {
			console.warn('Error al cargar historial de transferencias:', e);
		}
		return [];
	}

	private saveHistory() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
		} catch (e) {
			console.warn('Error al guardar historial de transferencias:', e);
		}
	}

	resetStatus() {
		this.currentStatus = 'idle';
		this.errorMessage = null;
		this.currentRecord = null;
	}

	/**
	 * Ejecución real de transferencia EVM mediante el proveedor Web3 (Pali / MetaMask)
	 * No usa floats: valida y convierte a Wei mediante ethers.parseEther
	 */
	async executeRealTransfer(
		fromAddress: string,
		toAddress: string,
		amountStr: string,
		chainId: number
	): Promise<TransferRecord> {
		const targetNetwork = SUPPORTED_NETWORKS[chainId];
		if (!targetNetwork) {
			throw new Error(`Red no soportada: chainId ${chainId}`);
		}

		// Conversión a Wei sin utilizar operaciones aritméticas de coma flotante
		let weiBigInt: bigint;
		try {
			weiBigInt = ethers.parseEther(amountStr);
		} catch (e) {
			throw new Error('Formato de importe inválido para conversión on-chain');
		}

		const hexWei = '0x' + weiBigInt.toString(16);

		const recordId = 'tx_' + Date.now();
		const record: TransferRecord = {
			id: recordId,
			fromAddress,
			toAddress,
			amountEther: amountStr,
			amountWei: weiBigInt.toString(),
			chainId,
			networkName: targetNetwork.name,
			symbol: targetNetwork.nativeCurrency.symbol,
			txHash: null,
			explorerUrl: null,
			status: 'pending_signature',
			isSimulation: false,
			timestamp: Date.now(),
			error: null
		};

		this.currentRecord = record;
		this.currentStatus = 'pending_signature';
		this.errorMessage = null;

		const rawProvider = getEthereumProvider();
		if (!rawProvider) {
			record.status = 'failed';
			record.error = 'No se detectó un proveedor Web3 activo.';
			this.currentStatus = 'failed';
			this.errorMessage = record.error;
			this.history = [record, ...this.history];
			this.saveHistory();
			throw new Error(record.error);
		}

		try {
			// Solicitud de firma y transmisión mediante eth_sendTransaction
			const txParams = {
				from: fromAddress,
				to: toAddress,
				value: hexWei
			};

			const txHash: string = await rawProvider.request({
				method: 'eth_sendTransaction',
				params: [txParams]
			});

			// Transacción enviada exitosamente al mempool
			record.txHash = txHash;
			const baseUrl = targetNetwork.blockExplorerUrls[0];
			record.explorerUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/tx/${txHash}` : null;
			record.status = 'submitted';
			this.currentStatus = 'submitted';
			this.currentRecord = { ...record };

			// Guardar en Neon y respaldo local
			void recordTransaction({
				hash: txHash,
				account: fromAddress,
				chainId,
				txType: 'transfer',
				vaultName: `Transferencia a ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
				amount: amountStr,
				symbol: targetNetwork.nativeCurrency.symbol,
				status: 'pending'
			});

			// Guardar en historial con su red y hash inmutables
			this.history = [record, ...this.history.filter((h) => h.id !== record.id)];
			this.saveHistory();

			// Monitoreo en segundo plano de la confirmación mediante JsonRpcProvider público
			this.waitForReceipt(record, targetNetwork.rpcUrls[0]);

			return record;
		} catch (err: any) {
			console.error('Detalle del error en executeRealTransfer:', err);
			if (err?.code === 4001 || err?.message?.includes('User rejected') || err?.message?.includes('rejected')) {
				record.status = 'rejected';
				record.error = err?.message || 'Firma rechazada por el usuario en la billetera.';
				this.currentStatus = 'rejected';
			} else {
				record.status = 'failed';
				record.error = err?.message || 'Fallo al transmitir la transacción.';
				this.currentStatus = 'failed';
			}

			this.errorMessage = record.error;
			this.currentRecord = { ...record };
			this.history = [record, ...this.history.filter((h) => h.id !== record.id)];
			this.saveHistory();
			throw new Error(record.error || 'Error en la transferencia');
		}
	}

	/**
	 * Espera la confirmación del bloque mediante RPC público
	 */
	private async waitForReceipt(record: TransferRecord, rpcUrl: string) {
		if (!record.txHash || !rpcUrl) return;

		try {
			const provider = new ethers.JsonRpcProvider(rpcUrl);
			// Polling suave de confirmación
			const receipt = await provider.waitForTransaction(record.txHash, 1, 60000);
			if (receipt && receipt.status === 1) {
				record.status = 'confirmed';
				void recordTransaction({
					hash: record.txHash,
					account: record.fromAddress,
					chainId: record.chainId,
					txType: 'transfer',
					vaultName: `Transferencia a ${record.toAddress.slice(0, 6)}...${record.toAddress.slice(-4)}`,
					amount: record.amountEther,
					symbol: record.symbol,
					status: 'confirmed'
				});
			} else {
				record.status = 'failed';
				record.error = 'La transacción fue revertida en el bloque.';
				void recordTransaction({
					hash: record.txHash,
					account: record.fromAddress,
					chainId: record.chainId,
					txType: 'transfer',
					vaultName: `Transferencia a ${record.toAddress.slice(0, 6)}...${record.toAddress.slice(-4)}`,
					amount: record.amountEther,
					symbol: record.symbol,
					status: 'failed'
				});
			}
		} catch (e: any) {
			// Si se alcanza el timeout de 60s, marcar como enviada pendiente de confirmación
			console.warn('Timeout esperando confirmación del explorador:', e);
		}

		this.currentRecord = { ...record };
		this.currentStatus = record.status;
		this.history = this.history.map((h) => (h.id === record.id ? { ...record } : h));
		this.saveHistory();
	}

	clearHistory() {
		this.history = [];
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
	}
}

export const transferStore = new TransferStore();
