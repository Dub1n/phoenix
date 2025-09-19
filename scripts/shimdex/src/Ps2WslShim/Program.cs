using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Win32;

class Program
{
    static int Main(string[] args)
    {
        // bypass: set PS2WSL_BYPASS=1 to launch real PowerShell/Pwsh
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PS2WSL_BYPASS")))
        {
            var real = ResolveRealPowerShell();
            return Run(real, args);
        }

        // parse powershell flags and capture -Command / -c / -C / -File payload
        string mode = "interactive"; // or "command"
        string payload = "";         // what we'll run inside bash -lc
        bool fromEnc = false;        // was payload provided via -EncodedCommand?
        for (int i = 0; i < args.Length; i++)
        {
            string a = args[i];
            if (Eq(a, "-NoProfile") || Eq(a, "-NoLogo") || Eq(a, "-NonInteractive"))
                continue;

            if (Eq(a, "-ExecutionPolicy") && i + 1 < args.Length) { i++; continue; }
            if (Eq(a, "-EncodedCommand") || Eq(a, "-enc"))
            {
                if (i + 1 < args.Length)
                {
                    string b64 = args[i + 1].Trim();
                    try
                    {
                        // PowerShell EncodedCommand is UTF-16LE (a.k.a. "Unicode" on Windows)
                        byte[] bytes = Convert.FromBase64String(b64);
                        string decoded = Encoding.Unicode.GetString(bytes);
                        payload = decoded;
                        fromEnc = true;
                        mode = "command";
                        break; // captured the command payload; stop parsing flags
                    }
                    catch (FormatException)
                    {
                        // not valid Base64; skip token and continue gracefully
                        i++;
                        continue;
                    }
                }
                else
                {
                    // malformed invocation; ignore and continue
                    continue;
                }
            }

            if (Eq(a, "-Command") || Eq(a, "-c") || Eq(a, "-C"))
            {
                payload = string.Join(" ", args.Skip(i + 1));
                mode = "command";
                break;
            }

            if (Eq(a, "-File") && i + 1 < args.Length)
            {
                string file = args[i + 1];
                string rest = string.Join(" ", args.Skip(i + 2)).Trim();

                string cwdWsl = ToWslPath(Environment.CurrentDirectory);

                string scriptPath;
                try
                {
                    scriptPath = Path.GetFullPath(file);
                }
                catch (Exception)
                {
                    scriptPath = file;
                }

                string scriptWsl = ToWslPath(scriptPath);
                string suffix = string.IsNullOrEmpty(rest) ? string.Empty : $" {rest}";
                payload = $"cd \"{cwdWsl}\" && bash \"{scriptWsl}\"{suffix}";
                mode = "command";
                break;
            }
        }

        // if no command, drop into an interactive bash login shell
        if (mode == "interactive")
            return RunWsl("bash", "-l");

        // normalize payload (skip de-escaping if it came from -EncodedCommand)
        string cmd = fromEnc ? payload.Trim() : DePs(payload).Trim();

        if (string.IsNullOrWhiteSpace(cmd))
            return RunWsl("bash", "-l");

        if (!fromEnc && LooksLikePowerShellScript(cmd))
            return AdvisePowerShellBypass(cmd);

        // fast-path: if payload already uses wsl/bash, avoid double-wrapping
        if (cmd.StartsWith("wsl ", StringComparison.OrdinalIgnoreCase))
        {
            var after = cmd.Substring(3).Trim();
            return RunWslArgsString(after, preserveQuotes: fromEnc);
        }
        if (Regex.IsMatch(cmd, @"^bash\s+-lc\s+", RegexOptions.IgnoreCase))
        {
            return RunWslArgsString(cmd, preserveQuotes: fromEnc);
        }

        // default: run inside bash -lc, cd into repo for consistency
        string cwd = ToWslPath(Environment.CurrentDirectory);
        string wrapped = $"cd \"{cwd}\" && {cmd}";
        return RunWsl("bash", "-lc", wrapped);
    }

    // ----- helpers ---------------------------------------------------------

