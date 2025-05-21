const queueManager = require('./src/queueManager/QueueManager');
const watchdog = require('./src/queueManager/watchdog');

module.exports = {
  ...queueManager,
  ...watchdog
};