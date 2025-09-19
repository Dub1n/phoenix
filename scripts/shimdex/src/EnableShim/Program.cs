using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

var shimDir = Path.GetFullPath(AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
var shimExe = Path.Combine(shimDir, "powershell.exe");

if (!File.Exists(shimExe))
{
    Console.Error.WriteLine($"ps2wsl-enable: expected shim at {shimExe} but it was not found.");
    Console.Error.WriteLine("Build the shim (powershell.exe) before enabling it.");
    return 1;
}

TogglePath(shimDir, enable: true);

Console.WriteLine("ps2wsl shim enabled for current user.");
Console.WriteLine("Restart any open shells/IDEs to pick up the updated PATH.");
return 0;

static void TogglePath(string targetDir, bool enable)
{
    string? current = Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.User);
    var entries = Parse(current);
    string normalizedTarget = Normalize(targetDir);

    entries = entries
        .Where(e => Normalize(e) != normalizedTarget)
        .ToList();

    if (enable)
    {
        entries.Insert(0, targetDir);
    }

    string newPath = string.Join(";", entries);
    Environment.SetEnvironmentVariable("PATH", newPath, EnvironmentVariableTarget.User);
    Environment.SetEnvironmentVariable("PATH", newPath);
}

static List<string> Parse(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return new List<string>();
    return raw.Split(';', StringSplitOptions.RemoveEmptyEntries)
              .Select(s => s.Trim())
              .Where(s => s.Length > 0)
              .Distinct(StringComparer.OrdinalIgnoreCase)
              .ToList();
}

static string Normalize(string path)
{
    try
    {
        return Path.GetFullPath(path)
                   .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                   .ToLowerInvariant();
    }
    catch
    {
        return path.Trim().ToLowerInvariant();
    }
}
