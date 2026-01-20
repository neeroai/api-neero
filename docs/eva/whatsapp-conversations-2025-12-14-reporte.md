# Reporte conversaciones WhatsApp (corte 2025-12-16)

Documento base para decisiones del proyecto `docs/ai-agentic` sobre prompts y tacticas de Eva.

## Resumen ejecutivo
- 1,106 conversaciones (10,764 mensajes) entre 12-nov y 16-dic 2025; 47% escalaron a un humano (`role=user`), lo que sigue presionando al equipo de asesores.
- El 50% de las conversaciones incluyen preguntas de precio y 28% sobre ubicacion antes de entregar datos; solo 19% de los pacientes comparten algun dato de contacto, lo que limita las acciones posteriores.
- Enzimas (20% de conversaciones), solicitudes de valoracion (26%) y soportes sobre valoraciones virtuales (12%) concentran la mayor demanda; Hydrafacial y Deep Slim suman otro 14%.

## Metricas clave
| Indicador | Valor |
| --- | --- |
| Ventana temporal | 12-nov al 14-dic 2025 |
| Conversaciones | 1,106 |
| Mensajes totales | 10,764 (paciente 45%, bot 30%, humano 24%, sistema 1%) |
| Conversaciones con agente humano | 520 (47%) |
| Conversaciones que terminan con el paciente sin respuesta posterior | 94.8% |
| Conversaciones con un solo mensaje del paciente | 290 (26%) |
| Pregunta de precio al menos una vez | 558 (50.4%) |
| Pregunta de ubicacion/ciudad | 313 (28.3%) |
| Conversaciones sobre valoracion (cualquier modalidad) | 290 (26.2%) |
| Conversaciones sobre valoracion virtual | 132 (11.9%) |
| Conversaciones sobre enzimas | 226 (20.4%) |
| Conversaciones sobre Deep Slim | 77 (7.0%) |
| Conversaciones sobre Hydrafacial | 73 (6.6%) |
| Conversaciones sobre toxina botulinica | 34 (3.1%) |
| Pacientes que comparten cualquier dato de contacto (nombre, telefono, correo, pais) | 208 (18.8%) |
| Pacientes que preguntan por precio sin compartir datos posteriores | 520 (47.0%) |
| Latencia de respuesta bot (mediana / p95) | 2.9 s / 5.9 s |

## Patrones de comportamiento relevantes
- **Secuencia precio -> silencio:** la mitad de los pacientes pregunta precio como primera interaccion (19% lo hace literalmente en el primer mensaje) y 47% nunca entrega datos despues. Necesitamos prompts que expliquen por que se requieren datos antes de cotizar y ofrezcan alternativas (ej. beneficios de la valoracion).
- **Ubicacion antes que producto:** 28% pregunta por ciudad/sedes antes de hablar de tratamientos; cuando el bot no confirma disponibilidad en su ciudad (ej. Cartagena, Medellin), los pacientes abandonan. Los prompts deben aclarar cobertura y opciones virtuales temprano.
- **Dominio de enzimas y valoraciones virtuales:** Enzimas y citas virtuales concentran preguntas repetitivas (detalle del procedimiento, modalidad virtual/presencial, costos). Hay margen para plantillas especificas y decision trees mas cortos en `PROMPT_EVA_v2.md`.
- **Salidas sin cierre:** 95% de conversaciones terminan con el paciente. Falta un prompt de cierre proactivo (agradecer, ofrecer recordatorio, CTA a agenda) para reducir la sensacion de abandono y preparar el traspaso a humano.
- **Mensajes aislados:** 26% de conversaciones tienen un solo mensaje del paciente y el bot envia hasta dos recordatorios estaticos sin lograr respuesta. Esto sugiere implementar un estado de “cold lead” con seguimiento diferido en vez de insistir en vivo.
- **Alertas de contenido no deseado:** Existen mensajes con enlaces externos promocionales (ej. `PixVerse` en conversationId `df8e5bf7-...`). Se requiere reforzar guardas de seguridad descritas en `POLICY_GUARDRAILS.md`.

## Implicaciones para prompts (`docs/ai-agentic`)
1. **Bloque de precio/valor** (Actualizar `PROMPT_EVA_v2.md`): tras mencionar que no se dan valores por WhatsApp, ofrecer un racional centrado en personalizacion y proponer llenar datos minimos en un mismo turno. Ejemplo de copy deseado: “Para darte un estimado necesitamos registrar tu valoracion con el Dr. Duran; toma menos de 1 minuto y asi podemos enviarte agenda y promociones disponibles”.
2. **Prompt dinamico de ubicacion**: incluir en la apertura una pregunta sobre ciudad de residencia y una respuesta condicional (si es fuera de Barranquilla/Bogota -> ofrecer valoracion virtual o lista de viajes). Esto reduce ida y vuelta para pacientes como `Nubia` (Cartagena) o `Nena` (Medellin).
3. **Macros especificas por tratamiento**: crear secciones de mensajes cortos reutilizables para Enzimas, Deep Slim y Hydrafacial (cifras anteriores respaldan priorizacion). Cada macro debe terminar con CTA a valoracion y mencionar requisitos previos (fotos, condiciones, tiempos de recuperacion) segun `RUNBOOK_PILOT.md`.
4. **Rutina de cierre**: agregar un paso final siempre que el paciente deje de responder (ej. a los 5 minutos) indicando “Quedo atento” + instrucciones para reactivar la conversacion. Registrar este estado en `SCHEMA_EvaResult`.
5. **Deteccion de spam/enlaces**: extender `POLICY_GUARDRAILS.md` para bloquear enlaces externos desconocidos y etiquetar la conversacion con `risk_flags=["POTENTIAL_SPAM"]`.

## Oportunidades operativas
- **Automatizar handover selectivo:** 47% de conversaciones llegan a humano. Muchas son solo consultas de precio o ubicacion que el bot ya responde. Podemos definir criterios (precio sin datos, ubicacion fuera de cobertura, salud/urgencia) para reducir transferencias mediante `TOOLS_CONTRACTS.md`.
- **Seguimiento asincronico:** Guardar los 290 leads de un solo mensaje en una cola para remarketing en otro canal en vez de mantenerlos abiertos en WhatsApp.
- **Analitica continua:** Incorporar estos contadores en `docs/ai-agentic/VALIDATED_RECOMMENDATIONS.md` y automatizar un job diario que actualice KPIs en `/convers`.

## Preguntas abiertas
- Cuando el paciente exige precio inmediato, ¿tenemos mensajes aprobados (o herramientas) para compartir rangos bajo NDA? Si no, definirlo en `PRD.md`.
- ¿Que SLA espera el equipo humano despues de un handover? 95% de cierres quedan en el paciente; tal vez falta una tarea para asegurar respuesta humana antes de cerrar.
- ¿Necesitamos prompts diferenciados para pacientes que escriben desde fuera de Colombia (detectar prefijos > +57)?

> Fuente de datos: `convers/whatsapp-conversations-2025-12-14.json`. Script exploratorio ejecutado con Python 3 para estadisticas rapidas.
