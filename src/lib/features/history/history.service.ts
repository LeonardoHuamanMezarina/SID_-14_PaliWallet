import type { StoredTransaction } from './history.types';

const LOCAL_FALLBACK_KEY = 'metavault_tx_history_fallback';

function getLocalFallback(): StoredTransaction[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveLocalFallback(tx: StoredTransaction) {
	if (typeof window === 'undefined') return;
	try {
		const list = getLocalFallback();
		const idx = list.findIndex(item => item.hash.toLowerCase() === tx.hash.toLowerCase());
		if (idx >= 0) {
			list[idx] = { ...list[idx], ...tx };
		} else {
			list.unshift(tx);
		}
		localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(list.slice(0, 100)));
	} catch (e) {
		console.warn('No se pudo guardar respaldo local de transacción:', e);
	}
}

export async function recordTransaction(tx: StoredTransaction): Promise<StoredTransaction> {
	// Guardar de inmediato en el respaldo local
	saveLocalFallback(tx);

	try {
		const res = await fetch('/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(tx)
		});

		if (!res.ok) {
			const errData = await res.json().catch(() => ({}));
			throw new Error(errData.message || `Error del servidor HTTP ${res.status}`);
		}

		const data = await res.json();
		return data.transaction;
	} catch (err) {
		console.warn('Aviso: guardado en Neon falló o está sin conexión, persistido en caché local:', err);
		return tx;
	}
}

export async function fetchTransactions(account: string, chainId?: number): Promise<StoredTransaction[]> {
	if (!account) return [];

	try {
		let url = `/api/transactions?account=${encodeURIComponent(account.toLowerCase())}`;
		if (chainId !== undefined) {
			url += `&chainId=${chainId}`;
		}

		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}

		const data = await res.json();
		const remoteTxs: StoredTransaction[] = data.transactions || [];

		// Si hay transacciones remotas, retornarlas ordenadas
		if (remoteTxs.length > 0) {
			return remoteTxs.map(t => ({
				...t,
				chainId: Number(t.chainId)
			}));
		}
	} catch (err) {
		console.warn('Consulta a Neon no disponible, recurriendo a caché local:', err);
	}

	// Respaldo local filtrado
	const local = getLocalFallback().filter(t => {
		const matchAccount = t.account.toLowerCase() === account.toLowerCase();
		const matchChain = chainId !== undefined ? Number(t.chainId) === Number(chainId) : true;
		return matchAccount && matchChain;
	});

	return local;
}
