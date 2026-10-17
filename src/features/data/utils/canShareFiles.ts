/** Web Share with files — on phones this sends the ZIP straight to another app or device. */
export function canShareFiles(): boolean {
  try {
    return (
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'x.zip', { type: 'application/zip' })] })
    );
  } catch {
    return false;
  }
}
