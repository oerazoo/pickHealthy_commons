const QueueManager = require('../queueManager/QueueManager');
const { Pool } = require('pg');

describe('QueueManager', () => {
  let queueManager;
  let poolMock;

  beforeEach(() => {
    poolMock = {
      query: jest.fn(),
      end: jest.fn()
    };
    queueManager = new QueueManager({});
    queueManager.pool = poolMock;
  });

  it('should enqueue a message', async () => {
    const fakeRow = { id: 1, topic: 'test', payload: 'data' };
    poolMock.query.mockResolvedValue({ rows: [fakeRow] });
    const result = await queueManager.enqueue('test', 'data');
    expect(poolMock.query).toHaveBeenCalled();
    expect(result).toEqual(fakeRow);
  });

  it('should fetch pending messages', async () => {
    const fakeRows = [{ id: 1 }];
    poolMock.query.mockResolvedValue({ rows: fakeRows });
    const result = await queueManager.fetchPendingMessages('ms', 'topic');
    expect(poolMock.query).toHaveBeenCalled();
    expect(result).toEqual(fakeRows);
  });

  it('should mark message as done', async () => {
    const fakeRow = { id: 1, status: 'done' };
    poolMock.query.mockResolvedValue({ rows: [fakeRow] });
    const result = await queueManager.markAsDone(1);
    expect(poolMock.query).toHaveBeenCalled();
    expect(result).toEqual(fakeRow);
  });

  it('should mark message as error', async () => {
    const fakeRow = { id: 1, status: 'error' };
    poolMock.query.mockResolvedValue({ rows: [fakeRow] });
    const result = await queueManager.markAsError(1, 'fail');
    expect(poolMock.query).toHaveBeenCalled();
    expect(result).toEqual(fakeRow);
  });

  it('should retry message', async () => {
    const fakeRow = { id: 1, status: 'retrying' };
    poolMock.query.mockResolvedValue({ rows: [fakeRow] });
    const result = await queueManager.retryMessage(1);
    expect(poolMock.query).toHaveBeenCalled();
    expect(result).toEqual(fakeRow);
  });

  it('should delete queue message', async () => {
    poolMock.query.mockResolvedValue({ rowCount: 1 });
    const result = await queueManager.deleteQueueMessage(1);
    expect(poolMock.query).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should close the pool', async () => {
    await queueManager.close();
    expect(poolMock.end).toHaveBeenCalled();
  });
});
