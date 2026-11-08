// Update these values from the confirmed existing Site release immediately
// before packaging each subsequent deployment.
export const SITE_RELEASE_VERSION = 68;
export const SITE_RELEASE_UPDATED_AT = '2026-11-08T16:50:00+08:00';

const timeZone = 'Asia/Kuala_Lumpur';

export function formatReleaseInfo(version = SITE_RELEASE_VERSION, updatedAt = SITE_RELEASE_UPDATED_AT) {
  const timestamp = typeof updatedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(updatedAt);
  const date = timestamp ? updatedAt.slice(0, 10) : '';
  if (!Number.isSafeInteger(version) || version <= 0 || !timestamp ||
      !Number.isFinite(Date.parse(updatedAt)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    return ['Version unavailable', 'Updated: unavailable'];
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(updatedAt)).map(({ type, value }) => [type, value]));
  return [
    `Version ${version}`,
    `Updated: ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} (MYT)`,
  ];
}
