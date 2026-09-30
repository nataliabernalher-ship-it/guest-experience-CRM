\# Guest Experience CRM — Build Spec

\#\# 1\. Overview

\#\#\# Qué es el producto

\*\*Guest Experience CRM\*\* es una herramienta B2B para equipos de recepción de resorts vacacionales 4–5★.

Funciona como una \*\*capa operativa sobre el PMS\*\*, no como sustituto del PMS.

El hotel ya dispone de información sobre el huésped: reserva, estancia, habitación, historial, recurrencia, servicios utilizados, notas de reserva, incidencias, etc.

Guest Experience CRM utiliza esa información para convertirla en \*\*acciones concretas y priorizadas para recepción\*\*.

La pregunta principal que debe responder el producto es:

\> \*\*What should I do for this guest now?\*\*

Las acciones se organizan en cuatro categorías:

\- \*\*Upselling:\*\* oportunidades para vender servicios complementarios.  
\- \*\*Loyalty:\*\* oportunidades para incorporar huéspedes recurrentes al programa de fidelización.  
\- \*\*Guest Experience:\*\* acciones de personalización de la estancia.  
\- \*\*Recovery:\*\* seguimiento de incidencias hasta confirmar su resolución con el huésped.

La aplicación tiene cuatro áreas principales:

\- Dashboard  
\- Opportunities  
\- Guests  
\- Recovery

\#\#\# Para quién

El usuario principal es el \*\*Receptionist / Front Desk Agent\*\*.

El producto está pensado para resorts vacacionales 4–5★ con características como:

\- aproximadamente 150–500 habitaciones;  
\- alto volumen de huéspedes;  
\- múltiples llegadas y salidas;  
\- servicios complementarios;  
\- spa/wellness;  
\- restaurantes;  
\- transfers;  
\- upgrades;  
\- huéspedes recurrentes.

El CRM permanece abierto durante el turno y se utiliza \*\*junto al PMS\*\*.

\#\#\# Qué problema resuelve

El problema no es necesariamente que el hotel carezca de información sobre sus huéspedes.

El problema es que:

\> \*\*La información relevante puede existir, pero no siempre llega al recepcionista en el momento en que puede actuar sobre ella.\*\*

Durante un turno, recepción gestiona simultáneamente huéspedes, llegadas, salidas, consultas e incidencias.

La carga de trabajo puede hacer que información relevante pase desapercibida y se pierdan oportunidades de:

\- personalizar una estancia;  
\- reconocer a un huésped recurrente;  
\- vender un servicio adicional;  
\- conseguir un alta en fidelización;  
\- hacer seguimiento de una incidencia.

El producto transforma información en \*\*acciones visibles, contextualizadas y ejecutables\*\*.

El principio fundamental es:

\> \*\*Action first, data second.\*\*

\---

\# 2\. Flujos core

\#\# 2.1. Revisar qué huéspedes necesitan atención

