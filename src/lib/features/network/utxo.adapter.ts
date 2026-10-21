import { SUPPORTED_UTXO_NETWORKS } from './network.config';
import type { UtxoNetworkConfig } from './network.types';

export interface UtxoProviderStatus {
	isSupported: boolean;
	activeNetwork: UtxoNetworkConfig;
	detectedMethods: string[];
	statusMessage: string;
}

/**
 * Adaptador para la familia UTXO (Syscoin Core / Bitcoin).
 * Nunca intenta invocar wallet_switchEthereumChain ni métodos EVM incompatibles.
 */
class UtxoNetworkAdapter {
	private currentNetwork: UtxoNetworkConfig = SUPPORTED_UTXO_NETWORKS['sys-utxo-testnet'];

	/**
	 * Inspecciona el entorno del navegador en busca de APIs específicas UTXO de Pali
	 */
	inspectPaliUtxo(): UtxoProviderStatus {
		if (typeof window === 'undefined') {
			return {
				isSupported: false,
				activeNetwork: this.currentNetwork,
				detectedMethods: [],
				statusMessage: 'Entorno SSR sin proveedor de ventana.'
			};
		}

		const pali = (window as any).pali;
		const detectedMethods: string[] = [];

		if (pali) {
			// Inspeccionar propiedades del objeto Pali
			if (typeof pali.request === 'function') detectedMethods.push('pali.request');
			if (typeof pali.getUtxoAddresses === 'function') detectedMethods.push('pali.getUtxoAddresses');
			if (typeof pali.changeAccount === 'function') detectedMethods.push('pali.changeAccount');
			if (pali.isPali) detectedMethods.push('pali.isPali: true');
		}

		return {
			isSupported: false, // Marcado honestamente como no verificado oficialmente en este entorno
			activeNetwork: this.currentNetwork,
			detectedMethods,
			statusMessage: 'Requisito UTXO pendiente: La API oficial de Pali para cambio de red UTXO no está estandarizada bajo EIP-1193. Integración pendiente.'
		};
	}

	/**
	 * Selector UTXO no disponible hasta completar la integración.
	 * Protege explícitamente contra llamadas accidentales a wallet_switchEthereumChain.
	 */
	async selectUtxoNetwork(networkId: string): Promise<{ success: boolean; network: UtxoNetworkConfig; notice: string }> {
		const target = SUPPORTED_UTXO_NETWORKS[networkId];
		if (!target) {
			throw new Error(`Red UTXO desconocida: ${networkId}`);
		}

		// NO llamar a wallet_switchEthereumChain (incompatible con UTXO)
		// No cambia el estado local sin confirmar la red en el proveedor.

		return {
			success: false,
			network: this.currentNetwork,
			notice: `Cambio a ${target.name} no disponible: integración UTXO pendiente.`
		};
	}

	getActiveUtxoNetwork(): UtxoNetworkConfig {
		return this.currentNetwork;
	}
}

export const utxoAdapter = new UtxoNetworkAdapter();
