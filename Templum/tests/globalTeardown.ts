import whyIsNodeRunning from 'why-is-node-running';

const IGNORE_HANDLE = new Set(['WriteStream', 'ReadStream']);
const SETTLE_TIMEOUT_MS = 750;
const SETTLE_POLL_INTERVAL_MS = 50;

const isIgnorableHandle = (handle: unknown): boolean => {
  if (!handle || typeof handle !== 'object') {
    return false;
  }

  const maybeHandle = handle as { isTTY?: boolean; constructor?: { name?: string } };
  if (maybeHandle.isTTY) {
    return true;
  }

  const fd = (maybeHandle as { fd?: number }).fd;
  if (typeof fd === 'number' && (fd === 0 || fd === 1 || fd === 2)) {
    return true;
  }

  const ctorName = maybeHandle.constructor?.name;
  if (ctorName && IGNORE_HANDLE.has(ctorName)) {
    return true;
  }

  return false;
};

export default async function globalTeardown(): Promise<void> {
  const nodeProcess = process as NodeJS.Process & {
    _getActiveHandles?: () => unknown[];
    _getActiveRequests?: () => unknown[];
  };

  const pollHandles = (): unknown[] => {
    if (typeof nodeProcess._getActiveHandles !== 'function') {
      return [];
    }
    const handles = nodeProcess._getActiveHandles() ?? [];
    return handles.filter((handle: unknown) => !isIgnorableHandle(handle));
  };

  const pollRequests = (): unknown[] => {
    if (typeof nodeProcess._getActiveRequests !== 'function') {
      return [];
    }
    return nodeProcess._getActiveRequests() ?? [];
  };

  const waitForResourceDrain = async (): Promise<{ handles: unknown[]; requests: unknown[] }> => {
    const deadline = Date.now() + SETTLE_TIMEOUT_MS;
    let handles = pollHandles();
    let requests = pollRequests();

    while ((handles.length > 0 || requests.length > 0) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, SETTLE_POLL_INTERVAL_MS));
      handles = pollHandles();
      requests = pollRequests();
    }

    return { handles, requests };
  };

  const { handles: activeHandles, requests: activeRequests } = await waitForResourceDrain();

  if (activeHandles.length > 0 || activeRequests.length > 0) {
    whyIsNodeRunning();

    const handleSummary = activeHandles
      .map((handle: unknown) => {
        if (!handle || typeof handle !== 'object') {
          return 'unknown';
        }
        const ctorName = (handle as { constructor?: { name?: string } }).constructor?.name ?? 'unknown';
        if (ctorName === 'Socket') {
          const socket = handle as { localAddress?: string; localPort?: number; remoteAddress?: string; remotePort?: number };
          return `${ctorName}(local=${socket.localAddress ?? ''}:${socket.localPort ?? ''}, remote=${socket.remoteAddress ?? ''}:${socket.remotePort ?? ''})`;
        }
        return ctorName;
      })
      .join(', ');

    throw new Error(
      `Detected ${activeHandles.length} active handle(s) [${handleSummary}] and ${activeRequests.length} request(s) after tests. ` +
        'Resolve leaked resources or explicitly dispose of them in test teardown.'
    );
  }
}