1\. El recepcionista abre \`Dashboard\`.  
2\. Consulta el contexto operativo. Cada bloque enlaza a su listado:  
   \- Check-ins.  
   \- Check-outs.  
   \- In-house.  
   \- Recovery.  
3\. Consulta las acciones pendientes por categoría:  
   \- Upselling.  
   \- Loyalty.  
   \- Guest Experience.  
   \- Recovery.  
4\. Consulta las 5 acciones más prioritarias bajo el título \`Needs your attention\`. Cada una enlaza al listado donde se resuelve.  
5\. Al lado consulta la tabla informativa \`VIP and returning\`.  
6\. Desde el Dashboard no se resuelve ninguna acción. No ofrece \`Sold\`, \`Rejected\`, \`Signed up\`, \`Done\` ni \`Start\`. La tabla VIP and returning tampoco resuelve acciones.  
7\. No hay un recuento \`Needs attention\` en la esquina del Dashboard.  
8\. El recepcionista abre el listado correspondiente y resuelve la acción allí.  
9\. Al resolverla, el sistema recalcula automáticamente:  
   \- acciones pendientes;  
   \- Needs attention;  
   \- métricas;  
   \- estado operativo del huésped.

\#\# 2.2. Completar una oportunidad de Upselling

Las oportunidades pueden proceder automáticamente de información del PMS.

Ejemplos:

\- Spa / massage.  
\- Breakfast.  
\- Room upgrade.  
\- Early check-in.  
\- Late check-out.  
\- Transfer.  
\- Restaurant.

Flujo:

1\. El sistema identifica una oportunidad.  
2\. Se crea como \`Pending\`.  
3\. Aparece en el listado operativo del huésped (Check-ins, Check-outs o In-house) y, si es prioritaria, como enlace en el Dashboard. También aparece en Opportunities.  
4\. Recepción la resuelve en ese listado, no en el Dashboard. Puede marcar:  
   \- \`Sold\`  
   \- \`Rejected\`  
5\. Si selecciona \`Sold\`:  
   \- la oportunidad se completa;  
   \- el importe configurado del servicio se añade a Upselling Revenue;  
   \- se registra la acción en el huésped.  
6\. Si selecciona \`Rejected\`:  
   \- la oportunidad queda cerrada como rechazada.  
7\. El sistema recalcula Needs attention.

\#\# 2.3. Completar una oportunidad de Loyalty

1\. El sistema detecta un huésped recurrente que no pertenece al programa de fidelización.  
2\. Genera una oportunidad \`Loyalty\`.  
3\. Recepción la resuelve en el listado operativo del huésped (Check-ins, Check-outs o In-house), no en el Dashboard. Puede marcar:  
   \- \`Signed up\`  
   \- \`Rejected\`  
4\. \`Signed up\` incrementa Loyalty sign-ups.  
5\. La acción queda registrada en el huésped.  
6\. Se recalcula Needs attention.

\#\# 2.4. Completar una acción de Guest Experience

El sistema puede generar acciones como:

\- Birthday detail.  
\- Anniversary detail.  
\- Repeat guest welcome.

Flujo:

1\. Se detecta la situación correspondiente.  
2\. Se genera una acción \`Pending\`.  
3\. Recepción ejecuta la acción desde el listado operativo del huésped (Check-ins, Check-outs o In-house), no desde el Dashboard.  
4\. Pulsa \`Done\`.  
5\. La acción queda completada.  
6\. Guests pampered aumenta en \+1.  
7\. Se recalcula Needs attention.

Si termina el periodo válido para realizarla:

\`Pending → Not completed\`

El cambio puede producirse automáticamente.

\#\# 2.5. Gestionar una incidencia Recovery

Recovery puede proceder del PMS/API o ser creado manualmente por recepción.

Flujo:

1\. Se registra una incidencia.  
2\. Se asigna una severidad:  
   \- Urgent.  
   \- Normal.  
   \- Low.  
3\. Estado inicial:  
   \`Pending\`  
4\. Desde el listado de Recovery, no desde el Dashboard, recepción inicia su seguimiento:  
   \`Pending → In progress\`  
5\. Puede abrir el Recovery drawer.  
6\. Consulta:  
   \- huésped;  
   \- habitación;  
   \- incidencia;  
   \- severidad;  
   \- estado;  
   \- comentarios;  
   \- historial.  
7\. Puede añadir comentarios de seguimiento.  
8\. Cuando comprueba con el huésped que el problema está solucionado:  
   \`In progress → Confirmed with guest\`  
9\. Solo entonces se considera cerrada la incidencia.  
10\. Se recalcula Needs attention.

\#\# 2.6. Explorar Opportunities

1\. El usuario entra en \`Opportunities\`.  
2\. Consulta una única tabla.  
3\. Puede filtrar:  
   \- All.  
   \- Upselling.  
   \- Loyalty.  
   \- Guest Experience.  
4\. Selecciona una oportunidad.  
5\. Se abre un drawer lateral.  
6\. Consulta:  
   \- huésped;  
   \- habitación;  
   \- estancia;  
   \- oportunidad;  
   \- categoría;  
   \- timing;  
   \- estado;  
   \- contexto relevante;  
   \- origen.  
7\. Puede resolver la oportunidad desde el drawer.  
8\. Puede seleccionar \`View guest profile\`.  
9\. Se abre el Guest Profile como página completa.

\#\# 2.7. Buscar un huésped

1\. El usuario entra en \`Guests\`.  
2\. Busca por:  
   \- nombre;  
   \- número de habitación.  
3\. El sistema devuelve huéspedes aunque no aparezcan en la vista operativa inicial.  
4\. Selecciona un huésped.  
5\. Se abre Guest Profile.

\#\# 2.8. Consultar la lista operativa de huéspedes

1\. El usuario entra en \`Guests\`.  
2\. Por defecto se priorizan:  
   1\. Needs attention.  
   2\. Today's check-outs.  
   3\. Today's check-ins.  
3\. Los huéspedes sin relevancia operativa inmediata permanecen ocultos.  
4\. Pueden recuperarse mediante búsqueda o filtros.  
5\. Al seleccionar un huésped se abre su Guest Profile.

\#\# 2.9. Consultar Guest Profile

1\. El usuario abre un huésped.  
2\. Accede a una página completa.  
3\. Consulta:  
   \- datos principales;  
   \- estancia;  
   \- recurrencia;  
   \- loyalty status;  
   \- acciones pendientes;  
   \- notas;  
   \- historial de estancias;  
   \- servicios utilizados;  
   \- Recovery;  
   \- Activity.  
4\. Puede completar acciones pendientes desde el perfil.  
5\. Puede añadir Notes.  
6\. Puede crear una nueva Opportunity.  
7\. Puede iniciar Recovery cuando sea necesario.

\#\# 2.10. Añadir una Note

1\. El usuario abre Guest Profile.  
2\. Escribe información relevante sobre el huésped.  
3\. Guarda la nota.  
4\. El sistema registra:  
   \- contenido;  
   \- autor;  
   \- fecha/hora.  
5\. La nueva nota se añade al historial.  
6\. Las notas anteriores permanecen intactas.

Una Note no genera automáticamente una Opportunity.

\#\# 2.11. Crear una Opportunity manual

1\. El recepcionista identifica una oportunidad durante una interacción con el huésped.  
2\. Abre Guest Profile.  
3\. Selecciona \`Create opportunity\`.  
4\. Define:  
   \- Category.  
   \- Opportunity.  
   \- When.  
5\. \`When\` puede ser:  
   \- Today.  
   \- At check-in.  
   \- Before check-out.  
6\. La Opportunity se crea como \`Pending\`.  
7\. Aparece en Opportunities.  
8\. Si corresponde, aparece en Dashboard.  
9\. El huésped pasa a Needs attention si todavía no estaba incluido.

\#\# 2.12. Crear Recovery manualmente

1\. El recepcionista abre o localiza un huésped.  
2\. Crea una incidencia.  
3\. Introduce:  
   \- Issue.  
   \- Severity.  
4\. El huésped y habitación quedan asociados.  
5\. Puede añadir un comentario inicial.  
6\. Recovery se crea como \`Pending\`.  
7\. El huésped pasa a Needs attention.  
8\. La incidencia aparece en Recovery.

\#\# 2.13. Utilizar información del PMS para generar Opportunities

1\. El CRM recibe información procedente del PMS.  
2\. Puede utilizar:  
   \- datos estructurados;  
   \- historial;  
   \- servicios anteriores;  
   \- notas de reserva en texto libre.  
3\. El sistema identifica una oportunidad.  
4\. Genera una Opportunity.  
5\. Si procede de interpretación de texto libre, el detalle puede mostrar:  
   \- \`Why this was suggested\`  
   \- \`Original PMS note\`  
6\. Recepción decide si ejecuta la acción.

Ejemplo:

\`Guest arrives at airport at 19:45 and asked about transport options.\`

→

\`Offer airport transfer\`

\#\# 2.14. Consultar resultados operativos

Desde Dashboard el usuario consulta los últimos 7 días:

\- Upselling revenue.  
\- Loyalty sign-ups.  
\- Guests pampered.

Cada indicador puede compararse con los 7 días anteriores.

Los resultados se actualizan como consecuencia de las acciones ejecutadas.

\---

\# 3\. Fuera de scope

Las siguientes funcionalidades NO forman parte del producto/MVP actual.

No deben añadirse aunque parezcan mejoras lógicas.

\#\# PMS

Guest Experience CRM no sustituye al PMS.

No construir:

\- gestión completa de reservas;  
\- check-in/check-out administrativo;  
\- facturación;  
\- invoices;  
\- pagos;  
\- documentos de identidad;  
\- room inventory;  
\- asignación de habitaciones;  
\- disponibilidad general del hotel;  
\- gestión completa del perfil administrativo del huésped.

\#\# Gestión interna de departamentos

Recovery no es un sistema de operaciones internas.

No construir:

\- Assign to Maintenance.  
\- Assign to Housekeeping.  
\- Assign to F\&B.  
\- Department queues.  
\- Work orders.  
\- Technician workflow.  
\- Housekeeping workflow.  
\- Gestión de responsables internos.

Recovery existe exclusivamente para que recepción pueda hacer seguimiento de la experiencia del huésped.

\#\# Tasks

No construir:

\- Tasks module.  
\- Generic Tasks.  
\- To-do lists independientes.  
\- Categoría \`Task\`.

Toda acción debe pertenecer a:

\- Upselling.  
\- Loyalty.  
\- Guest Experience.  
\- Recovery.

\#\# Notifications

No construir:

\- Notification Center.  
\- Notification bell.  
\- Toast reminders.  
\- Reminder popups.  
\- Notification history.  
\- Alert banners para acciones pendientes.

La priorización y urgencia se gestionan desde Dashboard.

\#\# Analytics

No construir una sección independiente de Analytics.

Los únicos resultados del MVP viven en Dashboard:

\- Upselling revenue.  
\- Loyalty sign-ups.  
\- Guests pampered.

\#\# Settings

No construir Settings en el MVP.

No incluir Settings en la navegación.

La configuración futura podría incluir precios, servicios o reglas de generación de oportunidades, pero se considera ya configurada en el prototipo.

\#\# IA

No construir:

\- AI chatbot.  
\- AI assistant.  
\- Confidence scores.  
\- Generación automática de Opportunities a partir de Notes escritas dentro del CRM.  
\- Recomendaciones generativas no relacionadas con las reglas definidas.

El sistema sí puede interpretar información procedente del PMS, incluidas notas de reserva.

\#\# Administración

No construir:

\- Admin panel.  
\- Advanced permissions.  
\- Complex roles.  
\- User management.  
\- Service catalogue editor.  
\- Trigger rule editor.

\#\# Dispositivos

El MVP es desktop.

No construir específicamente:

\- mobile interface;  
\- tablet interface;  
\- mobile navigation.

\#\# Métricas adicionales

No añadir KPIs simplemente porque los datos estén disponibles.

No añadir, entre otros:

\- Recovery KPI.  
\- Average resolution time.  
\- Occupancy analytics.  
\- Conversion dashboards.  
\- Reception productivity scores.  
\- Employee rankings.

\---

\# 4\. Reglas que no se rompen

Estas reglas son invariantes del producto.

Cualquier pantalla o funcionalidad futura debe respetarlas.

\#\# 4.1. Action first, data second

La interfaz prioriza qué necesita hacer recepción.

No añadir información simplemente porque exista.

La información debe ayudar a:

\- decidir;  
\- actuar;  
\- priorizar;  
\- comprender el contexto de una acción.

\#\# 4.2. PMS \= source of truth / CRM \= action layer

El PMS contiene la información operativa principal.

Guest Experience CRM convierte esa información en acciones.

No duplicar innecesariamente funcionalidad del PMS.

\#\# 4.3. Existen cuatro categorías de acción

Toda acción pertenece a:

\- Upselling.  
\- Loyalty.  
\- Guest Experience.  
\- Recovery.

No existe una categoría genérica \`Task\`.

No existe un huésped sin acción. Cada fila de Check-ins, Check-outs, In-house y Recovery es un huésped que requiere una acción.

\#\# 4.4. Needs attention cuenta huéspedes, no acciones

Un huésped con una acción pendiente:

\`Needs attention \= 1\`

Un huésped con cinco acciones pendientes:

\`Needs attention \= 1\`

\#\# 4.5. Un huésped permanece en Needs attention hasta resolver todas sus acciones

Si Laura tiene:

\- Spa.  
\- Loyalty.

y se completa Spa:

Laura continúa en Needs attention.

Solo desaparece cuando Loyalty también queda resuelta.

\#\# 4.6. Resolver una acción actualiza todo el sistema

Las pantallas no mantienen estados independientes.

Ejemplo:

\`Spa Sold \+€80\`

debe reflejarse donde corresponda en:

\- Dashboard.  
\- Opportunities.  
\- Guest Profile.  
\- Activity.  
\- Upselling pending count.  
\- Upselling Revenue.  
\- Needs attention.

El producto utiliza un estado compartido coherente.

\#\# 4.7. La mayoría de Opportunities proceden automáticamente del PMS

El modelo principal es:

\`PMS data → detection → Opportunity\`

La creación manual existe como mecanismo secundario.

\#\# 4.8. Las Opportunities manuales siempre son explícitas

Una Note escrita por recepción nunca debe transformarse automáticamente en Opportunity.

El usuario debe ejecutar deliberadamente:

\`Create opportunity\`

\#\# 4.9. Notes y Actions son conceptos diferentes

\*\*Note:\*\* conocimiento cualitativo sobre el huésped.

\*\*Opportunity / Recovery:\*\* algo que requiere una acción.

No convertir automáticamente uno en otro.

\#\# 4.10. Notes y Activity permanecen separados

Notes contiene información escrita manualmente por recepción.

Activity contiene acontecimientos operativos generados por el sistema.

Nunca fusionarlos en un único timeline.

\#\# 4.11. Las Notes son acumulativas

Añadir una nueva Note nunca sobrescribe las anteriores.

Cada Note mantiene:

\- contenido;  
\- autor;  
\- fecha/hora.

\#\# 4.12. Recovery termina con el huésped

Una incidencia no está cerrada porque internamente alguien diga que está solucionada.

Solo se cierra cuando:

\`Confirmed with guest\`

\#\# 4.13. Recovery nunca gestiona el trabajo interno de otros departamentos

Recovery permite seguimiento desde recepción.

No asigna ni gestiona tareas de:

\- mantenimiento;  
\- housekeeping;  
\- F\&B;  
\- otros departamentos.

\#\# 4.14. Recovery severity precede a temporal proximity

Al priorizar acciones:

1\. Recovery severity.  
2\. Temporal proximity.

Severity:

\`Urgent → Normal → Low\`

\#\# 4.15. Dashboard prioriza y enlaza; no resuelve

Dashboard sirve para priorizar.

No debe convertirse en la lista completa de acciones.

Muestra como máximo 5 Priority Actions bajo el título \`Needs your attention\`. Esas acciones no se resuelven en el Dashboard: cada una enlaza al listado donde sí se resuelve.

Al lado hay una tabla informativa, \`VIP and returning\`, del mismo ancho y alto. El subtítulo invita a revisar el perfil de quien vuelve: \`Check the profiles of guests visiting us again.\`

Incluye huéspedes de la estancia actual que han venido al menos una vez antes.

Muestra huésped, habitación y un enlace \`View\`. El padding interior es el mismo que el del resto de cajas del Dashboard.

\`View\` abre el Guest Profile como página completa. La tabla no resuelve acciones.

Los bloques operativos del Dashboard enlazan a sus listados:

\- Check-ins.  
\- Check-outs.  
\- In-house.  
\- Recovery.

La lista de acciones prioritarias se titula \`Needs your attention\`. No existe un recuento aparte en la esquina del Dashboard.

La resolución ocurre en el listado:

\- Upselling, Loyalty y Guest Experience se resuelven en Check-ins, Check-outs o In-house.  
\- Recovery se resuelve en su listado.

En el listado, la columna se llama \`Mark the status\`. No hay selector desplegable. El recepcionista marca con un clic, en dos botones:

\- Upselling: \`Sold\` y \`Rejected\`.  
\- Loyalty: \`Signed up\` y \`Rejected\`.  
\- Guest Experience: \`Done\` y \`Rejected\`.

La fila marcada sale del listado general y se coloca debajo, en una caja blanca. Hay dos listados:

\- \`Sold\`, \`Signed up\` y \`Done\` juntos. Al final de la fila, un check verde.  
\- \`Rejected\`. Al final de la fila, una cruz roja.

Solo la fila marcada se oscurece en gris. La caja sigue blanca. Las que siguen sin marcar permanecen en el listado general, sin ese gris.

El título de Check-ins incluye la fecha del día.

Una acción de Check-ins que no se ha marcado como hecha ni como \`Rejected\` pasa a In-house. No se duplica: deja Check-ins y aparece en In-house.

Hecho significa \`Sold\` en Upselling, \`Signed up\` en Loyalty, \`Done\` en Guest Experience y \`Start\` en Recovery.

Si en In-house sigue sin realizarse:

\- Loyalty y Recovery pasan a Check-outs.  
\- Upselling y Guest Experience no pasan a Check-outs.

Lo ya marcado permanece en el listado donde se marcó.

Opportunities y Guest Profile también permiten resolver cuando el usuario ya está en ese contexto. El Dashboard nunca ofrece \`Sold\`, \`Rejected\`, \`Signed up\`, \`Done\` ni \`Start\`.

Para consultar el conjunto completo de oportunidades existe Opportunities. Para el conjunto de incidencias existe el listado de Recovery.

\#\# 4.16. Guest Profile siempre es una página completa

Guest Profile no debe convertirse en drawer o modal.

Representa el nivel de información más profundo sobre el huésped.

\#\# 4.17. Opportunities y Recovery utilizan drawers para detalle rápido

Desde sus tablas:

\`Table → Drawer\`

Desde una Opportunity puede profundizarse:

\`Table → Opportunity Drawer → Guest Profile\`

\#\# 4.18. Cerrar un drawer no destruye el contexto

Al cerrar un drawer deben mantenerse siempre que sea posible:

\- filtros;  
\- búsqueda;  
\- orden;  
\- posición de la tabla.

\#\# 4.19. Guests es una vista operativa, no una base de datos completa

No mostrar todos los huéspedes por defecto.

Priorizar:

1\. Needs attention.  
2\. Today's check-outs.  
3\. Today's check-ins.

Los demás huéspedes se recuperan mediante búsqueda/filtros.

\#\# 4.20. La búsqueda de huéspedes vive en Guests

No existe búsqueda global del producto.

Buscar huéspedes se realiza desde \`Guests\`.

\#\# 4.21. Guest Experience representa acciones ejecutables

Birthday, Anniversary o VIP welcome gift no son únicamente avisos.

Deben traducirse en una acción concreta.

Ejemplo:

No:

\`Laura's birthday today\`

Sí:

\- \`Birthday detail\`  
\- \`Anniversary detail\`  
\- \`VIP welcome gift\`

\#\# 4.22. Guest Experience se marca Done o Rejected

Estados:

\`Pending → Done\`

\`Pending → Rejected\`

o, si expira:

\`Pending → Not completed\`

Solo \`Done\` completa la acción.

\#\# 4.23. Upselling registra valor cuando existe una venta

Si una Opportunity de Upselling se completa como \`Sold\`, el precio configurado del servicio se añade automáticamente a Upselling Revenue.

El recepcionista no introduce manualmente el importe durante la venta.

\#\# 4.24. Loyalty solo incrementa resultados cuando existe alta

Solo:

\`Signed up\`

incrementa Loyalty sign-ups.

\`Rejected\` y \`Not completed\` no incrementan la métrica.

\#\# 4.25. Guest Experience solo incrementa resultados cuando se realiza

Solo:

\`Done\`

incrementa Guests pampered.

\#\# 4.26. Las acciones pueden expirar

Si una Opportunity deja de ser posible por haber terminado su ventana válida, puede pasar automáticamente a:

\`Not completed\`

No debe permanecer eternamente como Pending.

\#\# 4.27. No existen notificaciones paralelas al Dashboard

No crear posteriormente toast, notification center o reminder system para solucionar problemas de priorización.

La fuente principal de atención operativa es Dashboard.

\#\# 4.28. Los resultados viven en Dashboard

No crear otra fuente paralela de métricas.

Resultados del MVP:

\- Upselling revenue.  
\- Loyalty sign-ups.  
\- Guests pampered.

Periodo principal:

\`Last 7 days\`

con comparación:

\`Previous 7 days\`

\#\# 4.29. Las acciones rápidas viven en el listado

El Dashboard no resuelve acciones. Enlaza a Check-ins, Check-outs, In-house y Recovery.

Cuando una acción pueda resolverse de forma inequívoca con un clic, ese clic ocurre en el listado, sin obligar a abrir otra pantalla.

Ejemplos:

\- Sold.  
\- Rejected.  
\- Signed up.  
\- Done.  
\- Start.

El detalle se utiliza cuando hace falta contexto adicional.

\#\# 4.30. No ampliar el producto por convención

Que una funcionalidad sea habitual en un CRM, PMS o software hotelero no significa que pertenezca a Guest Experience CRM.

Ante una funcionalidad no especificada:

\> Elegir la solución más sencilla que preserve el modelo actual antes que ampliar el scope.  
