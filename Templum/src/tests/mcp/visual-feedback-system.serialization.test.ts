import { jest } from '@jest/globals';
import { VisualFeedbackSystem } from '../../mcp-channel/src/visual-feedback-system';
import * as backendSerializationLog from '../../backend/backend-serialization-log';

describe('MCP visual feedback serialization integration', () => {
  let system: VisualFeedbackSystem | undefined;

  afterEach(() => {
    system?.dispose();
    system = undefined;
    jest.restoreAllMocks();
  });

  it('serializes custom sections with fallback when encountering circular content', () => {
    system = new VisualFeedbackSystem({ enableColors: false });
    const circular: Record<string, unknown> = {};
    (circular as any).self = circular;

    const emitSpy = jest
      .spyOn(backendSerializationLog, 'emitSerializationWarnings')
      .mockImplementation(() => undefined);

    const output = (system as any).renderSection({
      title: 'Custom',
      type: 'custom',
      content: circular,
      priority: 'low'
    });

    expect(typeof output).toBe('string');
    expect(output).toContain('[Circular]');

    const contexts = emitSpy.mock.calls.map(call => call[0]);
    expect(contexts).toContain('mcp:visual-feedback:section:custom');
    expect(contexts).not.toContain('mcp:visual-feedback:section:custom:fallback');
    const primaryCall = emitSpy.mock.calls.find(call => call[0] === 'mcp:visual-feedback:section:custom');
    expect(primaryCall?.[1]).toMatchObject({ meta: expect.objectContaining({ bytes: expect.any(Number) }) });
  });
});
