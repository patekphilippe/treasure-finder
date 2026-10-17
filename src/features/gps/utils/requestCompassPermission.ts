interface IosOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** iOS needs an explicit permission prompt from a user gesture; elsewhere it's a no-op. */
export async function requestCompassPermission(): Promise<boolean> {
  const ctor = (globalThis as { DeviceOrientationEvent?: IosOrientationEvent })
    .DeviceOrientationEvent;
  if (!ctor?.requestPermission) return true;
  try {
    return (await ctor.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}
