const startWatchdog = require('../queueManager/watchdog');
const QueueManager = require('../queueManager/QueueManager');

jest.useFakeTimers();

describe('startWatchdog', () => {
  let queueManager;

  beforeEach(() => {
    queueManager = {
      pool: {
        query: jest.fn(),
      },
      retryMessage: jest.fn(),
    };
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('debe liberar mensajes atascados para reintento', async () => {
    const fakeRows = [
      { id: 1 },
      { id: 2 },
    ];
    queueManager.pool.query.mockResolvedValue({ rows: fakeRows });
    queueManager.retryMessage.mockResolvedValue();

    startWatchdog(queueManager, 5, 1000);

    // Avanza el temporizador para ejecutar el watchdog
    await jest.runOnlyPendingTimersAsync();

    expect(queueManager.pool.query).toHaveBeenCalled();
    expect(queueManager.retryMessage).toHaveBeenCalledTimes(fakeRows.length);
    expect(queueManager.retryMessage).toHaveBeenCalledWith(1);
    expect(queueManager.retryMessage).toHaveBeenCalledWith(2);
  });

  it('debe manejar errores sin lanzar excepción', async () => {
    queueManager.pool.query.mockRejectedValue(new Error('DB error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    startWatchdog(queueManager, 5, 1000);
    await jest.runOnlyPendingTimersAsync();
    // No debe lanzar excepción
    expect(queueManager.pool.query).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
