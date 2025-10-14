/**
 * @fileoverview Guardrail test for CLIMCPServer error handling consolidation.
 *
 * Stage 4 (Lane 4g) ensures that MCP server request failures are routed through
 * the shared ErrorHandler before Stage 6 (Lane 6f) performs runtime migrations.
 */

import { CLIMCPServer } from '../src/cli-mcp-server';
import { ErrorHandler } from '../../utils/error-handler';

describe('Guardrail: CLIMCPServer error handler integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('routes tool failures through ErrorHandler.handle', async () => {
    const server = new CLIMCPServer();
    const handleSpy = jest.spyOn(ErrorHandler, 'handle');

    const response = await server.handleMCPRequest({
      id: 'lane-4g-guardrail',
      method: 'tools/invalid',
      params: {}
    } as any);

    expect(response.error).toBeDefined();
    expect(handleSpy).toHaveBeenCalledTimes(1);
    expect(handleSpy).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining('mcp-channel'),
      expect.objectContaining({
        requestId: 'lane-4g-guardrail',
        method: 'tools/invalid'
      })
    );
  });
});
