export function stripControlAndAnsi(input: string): string {
  if (!input) return "";
  return (
    input
      // Strip OSC sequences (e.g., OSC 52 clipboard writes, hyperlinks) terminated by BEL or ST
      .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "")
      // Strip ANSI CSI and single-character ESC sequences
      .replace(/\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
      // Strip C0/C1 control characters except \t, \n, \r
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "")
  );
}

export function redactSecrets(input: string): string {
  if (!input) return "";
  return (
    input
      // URL user:password@host credentials
      .replace(/(https?:\/\/)([^/\s:@]+:[^/\s@]+)@/gi, "$1[REDACTED]@")
      // Authorization Bearer / Basic schemes
      .replace(/\b((?:Bearer|Basic)\s+)[A-Za-z0-9._~+/=-]{12,}/gi, "$1[REDACTED]")
      // Well-known API key, OAuth, PAT, Slack, and 3-part JWT formats
      .replace(
        /\b(?:AIza[0-9A-Za-z_-]{20,}|ya29\.[0-9A-Za-z_-]{20,}|sk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
        "[REDACTED]"
      )
      // Named credential assignments (e.g., API_KEY=..., GITHUB_TOKEN: "...", password=...)
      // Excludes purely numeric counters like outputTokens=500
      .replace(
        /\b([A-Za-z0-9_]*(?:API[_-]?KEY|SECRET|PASSWORD|PASSWD|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|CLIENT[_-]?SECRET|SESSION[_-]?ID|COOKIE|(?:AUTH|ACCESS|REFRESH|ID|SESSION|API|GITHUB|GH|NPM|HF|SLACK|BEARER|BOT|CLIENT)[_-]?TOKEN)\b|[Tt][Oo][Kk][Ee][Nn])\s*([=:])\s*(?![0-9]+\b)("[^"]*"|'[^']*'|[^\s"',;]+)/gi,
        "$1$2[REDACTED]"
      )
  );
}

export function sanitizePreviewText(input: string, maxChars?: number): string {
  if (!input) return "";
  const cleaned = redactSecrets(stripControlAndAnsi(input))
    .replace(/\s+/g, " ")
    .trim();
  if (maxChars !== undefined && maxChars > 3 && cleaned.length > maxChars) {
    return cleaned.slice(0, maxChars - 3) + "...";
  }
  return cleaned;
}
