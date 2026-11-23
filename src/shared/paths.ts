function safeDecodePercent(raw: string): string {
  return raw.replace(/%[0-9A-Fa-f]{2}/g, (seq) => {
    try {
      return decodeURIComponent(seq);
    } catch {
      return seq;
    }
  });
}

export function unwrapFileUri(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!/^file:\/\//i.test(trimmed)) return trimmed;

  let rest = trimmed.slice("file://".length);
  if (/^localhost\//i.test(rest)) {
    rest = rest.slice("localhost".length);
  }

  // Windows drive letter URI: file:///C:/Users/... or file://C:/Users/...
  if (/^\/[a-zA-Z]:[\\/]/.test(rest)) {
    return safeDecodePercent(rest.slice(1));
  }
  if (/^[a-zA-Z]:[\\/]/.test(rest)) {
    return safeDecodePercent(rest);
  }
  // Windows UNC URI: file://server/share/...
  if (!rest.startsWith("/") && rest.includes("/")) {
    return "\\\\" + safeDecodePercent(rest).replace(/\//g, "\\");
  }
  return safeDecodePercent(rest);
}

export function isWindowsPath(p: string): boolean {
  const s = (p || "").trim();
  return /^[a-zA-Z]:[\\/]/.test(s) || /^\\\\[^\\/]+[\\/][^\\/]+/.test(s);
}

export function isAbsoluteLocalPath(p: string): boolean {
  const s = (p || "").trim();
  return s.startsWith("/") || isWindowsPath(s);
}

function stripTrailingSeparators(p: string): string {
  if (!p) return "";
  if (p === "/") return "/";
  if (/^[a-zA-Z]:[\\/]$/.test(p)) return p;
  const uncRoot = p.match(/^(\\\\[^\\/]+\\[^\\/]+)[\\/]*$/);
  if (uncRoot) return uncRoot[1];
  return p.replace(/[\\/]+$/, "");
}

export function pathBaseName(p: string): string {
  const clean = stripTrailingSeparators((p || "").trim());
  if (!clean || clean === "/" || /^[a-zA-Z]:[\\/]?$/.test(clean)) return clean;
  const idx = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  return idx >= 0 ? clean.slice(idx + 1) : clean;
}

export function pathDirName(p: string): string {
  const clean = stripTrailingSeparators((p || "").trim());
  if (!clean) return "";
  if (clean === "/") return "/";
  if (/^[a-zA-Z]:[\\/]?$/.test(clean)) {
    const sep = clean.includes("\\") ? "\\" : "/";
    return `${clean.slice(0, 2)}${sep}`;
  }
  if (/^\\\\[^\\/]+\\[^\\/]+$/.test(clean)) {
    return clean;
  }
  const idx = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  if (idx < 0) return ".";
  if (idx === 0) return "/";
  const prefix = clean.slice(0, idx);
  if (/^[a-zA-Z]:$/.test(prefix)) {
    const sep = clean[idx];
    return `${prefix}${sep}`;
  }
  return prefix;
}

export function pathExtName(p: string): string {
  const base = pathBaseName(p);
  const dotIdx = base.lastIndexOf(".");
  if (dotIdx <= 0) return "";
  return base.slice(dotIdx);
}

export function pathJoin(dir: string, child: string): string {
  const sep = isWindowsPath(dir) && dir.includes("\\") ? "\\" : "/";
  const base = dir.replace(/[\\/]+$/, "");
  const next = child.replace(/^[\\/]+/, "");
  if (!base) return `${sep}${next}`;
  return `${base}${sep}${next}`;
}

export function pathTailSegments(p: string, count = 2): string {
  const clean = stripTrailingSeparators((p || "").trim());
  if (!clean) return "";
  const segs = clean.split(/[\\/]+/).filter(Boolean);
  return segs.slice(-count).join("/");
}

export function toFileUri(filePath: string): string {
  const unwrapped = unwrapFileUri(filePath);
  if (!unwrapped) return "file:///";

  // Windows UNC path: \\server\share\dir\file.ts -> file://server/share/dir/file.ts
  if (/^\\\\[^\\/]+[\\/][^\\/]+/.test(unwrapped)) {
    const segs = unwrapped
      .replace(/^\\\\+/, "")
      .split(/[\\/]+/)
      .filter(Boolean);
    const [host, ...rest] = segs;
    return `file://${host}/${rest.map((s) => encodeURIComponent(s)).join("/")}`;
  }

  // Windows drive path: C:\Users\Jane Doe\a.ts -> file:///C:/Users/Jane%20Doe/a.ts
  if (/^[a-zA-Z]:[\\/]/.test(unwrapped)) {
    const drive = unwrapped.slice(0, 2);
    const rest = unwrapped
      .slice(2)
      .split(/[\\/]+/)
      .filter(Boolean)
      .map((s) => encodeURIComponent(s))
      .join("/");
    return rest ? `file:///${drive}/${rest}` : `file:///${drive}/`;
  }

  // POSIX path: /Users/jane/My App/a.ts -> file:///Users/jane/My%20App/a.ts
  const norm = unwrapped.replace(/\\/g, "/");
  const encoded = norm
    .split("/")
    .map((seg, i) => (i === 0 && seg === "" ? "" : encodeURIComponent(seg)))
    .join("/");
  return encoded.startsWith("/") ? `file://${encoded}` : `file:///${encoded}`;
}
