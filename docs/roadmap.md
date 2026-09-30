# Roadmap

Guest Experience CRM. La v1 cubre el turno de recepción: el Dashboard orienta y enlaza; la acción se resuelve en el listado.

Escritorio, lienzo claro, tarjetas con aire y un solo acento coral. Datos de ejemplo, sin PMS real. Cada paso se construye y se comprueba solo, antes de pasar al siguiente.

## v1 — construir ahora

### 1. Dashboard de turno

Pantalla de inicio del turno, sin ningún control de resolución.

- Enlaces a Check-ins, Check-outs, In-house y Recovery.
- Needs attention como recuento de huéspedes, no como listado.
- Pendientes por categoría: Upselling, Loyalty, Guest Experience y Recovery.
- Como máximo 5 acciones prioritarias, redactadas como acción (`Offer airport transfer`, `Send birthday detail to room`) y enlazadas a su listado.
- Orden de esas 5: primero severidad de Recovery (`Urgent` → `Normal` → `Low`), después proximidad temporal.
- Tres cifras: Upselling revenue, Loyalty sign-ups, Guests pampered.

**Comprobación.** El Dashboard no muestra `Sold`, `Rejected`, `Signed up`, `Done` ni `Start`. Cada bloque y cada acción prioritaria abre su listado. Con un Recovery `Urgent` en los datos, esa acción aparece por delante de un upselling del mismo día. Nunca hay más de 5 acciones.

### 2. Check-ins, resolver la acción

Listado de llegadas de hoy. Cada fila muestra al huésped, la habitación y sus acciones pendientes. Ahí se resuelven Upselling, Loyalty y Guest Experience.

- Upselling: `Sold` o `Rejected`. `Sold` suma el precio ya configurado; el recepcionista no escribe el importe.
- Loyalty: `Signed up` o `Rejected`.
- Guest Experience: `Done`.

**Comprobación.** Marcar una acción la quita de la fila. Un huésped con dos acciones sigue en el listado hasta resolver la segunda. `Rejected` cierra la oportunidad y no suma revenue ni altas.

### 3. Check-outs e In-house

El mismo patrón de fila que Check-ins, limitado al momento de la estancia.

- Check-outs: salidas de hoy.
- In-house: huéspedes en casa que no llegan ni salen hoy.

**Comprobación.** Una acción de salida solo aparece en Check-outs, y una de estancia en curso solo en In-house. Resolverla en su listado la quita de esa fila y no la deja duplicada en otro listado del mismo momento.

### 4. Recovery hasta Start

Listado de incidencias, enlazado desde el Dashboard. Cada fila muestra huésped, habitación, incidencia y severidad.

- Estado inicial: `Pending`.
- `Start` pasa a `In progress`.

**Comprobación.** `Start` cambia el estado en la fila y no cierra la incidencia. No hay comentarios, historial ni `Confirmed with guest`.

### 5. Recálculo compartido

Un solo estado. Resolver en cualquier listado actualiza el Dashboard.

- Bajan los pendientes de esa categoría.
- Needs attention cuenta huéspedes: cinco acciones del mismo huésped cuentan como 1, y el huésped sigue contando hasta resolverlas todas.
- `Sold` suma Upselling revenue. `Signed up` suma Loyalty sign-ups. `Done` suma Guests pampered. `Rejected` y `Start` no mueven esas cifras.

**Comprobación.** Vender un spa de precio conocido aumenta Upselling revenue en el Dashboard al volver. Rechazar una alta no aumenta Loyalty sign-ups. Un huésped con spa y loyalty resuelto solo en spa sigue en Needs attention.

## Después — fuera de esta fase

Sigue siendo producto, y no entra en la v1:

- Tabla de Opportunities, filtros y drawer.
- Guests como lista operativa, búsqueda y Guest Profile a página completa.
- Notas, crear una oportunidad a mano y crear un Recovery a mano.
- Drawer de Recovery: comentarios, historial y cierre con `Confirmed with guest`.
- Llegada real del PMS y el bloque *Why this was suggested* / nota original. En la v1 las oportunidades nacen ya creadas.
- Caducidad automática de `Pending` a `Not completed`.
- Gráficos y comparación de los últimos 7 días con los 7 anteriores. En la v1 las tres cifras son contadores.

Sigue fuera del producto: sustituir al PMS, colas de otros departamentos, tasks genéricas, notificaciones, analytics aparte, settings, admin, IA y móvil.
