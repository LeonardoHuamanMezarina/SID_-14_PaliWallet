/**
 * Formatea una dirección Ethereum/EVM a una representación acortada (ej. 0x1234...5678)
 */
export function shortenAddress(address: string | null | undefined, chars = 4): string {
	if (!address) return '';
	if (address.length <= chars * 2 + 2) return address;
	return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formatea saldos de tokens o moneda nativa para su visualización
 */
export function formatBalance(balance: string | number | null | undefined, decimals = 4): string {
	if (balance === null || balance === undefined || balance === '') return '0.00';
	const num = typeof balance === 'string' ? parseFloat(balance) : balance;
	if (isNaN(num)) return '0.00';
	return num.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals
	});
}
