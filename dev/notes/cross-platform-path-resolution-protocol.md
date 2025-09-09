# Technical Proposal: The `path::` Cross-Platform Path Resolution Protocol

**Version:** 1.1  
**Status:** Proposed  
**Author:** Gabe

-----

## 1.0 Abstract

This document outlines a cross-platform path resolution system designed to unify application configuration in hybrid Windows/WSL environments. The system is comprised of two core components: a central `resolve_path()` translation function and a corresponding `path::` string prefix for data annotation. The function is called directly within an application's source code to resolve hardcoded pointers to configuration files, establishing a single source of truth. The `path::` prefix is then used within those configuration files to mark user-defined path strings for translation at runtime. This dual approach enables a single, shared configuration state, eliminating path incompatibility issues and providing a seamless user experience without manual setup.

-----

## 2.0 Problem Statement

In hybrid development environments, it is common for a developer to use the same application on both the native Windows host and within a WSL instance. These applications often rely on configuration files (`settings.json`, `.config`, etc.) that may contain absolute paths. The core problem arises from the fundamental incompatibility between Windows (`C:\...`) and POSIX (`/mnt/c/...`) pathing standards.

This incompatibility forces developers to either maintain two separate, parallel configurations or resort to manual workarounds. Standard industry solutions solve for portability across *different machines* but do not solve for a *single, shared configuration state* on one hybrid machine. This proposal aims to solve this specific interoperability challenge at the application level.

-----

## 3.0 Proposed Solution

The proposed solution is a two-component system centered around a single translation function that is applied in two distinct contexts: internal application logic and external data parsing.

### 3.1 Core Component: The `resolve_path()` Function

The heart of the system is a function, `resolve_path(string)`, integrated into the application. This function's sole responsibility is to take a string containing a canonical, absolute path from a "primary" filesystem (e.g., Windows NT) and return a path that is syntactically valid for the current operating system.

**Implementation Logic:**

1. **Input:** A string, e.g., `"C:\\Users\\Gabe\\Project"`.
2. **Detect Environment:** Determine the current operating system (e.g., Windows, Linux).
3. **Conditional Translation:**
      * If the current OS is **Windows**, return the input string unmodified.
      * If the current OS is **Linux** (in a WSL context), transform the input string into the equivalent WSL path (e.g., `/mnt/c/Users/Gabe/Project`).
4. **Output:** A filesystem-valid path string.

### 3.2 Application A: Internal Logic for Configuration Discovery

To solve the initial problem of locating a global configuration file, the developer uses the `resolve_path()` function directly in the application's source code on a hardcoded string. This forces both Windows and Linux executables to target the same physical file.

**Example (Rust pseudocode):**

```rust
fn get_global_config_path() -> PathBuf {
    // A single, direct function call on a hardcoded Windows path.
    let resolved_path = resolve_path("C:\\Users\\DefaultUser\\.claude\\settings.json"); 

    PathBuf::from(resolved_path)
}
```

* **When run on Windows:** The function returns the original string.
* **When run on WSL/Linux:** The function returns `/mnt/c/Users/DefaultUser/.claude/settings.json`.

This cleanly solves the discovery problem without needing symlinks or complex discovery heuristics.

### 3.3 Application B: External Data Annotation (The `path::` Protocol)

For paths stored as string values *within* configuration files (e.g., `settings.json`), the `path::` prefix is used. This prefix does not contain logic itself; it is a **marker** that signals to the application's configuration parser that the string requires translation.

The application's file-loading logic is responsible for this:

1. Parse the configuration file (e.g., JSON).
2. When iterating through string values, check for the `path::` prefix.
3. If the prefix is found, strip it and pass the remaining string to the `resolve_path()` function before using the value.

**Example in `settings.json`:**

```json
{
  "project_root": "path::C:\\Users\\Gabe\\Documents\\Infotopology",
  "asset_library": "D:\\Assets" // This path is not prefixed, so it's used as-is.
}
```

When parsing this file, the application would call `resolve_path("C:\\Users\\Gabe\\Documents\\Infotopology")` for the `project_root` value but use the `asset_library` value directly.

-----

## 4.0 Analysis & Trade-offs

This refined model maintains the same core benefits and considerations.

### 4.1 Advantages

* **Single Source of Truth:** A single function and a single config file create a unified state.
* **Zero User Friction:** The system is entirely self-contained within the application.
* **Clear Separation of Concerns:** The logic is centralized in one function. Its application is explicit in code (`resolve_path()`) and explicit in data (`path::` prefix).

### 4.2 Considerations & Trade-offs

* **Filesystem Primacy:** The system is intentionally designed around a primary filesystem (Windows NT) to solve the hybrid-environment problem.
* **Reduced Portability to Disparate Systems:** The model is optimized for a co-located Windows/WSL machine. Porting to a completely different environment (e.g., macOS) would require expanding the logic within the `resolve_path()` function.
* **Per-Application Implementation**: The functionality is self-contained within each application that implements it. Unlike a system utility, the benefit must be individually implemented by the developers of each tool to function.

-----

## 5.0 Conclusion

The `resolve_path()` function combined with the `path::` data prefix provides a clean, robust, and elegant solution for managing shared application state in a hybrid Windows/WSL environment. By separating the translation logic (the function) from its application (direct calls in code, markers in data), the system is both powerful and easy to maintain. It represents a pragmatic design that prioritizes a seamless user experience in a specific, high-value context.
