function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function computeDurationMs(startIso, endIso) {
  if (!startIso) {
    return null;
  }
  const start = Date.parse(startIso);
  const end = Date.parse(endIso || nowIso());
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null;
  }
  return end - start;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const parts = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hours % 24) {
    parts.push(`${hours % 24}h`);
  }
  if (minutes % 60 && parts.length < 3) {
    parts.push(`${minutes % 60}m`);
  }
  if (parts.length === 0 && seconds) {
    parts.push(`${seconds % 60}s`);
  }
  return parts.join(' ');
}

export { computeDurationMs, formatDuration, nowIso };
