"use strict";

const path = require("path");

let tsNodeRegistered = false;

const registerTsNode = () => {
  if (tsNodeRegistered) {
    return;
  }
  try {
    require("ts-node/register/transpile-only");
    tsNodeRegistered = true;
  } catch (error) {
    const message =
      "Unable to load Templum TypeScript sources automatically. Run `npm run build` to generate dist artefacts or add ts-node/register.";
    const failure = new Error(message);
    failure.cause = error;
    throw failure;
  }
};

const resolveAndRequire = (...segments) => {
  const absolutePath = path.resolve(__dirname, ...segments);
  return require(absolutePath);
};

const loadTemplumModule = (distSegments, srcSegments) => {
  try {
    return resolveAndRequire(...distSegments);
  } catch (distError) {
    registerTsNode();
    try {
      return resolveAndRequire(...srcSegments);
    } catch (srcError) {
      const failure = new Error(
        `Failed to load module at ${path.join(...distSegments)} and fallback ${path.join(
          ...srcSegments
        )}`
      );
      failure.cause = srcError;
      failure.distError = distError;
      throw failure;
    }
  }
};

const createScriptRuntime = (context) => {
  const { ErrorHandler } = loadTemplumModule(
    ["..", "..", "dist", "src", "utils", "error-handler.js"],
    ["..", "..", "src", "utils", "error-handler.ts"]
  );
  const { createLogger, LogLevel } = loadTemplumModule(
    ["..", "..", "dist", "src", "utils", "logger.js"],
    ["..", "..", "src", "utils", "logger.ts"]
  );

  const logger = createLogger(context);

  const setExitCode = (code) => {
    if (typeof code !== "number" || Number.isNaN(code)) {
      return;
    }
    if (code === 0) {
      if (process.exitCode === undefined) {
        process.exitCode = 0;
      }
      return;
    }
    if (process.exitCode === undefined || process.exitCode === 0) {
      process.exitCode = code;
      return;
    }
    process.exitCode = Math.max(process.exitCode, code);
  };

  const handleError = (error, scope, metadata) =>
    ErrorHandler.handle(error, scope, metadata);

  const handleAsync = (promise, scope, options = {}) =>
    ErrorHandler.handleAsync(promise, scope, options);

  const exitWithError = (error, scope, metadata) => {
    handleError(error, scope, metadata);
    setExitCode(1);
    return process.exitCode;
  };

  const wrapAsync = async (fn, scope, metadata) => {
    try {
      return await fn();
    } catch (error) {
      exitWithError(error, scope, metadata);
      throw error;
    }
  };

  return {
    logger,
    LogLevel,
    ErrorHandler,
    handleError,
    handleAsync,
    exitWithError,
    wrapAsync,
    setExitCode,
  };
};

module.exports = {
  createScriptRuntime,
};
