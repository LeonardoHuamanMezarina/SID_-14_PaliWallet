# Encargo: prototipo académico MicroFi P2P

Implementa en este repositorio Svelte 5/TypeScript un prototipo navegable y funcional, conservando la integración Pali existente y los cambios del usuario en network.config.ts. Trabaja directamente en los archivos. No hagas commits ni publiques. Minimiza dependencias y explicaciones; comprueba check/build al terminar.

## Diseño y alcance
- Estética del Figma: fondo azul noche, paneles oscuros, acentos violeta y turquesa, navegación lateral en escritorio y adaptable a móvil. Interfaz en español, legible y accesible.
- Secciones: Inicio, Wallet/Transferir, Consultar saldos, Solicitar préstamo, Evaluación demo, Marketplace, Mis préstamos.
- Modo académico visible: préstamos/datos de identidad/evaluaciones/fondeo simulados. Nunca representar simulaciones como operaciones blockchain reales ni inventar hashes de explorador.
- Reutilizar código actual. Separar componentes y servicios por feature; evitar una página monolítica.

## Cuatro requisitos de la evaluación
1. Inicio público en Svelte: descripción del proyecto, objetivos, beneficios, características, desarrollador y fotografía. No inventes nombre ni foto: usa configuración editable y espacio claramente pendiente para foto real; permite previsualizar una foto local sin subirla a terceros. Este requisito queda parcial hasta personalizarlo.
2. Transferencias cuenta a cuenta: formulario destino/importe/red, validación, revisión antes de pedir firma, envío EVM por proveedor real, capturar hash real y enlace al explorador de esa red. Estados: firma pendiente, enviada, confirmada, rechazada/fallida. No ejecutar tú transferencias ni firmar wallets; el usuario prueba con testnet. En demo, indicar simulación sin enlace de transacción falsa. Guardar red/hash original al enviar aunque cambie la wallet. No usar floats para unidades on-chain.
3. Cambio de red POR PROVEEDOR: distinguir EVM y UTXO. Mantener zkSYS Testnet, Hoodi, Sepolia existentes. EVM: detectar red ausente (4902, incluido error anidado), agregar con wallet_addEthereumChain y verificar chainId real tras cambio; un error genérico -32603 no significa red ausente. UTXO: investigar API oficial Pali o tipos disponibles antes de implementar; no usar wallet_switchEthereumChain para UTXO ni inventar métodos. Si la API no se verifica, entregar selector/adapter y demo etiquetada, documentando que el requisito UTXO real queda pendiente. Adición automática siempre sujeta a confirmación del proveedor.
4. Saldos por address sin conexión y con wallet conectada: consulta pública por RPC, una red o varias seleccionadas. La consulta no debe cambiar red de la wallet ni abrir solicitudes de conexión. Validar address según familia; separar EVM/UTXO. Resultados por red con moneda, loading, error y reintento; errores RPC nunca se muestran como saldo cero. Promise.allSettled o equivalente para fallos parciales, timeout y protección ante respuestas obsoletas. No sumar monedas distintas. Implementar EVM real; UTXO según API verificada o mostrar pendiente explícito. Wallet conectada no equivale a autenticación de identidad; documentar diferencia.

## Flujo de microcrédito corregido (simulado)
Wallet no equivale a identidad ni solvencia. The Graph indexa actividad blockchain y no sustituye validación de identidad, ingresos o centrales de riesgo.
Flujo: registro de expediente ficticio -> solicitud (monto, propósito, plazo, ingresos, gastos, deudas) -> revisión manual demo -> aprobar/rechazar/pedir información con motivo -> aceptar condiciones y cronograma -> publicar -> fondeo parcial/total -> desembolso simulado -> pagos parciales, mora, pagado.
- No aprobar automáticamente por conectar wallet. Score opcional ilustrativo y explicable, no validado como riesgo real.
- Marketplace solo publica solicitudes aprobadas y aceptadas. Separar aprobado, publicado, financiado y desembolsado.
- Panel demo de evaluación con expedientes sintéticos y controles funcionales, sin presentar como autorización real. No guardar documentos/DNI reales; localStorage solo fixtures y estados de demo con reset.
- Fondeo: evitar sobrepasar el monto, solo simulado; expiración con devolución simulada si no alcanza objetivo. Pagos limitados al saldo pendiente; no aceptar cero/negativos/NaN.
- Mostrar condiciones y riesgo de impago, sin prometer rentabilidad. Préstamos de demo en una unidad definida; no mezclar USDC con moneda nativa de transferencias.
- Quitar afirmaciones engañosas actuales como 'Sin permiso bancario' y gas fijo garantizado.

## Entrega
Prototipo que pueda recorrerse sin extensión usando datos demo; integración EVM real disponible por separado. Documentar en docs/ESTADO-PROTOTIPO.md matriz de cuatro requisitos con real/demo/pendiente, archivos relevantes, pasos de demostración, pruebas realizadas y limitaciones. Anotar próximos pasos: foto/nombre reales, API UTXO, autenticación, backend/permisos, identidad e ingresos, evaluación crediticia, contratos y cobranza, seguridad y encaje regulatorio. No afirmar cumplimiento total si faltan UTXO o foto.
Ejecutar npm run check y npm run build, corregir fallos. No desplegar, no transferir fondos, no solicitar claves privadas. Entregar resumen breve.
