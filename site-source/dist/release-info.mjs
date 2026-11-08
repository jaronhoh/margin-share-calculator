const myt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function isPublicationTime(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match || match[0] !== value || !Number.isFinite(Date.parse(value))) return false;
  const wallTime = new Date(match[1] + 'Z');
  return Number.isFinite(wallTime.getTime()) && wallTime.toISOString().slice(0, 19) === match[1];
}

export function isReleaseInfo(info) {
  return Number.isSafeInteger(info?.version) && info.version > 0 && isPublicationTime(info.updatedAt);
}

export function formatReleaseInfo(info) {
  if (!isReleaseInfo(info)) return ['Version unavailable', 'Updated: unavailable'];
  const parts = Object.fromEntries(myt.formatToParts(new Date(info.updatedAt)).map(({ type, value }) => [type, value]));
  return [
    `Version ${info.version}`,
    `Updated: ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} (MYT)`,
  ];
}
