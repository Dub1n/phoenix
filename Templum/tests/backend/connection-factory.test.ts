/**
 * @fileoverview Connection Factory Tests - TASK-GENERIC-001
 * @author Claude Code Implementation  
 * @created 2025-08-29
 * 
 * Tests for the Generic Connection Factory implementation
 */

import { ConnectionFactory } from '../../src/backend/connection-factory';
import { BackendConfig } from '../../src/types/universal-skin-engine-types';

describe('ConnectionFactory', () => {
  describe('create', () => {
    it('should validate configuration and require protocol', async () => {
      const invalidConfig = {
        service: 'test',
        version: '1.0.0'
      } as BackendConfig;

      await expect(
        ConnectionFactory.create('test', invalidConfig)
      ).rejects.toThrow('Protocol is required in BackendConfig');
    });

    it('should validate configuration and require endpoint', async () => {
      const invalidConfig = {
        service: 'test',
        version: '1.0.0',
        protocol: 'http'
      } as BackendConfig;

      await expect(
        ConnectionFactory.create('test', invalidConfig)
      ).rejects.toThrow('Endpoint is required in BackendConfig');
    });

    it('should create HTTP connection with valid config', async () => {
      const config: BackendConfig = {
        service: 'pcl',
        version: '1.0.0',
        protocol: 'http',
        endpoint: 'http://localhost:3002',
        timeout: 10000,
        retries: 3,
        authentication: { type: 'none' }
      };

      const connection = await ConnectionFactory.create('pcl', config);
      
      expect(connection).toBeDefined();
      expect(connection.id).toBe('pcl');
      expect(connection.protocol).toBe('http');
      expect(connection.endpoint).toBe('http://localhost:3002');
      expect(typeof connection.connect).toBe('function');
      expect(typeof connection.disconnect).toBe('function');
      expect(typeof connection.isConnected).toBe('function');
    });

    it('should create WebSocket connection with valid config', async () => {
      const config: BackendConfig = {
        service: 'litany',
        version: '1.0.0',
        protocol: 'websocket',
        endpoint: 'ws://localhost:3003',
        timeout: 15000,
        retries: 3,
        authentication: { type: 'none' }
      };

      const connection = await ConnectionFactory.create('litany', config);
      
      expect(connection).toBeDefined();
      expect(connection.id).toBe('litany');
      expect(connection.protocol).toBe('websocket');
      expect(connection.endpoint).toBe('ws://localhost:3003');
    });

    it('should create IPC connection with valid config', async () => {
      const config: BackendConfig = {
        service: 'haruspex',
        version: '2.0.0',
        protocol: 'ipc',
        endpoint: 'ipc://localhost:3001',
        timeout: 10000,
        retries: 3,
        authentication: { type: 'none' },
        options: { workspacePath: '/test/workspace' }
      };

      const connection = await ConnectionFactory.create('haruspex', config);
      
      expect(connection).toBeDefined();
      expect(connection.id).toBe('haruspex');
      expect(connection.protocol).toBe('ipc');
      expect(connection.endpoint).toBe('ipc://localhost:3001');
    });

    it('should reject unsupported protocols', async () => {
      const config = {
        service: 'test',
        version: '1.0.0',
        protocol: 'unsupported' as any,
        endpoint: 'unsupported://localhost:3000'
      } as BackendConfig;

      await expect(
        ConnectionFactory.create('test', config)
      ).rejects.toThrow('Unsupported protocol: unsupported');
    });

    it('should reject GRPC connections as not implemented', async () => {
      const config: BackendConfig = {
        service: 'test',
        version: '1.0.0',
        protocol: 'grpc' as any,
        endpoint: 'grpc://localhost:3000'
      };

      await expect(
        ConnectionFactory.create('test', config)
      ).rejects.toThrow(/Unsupported protocol: grpc/);
    });
  });

  describe('configuration validation', () => {
    it('should set default values for optional fields', async () => {
      const config: BackendConfig = {
        service: 'test',
        version: '1.0.0',
        protocol: 'http',
        endpoint: 'http://localhost:3000'
      };

      const connection = await ConnectionFactory.create('test', config);
      
      // Defaults should be applied during validation
      expect(config.timeout).toBe(10000);
      expect(config.retries).toBe(3);
      expect(config.keepAlive).toBe(true);
    });
  });
});
