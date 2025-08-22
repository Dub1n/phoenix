import * as vscode from 'vscode';
import { activate } from './extension';

test('registers refreshAll command on activate', async () => {
  const ctx = { subscriptions: [] } as unknown as vscode.ExtensionContext;
  activate(ctx);
  const cmds = await vscode.commands.getCommands(true);
  expect(cmds).toContain('haruspex.refreshAll');
});