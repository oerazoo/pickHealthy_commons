const { Pool } = require('pg');

class QueueManager {
  /**
   * @param {Object} config - Configuración de conexión para pg.Pool
   */
  constructor(config) {
    this.pool = new Pool(config);
  }

  // Crear un nuevo mensaje en la cola (enqueue)
  async enqueue(topic, payload, options = {}) {
    const {
      status = 'pending',
      max_retries = 3,
      priority = null
    } = options;
    const query = `
      INSERT INTO queue (topic, payload, status, max_retries, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [topic, payload, status, max_retries, priority];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  // Obtener mensajes pendientes por topic
  async fetchPendingMessages(microservice, topic, limit = 10) {
    const query = `
      UPDATE queue
      SET locked_by = $1, locked_at = NOW(), updated_at = NOW(), status = 'processing'
      WHERE id IN (
        SELECT id FROM queue
        WHERE topic = $2
          AND status = 'pending'
          AND locked_by IS NULL
          AND locked_at IS NULL
        ORDER BY created_at ASC
        LIMIT $3
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [microservice, topic, limit]);
    return rows;
  }

  // Marcar mensaje como done
  async markAsDone(id) {
    const query = `
      UPDATE queue
      SET status = 'done', updated_at = CURRENT_TIMESTAMP, locked_by = NULL, locked_at = NULL
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [id]);
    return rows[0];
  }

  // Marcar mensaje como error
  async markAsError(id, errorMsg) {
    const query = `
      UPDATE queue
      SET status = 'error', last_error = $2, updated_at = CURRENT_TIMESTAMP, locked_by = NULL, locked_at = NULL
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [id, errorMsg]);
    return rows[0];
  }

  // Reintentar mensaje (retry)
  async retryMessage(id) {
    const query = `
      UPDATE queue
      SET status = 'retrying', retries = retries + 1, updated_at = CURRENT_TIMESTAMP, locked_by = NULL, locked_at = NULL
      WHERE id = $1 AND retries < max_retries
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [id]);
    return rows[0];
  }

  async deleteQueueMessage(id) {
    const { rowCount } = await this.pool.query('DELETE FROM queue WHERE id = $1;', [id]);
    return rowCount > 0;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = QueueManager;