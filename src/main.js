const queueManager = require('./queueManager/QueueManager');
const watchdog = require('./queueManager/watchdog');

module.exports = {
  ...queueManager,
  ...watchdog
};