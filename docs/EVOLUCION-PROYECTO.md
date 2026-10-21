# MicroFi: diseño y siguiente etapa

## Mejora de interfaz

Se aplicó Taste Skill al inicio, conservando Svelte, la identidad violeta y las secciones actuales. Dirección: presentación financiera sobria; variación 4/10, movimiento 2/10, densidad 4/10. CSS nativo sobre los componentes existentes.

Auditoría inicial: cabecera centrada con tres llamadas a la acción; abundancia de paneles y badges; mensajes que prometían contratos, gobernanza y trazabilidad de créditos todavía simulados; texto secundario de bajo contraste; botones sin foco global visible.

Cambios: introducción más breve, jerarquía de acciones, alcance real/demo explícito, objetivos comprobables, características y beneficios revisados, perfil del desarrollador conservado. El préstamo por invitación se muestra como propuesta futura y no como función disponible. Se añadieron foco visible, movimiento reducido, estado accesible de navegación y cierre del menú móvil. Se conserva el tema oscuro del proyecto/Figma; no se añadió un segundo tema.

Validación: npm run check: 0 errores y 0 advertencias. npm run build: correcto. Revisión visual e interacciones de navegador pendientes: la primera vista previa se inició con un argumento de raíz incorrecto y el reinicio fue rechazado. No se ejecutaron transferencias ni se verificó soporte UTXO real en esta revisión. No se realizó Lighthouse.

## Alcance propuesto para la siguiente entrega

Préstamos por invitación entre personas conocidas, con revisión del prestamista. El marketplace y la evaluación actuales siguen siendo demo; convertirlos requiere una implementación funcional, no solo renombrar pantallas.

1. Definir participantes, moneda, red, condiciones y estados del acuerdo. El prestamista revisa y ambas partes aceptan. Guardar la versión exacta de las condiciones aceptadas.
2. Implementar autenticación por desafío firmado con nonce y caducidad, validación del servidor y autorización por participante. Conexión de wallet no equivale a identidad civil.
3. Backend y persistencia: acuerdos, participantes, invitaciones, aceptación, vencimientos y pagos. No confiar en localStorage para saldos, aprobaciones o permisos reales.
4. Asociar desembolso y devolución a transacciones verificadas: red, emisor, receptor, moneda/token, importe y confirmaciones. Impedir reutilizar un hash para dos pagos; contemplar transacción fallida, reemplazada o reorganizada.
5. Completar y probar adaptadores Pali EVM/UTXO con documentación verificable. Mantener estado pendiente cuando el proveedor no soporta una operación.
6. Pruebas del recorrido completo en testnet, con dos participantes y autorización manual de firmas. Acordar con el docente si exige contrato inteligente o acepta registro de acuerdos en backend con transferencias verificadas.

Conocer a una persona y registrar pagos no garantiza recuperación. Una operación comercial necesita una evaluación separada del modelo, privacidad, contratos, reclamaciones y obligaciones aplicables.

## Skills recomendadas (no instaladas en esta intervención)

- [playwright](https://github.com/openai/skills/tree/main/skills/.curated/playwright): navegación, comprobación de formularios, capturas y depuración de recorridos. Ya hay herramientas del plugin Playwright personal en esta sesión; instalar otra skill es opcional.
- [security-best-practices](https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices): revisión de seguridad JavaScript/TypeScript y del backend seleccionado. No sustituye auditoría de contratos Solidity.
- [security-threat-model](https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model): identificar participantes, límites de confianza, amenazas y controles; útil para suplantación, invitaciones filtradas y pagos duplicados.
- Figma Design to Code y Figma Generate Library ya están disponibles: sirven para mantener componentes y diseño alineados cuando se actualice el Figma.

No hace falta acumular skills de diseño similares. Para Pali conviene preparar posteriormente una skill específica basada en APIs oficiales comprobadas y casos de prueba, en vez de instrucciones con métodos inventados. Para Solidity se requiere tooling y revisión especializados si se decide incorporar contratos.
