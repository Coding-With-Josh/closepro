/**
 * Deterministic avatar URL for prospects (no DB field required).
 * Uses DiceBear avataaars with prospect id/name as seed for stable, unique images.
 */
export function getProspectAvatarUrl(prospectId: string, name?: string): string {
  const seed = name ? `${prospectId}-${name}` : prospectId;
  const encoded = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encoded}&size=128`;
}

/**
 * Resolve prospect avatar URL: use stored human portrait (e.g. NanoBanana) if present, else DiceBear.
 */
export function resolveProspectAvatarUrl(
  prospectId: string,
  name?: string,
  avatarUrl?: string | null
): string {
  if (avatarUrl && avatarUrl.trim()) return avatarUrl;
  return getProspectAvatarUrl(prospectId, name);
}
