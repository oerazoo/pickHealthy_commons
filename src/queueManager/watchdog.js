const QueueManager = require('./QueueManager');

/**
 * Watchdog para liberar mensajes atascados en la cola.
 * @param {QueueManager} queueManager - Instancia de QueueManager ya configurada.
 * @param {number} maxProcessingMinutes - Tiempo máximo en minutos permitido en "processing".
 * @param {number} intervalMs - Intervalo de ejecución en milisegundos.
 */
function startWatchdog(queueManager, maxProcessingMinutes = 5, intervalMs = 60 * 1000) {
  async function watchdog() {
    try {
      const query = `
        SELECT * FROM queue
        WHERE status = 'processing'
          AND locked_at IS NOT NULL
          AND locked_at < NOW() - INTERVAL '${maxProcessingMinutes} minutes'
      `;
      const { rows } = await queueManager.pool.query(query);

      for (const msg of rows) {
        await queueManager.retryMessage(msg.id);
        console.log(`Mensaje ${msg.id} liberado para reintento.`);
      }
    } catch (err) {
      console.error('Error en el watchdog:', err);
    }
  }

  setInterval(watchdog, intervalMs);
  // Si quieres ejecutarlo solo una vez, puedes exportar watchdog y llamarlo manualmente.
}

module.exports = startWatchdog;