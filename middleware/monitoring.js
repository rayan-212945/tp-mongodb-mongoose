// middleware/monitoring.js
const mongoose = require('mongoose');

/**
 * Monitoring robuste :
 * - marche si Mongoose fournit next (query middleware classique)
 * - marche aussi si quelqu'un l'appelle à la main via monitorQuery.call(this)
 */
const monitorQuery = function (next) {
  const start = Date.now();
  const query = this;

  // Wrap exec si possible
  if (query && typeof query.exec === 'function') {
    const originalExec = query.exec;

    query.exec = async function (...args) {
      const result = await originalExec.apply(this, args);
      const duration = Date.now() - start;

      if (duration > 100) {
        console.warn(`⚠️ Requête lente (${duration}ms):`, {
          collection: this.mongooseCollection?.name,
          operation: this.op,
          filter: typeof this.getFilter === 'function' ? this.getFilter() : undefined,
          duration: `${duration}ms`
        });
      }

      return result;
    };
  }

  // ✅ Si next existe, on appelle. Sinon, on ne fait rien.
  if (typeof next === 'function') next();
};

const getDatabaseStats = async () => {
  const stats = await mongoose.connection.db.stats();

  console.log('📊 Statistiques MongoDB:');
  console.log('- Taille base:', (stats.dataSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('- Taille index:', (stats.indexSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('- Collections:', stats.collections);
  console.log('- Index:', stats.indexes);
};

module.exports = {
  monitorQuery,
  getDatabaseStats
};
