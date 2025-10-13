/**---
 * title: [Fallback Interface Adapter - Skin-Only Implementation]
 * tags: [InterfaceAdapter, Fallback, SkinDrivenRendering]
 * provides: [FallbackInterfaceAdapter]
 * requires: [UniversalSkinDefinition, StateUpdate]
 * description: [Lightweight adapter used when a concrete interface adapter is unavailable during tests or skin-only runs.]
 * ---*/

import {
  InterfaceAdapter,
  InterfaceAdapterStatus,
  InterfaceType,
  StateUpdate,
  UniversalSkinDefinition
} from '../types/templum-types';

/**
 * Fallback interface adapter that records skin and state updates without rendering.
 * Ensures interface switching logic can operate even when platform-specific adapters
 * (e.g., VSCode) are not available in the current environment.
 */
export class FallbackInterfaceAdapter implements InterfaceAdapter {
  private lastSkinId?: string;
  private lastStateTimestamp?: number;
  private disposed = false;

  constructor(private readonly interfaceType: InterfaceType) {}

  getInterfaceType(): InterfaceType {
    return this.interfaceType;
  }

  async applySkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    this.lastSkinId = skinDefinition.metadata.id;
  }

  async syncState(stateUpdate: StateUpdate): Promise<void> {
    this.lastStateTimestamp = stateUpdate.timestamp;
  }

  async dispose(): Promise<void> {
    this.disposed = true;
  }

  getStatus(): InterfaceAdapterStatus {
    return {
      active: !this.disposed,
      interfaceType: this.interfaceType,
      lastSkinId: this.lastSkinId,
      lastStateTimestamp: this.lastStateTimestamp
    };
  }
}