    static bool Eq(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    // minimal de-escaping for payloads that came through PowerShell JSON/quotes
    static string DePs(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        s = s.Trim();
        if ((s.StartsWith("\"") && s.EndsWith("\"")) || (s.StartsWith("'") && s.EndsWith("'")))
            s = s.Substring(1, s.Length - 2);
        var sb = new StringBuilder(s.Length);
        for (int i = 0; i < s.Length; i++)
        {
            if (s[i] == '`' && i + 1 < s.Length)
            {
                char next = s[i + 1];
                if (next == '"' || next == '$' || next == '`')
                {
                    sb.Append(next);
                    i++;
                    continue;
                }
            }
            sb.Append(s[i]);
        }
        return sb.ToString();
    }

    static int Run(string exe, params string[] args)
    {
        var psi = new ProcessStartInfo(exe) { UseShellExecute = false };
        if (args != null)
        {
            foreach (var arg in args)
            {
                if (arg != null)
                    psi.ArgumentList.Add(arg);
            }
        }
        var p = Process.Start(psi);
        p?.WaitForExit();
        return p?.ExitCode ?? 0;
    }

    static int RunWsl(params string[] argv)
    {
        var psi = new ProcessStartInfo(@"C:\\Windows\\System32\\wsl.exe") { UseShellExecute = false };
        foreach (var a in argv) psi.ArgumentList.Add(a);
        var p = Process.Start(psi);
        p?.WaitForExit();
        return p?.ExitCode ?? 0;
    }

    // Accept a single string like "bash -lc \"echo hi\"" and split conservatively.
    // For our use cases (bash -lc <payload>), a simple split on first two tokens is robust.
    static int RunWslArgsString(string s, bool preserveQuotes = false)
    {
        if (string.IsNullOrWhiteSpace(s)) return RunWsl("bash", "-l");
        s = s.Trim();
        // if it already starts with bash -lc, extract the payload portion preserving quotes
        if (Regex.IsMatch(s, @"^bash\s+-lc\s+", RegexOptions.IgnoreCase))
        {
            var after = s.Substring(s.IndexOf("-lc", StringComparison.OrdinalIgnoreCase) + 3).Trim();
            var payload = preserveQuotes ? after : TrimOneLayer(after);
            return RunWsl("bash", "-lc", payload);
        }
        // otherwise, best effort split: first token + remainder
        var parts = s.Split(new[] { ' ' }, 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1) return RunWsl(parts[0]);
        return RunWsl(parts[0], parts[1]);
    }

    static string TrimOneLayer(string x)
    {
        if (string.IsNullOrEmpty(x)) return x;
        x = x.Trim();
        if ((x.StartsWith("\"") && x.EndsWith("\"")) || (x.StartsWith("'") && x.EndsWith("'")))
            return x.Substring(1, x.Length - 2);
        return x;
    }


    static bool LooksLikePowerShellScript(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        if (Regex.IsMatch(text, @"(^|[;\r\n])\s*\$\w+\s*=")) return true;
        if (Regex.IsMatch(text, @"\[[A-Za-z0-9_.`]+\]::")) return true;
        if (Regex.IsMatch(text, @"\b(?:Get|Set|New|Remove|Select|Where|ForEach|Start|Stop|Write|Test|Convert|Import|Export|Invoke)-[A-Za-z]")) return true;
        return false;
    }

    static int AdvisePowerShellBypass(string cmd)
    {
        Console.Error.WriteLine("ps2wsl: command appears to rely on PowerShell syntax.");
        Console.Error.WriteLine("ps2wsl: *** ALWAYS RUN COMMANDS IN BASH UNLESS IT IS ABSOLUTELY IMPOSSIBLE. ***");
        Console.Error.WriteLine("ps2wsl: set PS2WSL_BYPASS=1 to run this invocation in PowerShell.");
        return 1;
    }
    static string ResolveRealPowerShell()
    {
        var candidates = new List<string>();

        string? envOverride = Environment.GetEnvironmentVariable("PS2WSL_REAL_POWERSHELL");
        if (!string.IsNullOrWhiteSpace(envOverride))
            candidates.Add(envOverride.Trim());

        string? registryPwsh = GetRegistryPwsh();
        if (!string.IsNullOrEmpty(registryPwsh))
            candidates.Add(registryPwsh);

        candidates.AddRange(GetProgramFilesPwshCandidates());

        string system32 = Environment.GetFolderPath(Environment.SpecialFolder.System);
        if (!string.IsNullOrEmpty(system32))
            candidates.Add(Path.Combine(system32, "WindowsPowerShell", "v1.0", "powershell.exe"));

        string? pathPwsh = FindExecutableOnPath("pwsh.exe");
        if (!string.IsNullOrEmpty(pathPwsh))
            candidates.Add(pathPwsh);

        string? pathPs = FindExecutableOnPath("powershell.exe");
        if (!string.IsNullOrEmpty(pathPs))
            candidates.Add(pathPs);

        foreach (var candidate in candidates)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(candidate) && File.Exists(candidate))
                    return candidate;
            }
            catch
            {
                // ignore invalid paths
            }
        }

        return "powershell.exe";
    }

    static string? GetRegistryPwsh()
    {
        if (!OperatingSystem.IsWindows())
            return null;

        try
        {
            foreach (var view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
            {
                using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view);
                using var key = baseKey.OpenSubKey("SOFTWARE\\Microsoft\\PowerShellCore");
                var installPath = key?.GetValue("InstallPath") as string;
                if (!string.IsNullOrWhiteSpace(installPath))
                {
                    var exe = Path.Combine(installPath, "pwsh.exe");
                    if (File.Exists(exe))
                        return exe;
                }
            }
        }
        catch
        {
            // registry access not available or unexpected; ignore
        }
        return null;
    }

    static IEnumerable<string> GetProgramFilesPwshCandidates()
    {
        if (!OperatingSystem.IsWindows())
            yield break;

        var roots = new[]
        {
            Environment.GetEnvironmentVariable("ProgramW6432"),
            Environment.GetEnvironmentVariable("ProgramFiles"),
            Environment.GetEnvironmentVariable("ProgramFiles(x86)")
        };

        foreach (var root in roots)
        {
            if (string.IsNullOrWhiteSpace(root))
                continue;
            yield return Path.Combine(root, "PowerShell", "7", "pwsh.exe");
            yield return Path.Combine(root, "PowerShell", "pwsh.exe");
        }
    }

    static string? FindExecutableOnPath(string exeName)
    {
        try
        {
            var pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (string.IsNullOrWhiteSpace(pathEnv)) return null;
            foreach (var segment in pathEnv.Split(';', StringSplitOptions.RemoveEmptyEntries))
            {
                string trimmed = segment.Trim();
                if (trimmed.Length == 0) continue;
                var candidate = Path.Combine(trimmed, exeName);
                if (File.Exists(candidate))
                    return candidate;
            }
        }
        catch
        {
            // PATH might contain malformed entries; ignore
        }
        return null;
    }

    static string ToWslPath(string winPath)
    {
        if (string.IsNullOrWhiteSpace(winPath)) return winPath;

        if (winPath.StartsWith("/"))
            return winPath;

        string normalized = winPath;
        try
        {
            normalized = Path.GetFullPath(normalized);
        }
        catch
        {
            // fall back to the original string if GetFullPath cannot handle the input
        }

        normalized = normalized.Replace('\\', '/');

        if (normalized.StartsWith("//wsl$/", StringComparison.OrdinalIgnoreCase))
        {
            var remainder = normalized.Substring("//wsl$/".Length);
            int slash = remainder.IndexOf('/');
            return slash >= 0 ? remainder.Substring(slash) : "/";
        }

        if (normalized.Length >= 2 && normalized[1] == ':')
        {
            char drive = char.ToLowerInvariant(normalized[0]);
            return "/mnt/" + drive + normalized.Substring(2);
        }

        if (normalized.StartsWith("//"))
        {
            var trimmed = normalized.Trim('/');
            return "/mnt/unc/" + trimmed;
        }

        return normalized;
    }
}







