# Estado del Prototipo Académico MicroFi P2P

Este documento detalla el estado de implementación técnica del prototipo académico MicroFi P2P desarrollado en Svelte 5 y TypeScript, con base en los lineamientos establecidos en `docs/PROTOTIPO-MICROFI.md`.

---

## 1. Matriz de Cumplimiento de Requisitos Académicos

| # | Requisito | Estado | Nivel de Implementación | Archivos Relevantes |
|---|-----------|--------|--------------------------|---------------------|
| **1** | **Inicio público en Svelte** | **Parcial / Demo** | Descripción de objetivos, beneficios y características completada. Configuración de desarrollador editable mediante almacenamiento local. Visor de fotografía en memoria del navegador (`FileReader`) sin subir a servidores externos. Marcado honestamente como parcial hasta que el evaluado ingrese sus datos y foto definitiva. | [`HomeOverview.svelte`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/home/components/HomeOverview.svelte)<br>[`DeveloperCard.svelte`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/profile/components/DeveloperCard.svelte)<br>[`developer.config.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/profile/developer.config.ts) |
| **2** | **Transferencias cuenta a cuenta** | **Real EVM + Demo** | Formulario con validación de direcciones EVM (hexadecimal 40 caracteres) e importe sin aritmética de punto flotante (`ethers.parseEther`). Paso obligatorio de revisión previa antes de solicitar firma. Envío real a través del proveedor EIP-1193 (`eth_sendTransaction`), captura de hash real y enlace al explorador de la red correspondiente. Soporte de modo de simulación académica sin generar hashes ni enlaces ficticios. Historial inmutable que conserva la red y el hash originales aunque cambie la red de la billetera. Estados: firma pendiente, enviada, confirmada, rechazada/fallida. | [`TransferForm.svelte`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/transfer/components/TransferForm.svelte)<br>[`transfer.service.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/transfer/transfer.service.ts)<br>[`transfer.types.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/transfer/transfer.types.ts)<br>[`validators.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/shared/utils/validators.ts) |
| **3** | **Cambio de red por proveedor (EVM vs UTXO)** | **Real EVM + Pendiente UTXO** | Conservación intacta de las redes configuradas: zkSYS Testnet (`0xdee1`), Ethereum Hoodi (`0x88bb0`) y Ethereum Sepolia (`0xaa36a7`). Detección estricta de red no agregada (código 4902 y anidados en data/originalError), adición mediante `wallet_addEthereumChain` y comprobación del `eth_chainId` real tras el cambio. El error genérico `-32603` no se trata como red ausente. Para la familia UTXO (Syscoin Core), se implementó un adaptador diferenciado con selector etiquetado en modo demo/mock, documentando que el requisito UTXO real queda pendiente por falta de API estándar EIP-1193 en el entorno web. | [`network.config.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/network/network.config.ts)<br>[`wallet.provider.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/wallet/wallet.provider.ts)<br>[`utxo.adapter.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/network/utxo.adapter.ts)<br>[`NetworkSelector.svelte`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/network/components/NetworkSelector.svelte) |
| **4** | **Saldos por address sin conexión y con wallet** | **Real EVM + Pendiente UTXO** | Consulta pública directa por HTTP RPC (`ethers.JsonRpcProvider`) sin invocar la extensión de la billetera (0 popups, sin cambio de red en la wallet del usuario). Consulta concurrente multired mediante `Promise.allSettled`, timeout individual de 6 segundos y protección contra condiciones de carrera/respuestas obsoletas. Errores de RPC se señalan explícitamente con opción de reintento por red y nunca se muestran como saldo cero. No se suman monedas distintas. La familia UTXO se identifica por formato y se muestra como pendiente. Se documenta que la consulta o conexión de wallet no equivale a autenticación de identidad. | [`BalanceChecker.svelte`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/balance/components/BalanceChecker.svelte)<br>[`balance.service.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/balance/balance.service.ts)<br>[`balance.types.ts`](file:///c:/Users/Usuario/Desktop/pali-wallet/src/lib/features/balance/balance.types.ts) |

---

## 2. Matriz del Flujo de Microcrédito P2P Supervisado (Simulación Académica)

| Etapa del Flujo | Estado en Sistema | Comportamiento Implementado |
|-----------------|-------------------|-----------------------------|
| **1. Expediente Sintético y Solicitud** | `under_review` | El solicitante ingresa datos ficticios (nombre, actividad, ingresos, gastos, deudas, monto y plazo). Se calcula un score explicativo algorítmico simple con advertencia de que no constituye calificación de riesgo real. |
| **2. Evaluación Manual Demo** | `approved` / `rejected` / `changes_requested` | Panel accesible para el docente/evaluador. Permite aprobar (con tasa sugerida y cronograma), rechazar (con motivo obligatorio fundamentado) o solicitar subsanación con notas. |
| **3. Aceptación de Condiciones** | `accepted` | El prestatario revisa el cronograma propuesto cuota por cuota (capital e interés fijo) y debe aceptar formalmente las condiciones antes de que el crédito pueda publicarse. |
| **4. Publicación en Marketplace** | `published` | Únicamente las solicitudes aprobadas y aceptadas se hacen visibles a la comunidad de fondeadores. |
| **5. Fondeo Colaborativo P2P** | `published` -> `funded` | Aportes parciales o totales de fondeadores. Validación estricta: prohíbe exceder la meta, montos <= 0 o NaN. Si no alcanza la meta en el plazo, permite simular expiración con devolución. Al llegar al 100%, pasa a financiado. |
| **6. Desembolso Simulado** | `disbursed` | Se simula la acreditación de los fondos al prestatario y se activa el periodo de amortización. |
| **7. Pagos y Amortización** | `disbursed` / `overdue` -> `repaid` | Pagos parciales o de cuotas con validación contra el saldo remanente. Permite simular mora académica para evidenciar gestión de incumplimiento. Al llegar a saldo cero, se declara amortizado. |

---

## 3. Pruebas Realizadas y Diagnósticos

1. **Chequeo de Tipos y Componentes (`npm run check`)**:
   - `svelte-check` ejecutado en modo estricto contra `tsconfig.json`.
   - **Resultado:** `0 errors and 0 warnings`.
2. **Compilación de Producción (`npm run build`)**:
   - Vite y SvelteKit compilaron exitosamente los entornos cliente y SSR.
   - **Resultado:** Bundle generado sin discrepancias ni advertencias bloqueantes.

---

## 4. Pasos para Demostración Rápida

1. **Navegación General y Diseño**:
   - Ejecutar `npm run dev` y abrir `http://localhost:5173`.
   - Navegar por el menú lateral: *Inicio*, *Wallet / Transferir*, *Consultar saldos*, *Solicitar préstamo*, *Evaluación demo*, *Marketplace*, *Mis préstamos*, *Billetera*.
2. **Requisito 1 (Desarrollador y Foto Local)**:
   - Ir a **Inicio**. En la sección del Desarrollador, hacer clic en "Editar Datos" para personalizar nombre e institución.
   - Hacer clic en el recuadro "Pendiente: Foto Real" y seleccionar una imagen del computador; se previsualiza instantáneamente sin salir del navegador.
3. **Requisito 2 (Transferencias)**:
   - Ir a **Wallet / Transferir**. Ingresar dirección destino y monto.
   - Hacer clic en "Revisar Transferencia". Seleccionar "Simular en Modo Demo" para observar el ciclo de firma, envío y confirmación sin gas, o "Confirmar y Firmar" con Pali Wallet en testnet. Verificar el registro inmutable en la tabla inferior.
4. **Requisito 3 (Cambio de Red)**:
   - En la barra superior, abrir el selector de red. Cambiar entre zkSYS, Hoodi y Sepolia. Observar la sección diferenciada de la familia UTXO con aviso de adaptador demo.
5. **Requisito 4 (Consulta de Saldos)**:
   - Ir a **Consultar Saldos**. Presionar "Usar mi billetera" o ingresar `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`.
   - Presionar "Consultar RPC". Observar la consulta multired simultánea con `Promise.allSettled`, las tarjetas individuales y la tarjeta UTXO etiquetada como pendiente.
6. **Flujo Completo de Microcrédito**:
   - Ir a **Solicitar Préstamo**, presionar "Llenar Datos Demo" y enviar.
   - Ir a **Evaluación Demo**, seleccionar la solicitud y presionar "Aprobar" indicando tasa 2.0%.
   - Ir a **Mis Préstamos**, presionar "Revisar y Aceptar Cronograma" y luego "Publicar en Marketplace".
   - Ir a **Marketplace P2P**, ingresar como fondeador y completar el monto restante.
   - Presionar "Simular Desembolso".
   - Volver a **Mis Préstamos**, registrar pagos de amortización o probar el botón "Simular Retraso (Mora)".

---

## 5. Limitaciones Actuales y Próximos Pasos

1. **Fotografía y Datos del Desarrollador**: El prototipo provee un visor local con carga en memoria; para la entrega final el estudiante debe personalizar sus datos definitivos.
2. **API Nativa Pali UTXO**: Pali Wallet opera bajo EIP-1193 para EVM; la interacción directa con el nodo Syscoin UTXO requiere librerías específicas (`syscoin-js` o JSON-RPC directo a nodos Core).
3. **Autenticación y Backend**: Las operaciones de crédito actuales son simuladas en el cliente con persistencia en `localStorage`. Una versión productiva requiere backend con base de datos relacional, JWT/firmas EIP-712 y control de acceso basado en roles (RBAC).
4. **Validación de Identidad e Ingresos**: Se debe integrar proveedores de KYC/DID (como Polygon ID o Worldcoin) y scoring crediticio conectado a APIs bancarias abiertas (Open Banking).
5. **Contratos Inteligentes y Custodia On-Chain**: Reemplazar la máquina de estados de demo por Smart Contracts verificados en Solidity para custodia en escrow, fondeo directo ERC-20 / nativo y liquidación de cuotas.
6. **Seguridad y Encaje Regulatorio**: Auditoría de contratos, prevención de lavado de activos (AML) y cumplimiento normativo ante reguladores financieros para modelos de crowdlending P2P.
