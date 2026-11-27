/**
 * Source for `next/image` from a Payload media URL. Payload builds absolute
 * URLs from `serverURL`; on the site's own origin they become local paths
 * (allowed by `images.localPatterns`), while external storage URLs (S3) are
 * kept and allowed by `images.remotePatterns`.
 */
export function imageSrc(url: string | null | undefined, serverUrl: string): string | null {
  if (!url) {
    return null
  }
  const origin = new URL(serverUrl).origin
  const parsed = new URL(url, origin)
  return parsed.origin === origin ? `${parsed.pathname}${parsed.search}` : url
}
