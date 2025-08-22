// Mock VSCode API for Jest unit tests
const vscode = {
  commands: {
    registerCommand: jest.fn(),
    getCommands: jest.fn().mockResolvedValue(['haruspex.refreshAll'])
  },
  window: {
    createOutputChannel: jest.fn(() => ({
      append: jest.fn(),
      appendLine: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn(),
      hide: jest.fn(),
      show: jest.fn()
    })),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn()
  },
  workspace: {
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    })),
    getWorkspaceFolder: jest.fn(),
    workspaceFolders: []
  },
  ExtensionContext: jest.fn()
};

module.exports = vscode;