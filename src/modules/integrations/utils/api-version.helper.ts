export function resolveApiVersion(acceptHeader?: string, urlPath?: string): string {
  // 1. Resolve from URL path prefix, e.g. "/api/v2/reports" -> "v2"
  if (urlPath) {
    const urlMatch = urlPath.match(/\/api\/(v[0-9]+)\//);
    if (urlMatch) {
      return urlMatch[1];
    }
  }

  // 2. Resolve from Accept header, e.g. "application/vnd.grehasoft.v2+json" -> "v2"
  if (acceptHeader) {
    const headerMatch = acceptHeader.match(/vnd\.grehasoft\.(v[0-9]+)\+json/);
    if (headerMatch) {
      return headerMatch[1];
    }
  }

  // Default fallback version
  return 'v1';
}
export function getVersionStatus(version: string, activeVersions: string[], deprecatedVersions: string[]): 'ACTIVE' | 'DEPRECATED' | 'UNKNOWN' {
  if (activeVersions.includes(version)) {
    return 'ACTIVE';
  }
  if (deprecatedVersions.includes(version)) {
    return 'DEPRECATED';
  }
  return 'UNKNOWN';
}
