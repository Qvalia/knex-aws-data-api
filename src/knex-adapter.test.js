/* eslint-disable no-underscore-dangle */
const knexAdapter = require('./knex-adapter');

/*
 * The adapter mutates a client prototype rather than exporting anything callable, so each
 * test builds a throwaway client and stubs `_driver` - the one place a real RDSDataClient
 * would be constructed - with a counter. That counter is the whole point: it is how many
 * SDK clients, HTTPS agents and DNS lookups a pool's worth of connections costs.
 */
const buildClient = () => {
  function BaseClient() {}
  BaseClient.prototype.destroyRawConnection = () => {
    throw new Error('dialect destroyRawConnection should never run for a Data API connection');
  };

  function ClientRDSDataAPI() {}
  knexAdapter(ClientRDSDataAPI, BaseClient, 'postgres');

  const client = new ClientRDSDataAPI();
  let built = 0;
  client._driver = () => {
    built += 1;
    return { clientNumber: built, query: () => Promise.resolve({ records: [] }) };
  };

  return { client, builds: () => built };
};

describe('knexAdapter acquireConnection()', () => {
  test('builds one Data API client however many connections the pool asks for', async () => {
    const { client, builds } = buildClient();

    await Promise.all([1, 2, 3, 4, 5].map(() => client.acquireConnection()));

    // One per connection is what exhausts a long-lived process: each abandoned client keeps
    // its agent's keep-alive sockets open, and nothing ever closes them.
    expect(builds()).toBe(1);
  });

  test('reuses the same client across acquire/destroy cycles', async () => {
    const { client, builds } = buildClient();

    const first = await client.acquireConnection();
    await client.destroyRawConnection(first);
    const second = await client.acquireConnection();

    expect(builds()).toBe(1);
    expect(second.clientNumber).toBe(1);
  });

  test('gives every connection its own object, so transaction state is not shared', async () => {
    const { client } = buildClient();

    const one = await client.acquireConnection();
    const other = await client.acquireConnection();

    one.rdsTransactionId = 'tx-1';
    one.isTransaction = true;

    expect(one).not.toBe(other);
    expect(other.rdsTransactionId).toBeUndefined();
    expect(other.isTransaction).toBeUndefined();
    // ... while the client's own methods still come through the prototype.
    expect(typeof other.query).toBe('function');
  });

  test('a destroyed connection leaves the shared client usable', async () => {
    const { client } = buildClient();

    const connection = await client.acquireConnection();
    await expect(client.destroyRawConnection(connection)).resolves.toBeUndefined();

    const next = await client.acquireConnection();
    await expect(next.query()).resolves.toEqual({ records: [] });
  });

  test('never calls the dialect destroyRawConnection, which assumes a pg socket', async () => {
    // The dialect's version calls connection.end(); a Data API client has no such method,
    // so it threw on every reaped connection and the client was discarded unclosed.
    const { client } = buildClient();

    const connection = await client.acquireConnection();

    await expect(client.destroyRawConnection(connection)).resolves.not.toThrow();
  });
});
