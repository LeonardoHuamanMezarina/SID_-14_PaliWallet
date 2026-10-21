import { ethers } from 'ethers';
import type { NetworkBalanceItem, BalanceQueryResult } from './balance.types';
import { SUPPORTED_NETWORKS, SUPPORTED_UTXO_NETWORKS } from '../network/network.config';
import { isValidEvmAddress, isValidUtxoAddress } from '../../shared/utils/validators';

class BalanceService {
	private activeQueryId = 0;

	/**
	 * Detecta a qué familia pertenece la dirección provista
	 */
	detectAddressFamily(address: string): 'evm' | 'utxo' | 'invalid' {
		if (isValidEvmAddress(address)) return 'evm';
		if (isValidUtxoAddress(address)) return 'utxo';
		return 'invalid';
	}

	/**
	 * Realiza la consulta de saldo a un endpoint RPC EVM con timeout de 6000ms
	 * NUNCA muestra error como saldo cero.
	 */
	async fetchEvmBalance(
		address: string,
		rpcUrl: string,
		timeoutMs = 6000
	): Promise<{ balance: string; rawWei: string }> {
		const provider = new ethers.JsonRpcProvider(rpcUrl);

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Tiempo de espera agotado al consultar RPC (6s)')), timeoutMs);
		});

		// Carrera entre la llamada RPC y el timeout
		const balanceWei = await Promise.race([
			provider.getBalance(address),
			timeoutPromise
		]);

		return {
			balance: ethers.formatEther(balanceWei),
			rawWei: balanceWei.toString()
		};
	}

	/**
	 * Consulta saldos en una o varias redes mediante Promise.allSettled
	 * Incluye protección ante respuestas obsoletas (race conditions)
	 */
	async queryBalances(
		address: string,
		networkScope: 'all' | number | string,
		includeUtxo = true
	): Promise<{ result: BalanceQueryResult; isStale: boolean }> {
		this.activeQueryId++;
		const thisQueryId = this.activeQueryId;

		const cleanAddr = address.trim();
		const family = this.detectAddressFamily(cleanAddr);

		// Construir lista de redes a consultar
		const itemsToQuery: NetworkBalanceItem[] = [];

		if (networkScope === 'all') {
			// Todas las redes EVM
			for (const net of Object.values(SUPPORTED_NETWORKS)) {
				itemsToQuery.push({
					id: String(net.chainId),
					networkName: net.name,
					family: 'evm',
					symbol: net.nativeCurrency.symbol,
					status: 'loading',
					balance: null,
					balanceRaw: null,
					error: null,
					lastChecked: null,
					rpcUrl: net.rpcUrls[0] || ''
				});
			}

			// Redes UTXO marcadas honestamente como pendientes
			if (includeUtxo) {
				for (const utxo of Object.values(SUPPORTED_UTXO_NETWORKS)) {
					itemsToQuery.push({
						id: utxo.id,
						networkName: utxo.name,
						family: 'utxo',
						symbol: utxo.symbol,
						status: 'pending_feature',
						balance: null,
						balanceRaw: null,
						error: 'Requisito UTXO pendiente: API nativa Syscoin UTXO no conectada. No se inventa saldo.',
						lastChecked: Date.now(),
						rpcUrl: 'UTXO-Core-RPC'
					});
				}
			}
		} else if (typeof networkScope === 'number') {
			// Red EVM específica
			const net = SUPPORTED_NETWORKS[networkScope];
			if (net) {
				itemsToQuery.push({
					id: String(net.chainId),
					networkName: net.name,
					family: 'evm',
					symbol: net.nativeCurrency.symbol,
					status: 'loading',
					balance: null,
					balanceRaw: null,
					error: null,
					lastChecked: null,
					rpcUrl: net.rpcUrls[0] || ''
				});
			}
		} else {
			// Red UTXO específica
			const utxo = SUPPORTED_UTXO_NETWORKS[networkScope];
			if (utxo) {
				itemsToQuery.push({
					id: utxo.id,
					networkName: utxo.name,
					family: 'utxo',
					symbol: utxo.symbol,
					status: 'pending_feature',
					balance: null,
					balanceRaw: null,
					error: 'Requisito UTXO pendiente: API oficial Syscoin UTXO pendiente de integración.',
					lastChecked: Date.now(),
					rpcUrl: 'UTXO-Core-RPC'
				});
			}
		}

		// Ejecución concurrente con Promise.allSettled para aislar fallos de RPC individuales
		const settledResults = await Promise.allSettled(
			itemsToQuery.map(async (item) => {
				if (item.family === 'utxo') {
					// Ya configurado como pending_feature
					return item;
				}

				if (family === 'utxo') {
					item.status = 'error';
					item.error = 'La dirección ingresada es UTXO y no es consultable en redes EVM.';
					item.lastChecked = Date.now();
					return item;
				}

				try {
					const res = await this.fetchEvmBalance(cleanAddr, item.rpcUrl);
					item.status = 'success';
					item.balance = res.balance;
					item.balanceRaw = res.rawWei;
					item.lastChecked = Date.now();
					item.error = null;
				} catch (err: any) {
					item.status = 'error';
					item.error = err.message || 'Error al conectar con nodo RPC';
					item.balance = null; // ¡NUNCA asignar cero a un error!
					item.lastChecked = Date.now();
				}
				return item;
			})
		);

		// Comprobar si la respuesta es obsoleta (si hubo otra búsqueda posterior)
		const isStale = thisQueryId !== this.activeQueryId;

		const finalItems: NetworkBalanceItem[] = settledResults.map((r, idx) => {
			if (r.status === 'fulfilled') {
				return r.value;
			} else {
				const fallback = itemsToQuery[idx];
				fallback.status = 'error';
				fallback.error = r.reason?.message || 'Fallo inesperado de promesa';
				fallback.balance = null;
				return fallback;
			}
		});

		return {
			result: {
				address: cleanAddr,
				detectedFamily: family,
				items: finalItems,
				queryTimestamp: Date.now()
			},
			isStale
		};
	}

	/**
	 * Reintenta la consulta de una sola red específica sin afectar a las demás
	 */
	async retrySingleNetwork(address: string, item: NetworkBalanceItem): Promise<NetworkBalanceItem> {
		if (item.family === 'utxo') return item;

		item.status = 'loading';
		item.error = null;

		try {
			const res = await this.fetchEvmBalance(address.trim(), item.rpcUrl);
			item.status = 'success';
			item.balance = res.balance;
			item.balanceRaw = res.rawWei;
			item.lastChecked = Date.now();
		} catch (err: any) {
			item.status = 'error';
			item.error = err.message || 'Error al reintentar consulta';
			item.balance = null; // Nunca saldo cero
			item.lastChecked = Date.now();
		}

		return { ...item };
	}
}

export const balanceService = new BalanceService();
