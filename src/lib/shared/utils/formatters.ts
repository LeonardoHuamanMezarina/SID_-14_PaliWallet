/**
 * Formatea una dirección Ethereum/EVM a una representación acortada (ej. 0x1234...5678)
 */
export function shortenAddress(address: string | null | undefined, chars = 4): string {
	if (!address) return '';
	if (address.length <= chars * 2 + 2) return address;
	return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formatea un hash de transacción para visualización compacta
 */
export function shortenHash(hash: string | null | undefined, chars = 6): string {
	if (!hash) return '';
	if (hash.length <= chars * 2 + 2) return hash;
	return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Formatea saldos de tokens o moneda nativa para su visualización
 */
export function formatBalance(balance: string | number | null | undefined, decimals = 4): string {
	if (balance === null || balance === undefined || balance === '') return '0.00';
	const num = typeof balance === 'string' ? parseFloat(balance) : balance;
	if (isNaN(num)) return '0.00';
	return num.toLocaleString('es-ES', {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals
	});
}

/**
 * Formatea valores monetarios fiduciarios o unidades de crédito sintéticas (ej. $1,250.00 mUSD)
 */
export function formatCurrency(amount: number | string | null | undefined, symbol = '$', currencySuffix = 'mUSD'): string {
	if (amount === null || amount === undefined || amount === '') return `${symbol}0.00 ${currencySuffix}`;
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(num)) return `${symbol}0.00 ${currencySuffix}`;
	return `${symbol}${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySuffix}`;
}

/**
 * Formatea porcentajes con un número determinado de decimales
 */
export function formatPercent(rate: number | null | undefined, decimals = 1): string {
	if (rate === null || rate === undefined) return '0%';
	return `${rate.toFixed(decimals)}%`;
}

/**
 * Formatea fechas ISO o timestamps a formato legible en español
 */
export function formatDate(dateInput: string | number | Date | null | undefined): string {
	if (!dateInput) return 'N/D';
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return 'N/D';
	return date.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

