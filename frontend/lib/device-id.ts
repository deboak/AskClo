export function getDeviceId(): string {
  const screenSize = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  return [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || 0,
    screenSize,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
}
