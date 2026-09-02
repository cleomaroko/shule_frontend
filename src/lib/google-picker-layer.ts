/** Marks the document while the Drive Picker iframe is on screen. */
export const GOOGLE_PICKER_OPEN_ATTR = 'data-google-picker-open'

const PICKER_NODE_SELECTOR = '.picker-dialog, .picker-dialog-bg, .picker'

export function isGooglePickerLayerOpen(): boolean {
  return document.documentElement.hasAttribute(GOOGLE_PICKER_OPEN_ATTR)
}

export function isGooglePickerNode(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest(PICKER_NODE_SELECTOR)) return true
  if (target instanceof HTMLIFrameElement && /google\.com\/picker|docs\.google\.com/.test(target.src)) return true
  return false
}

export function setGooglePickerLayerOpen(open: boolean): void {
  if (open) document.documentElement.setAttribute(GOOGLE_PICKER_OPEN_ATTR, '')
  else document.documentElement.removeAttribute(GOOGLE_PICKER_OPEN_ATTR)
}

/** Radix modal dialogs set `pointer-events: none` on `body`; the picker is a body child. */
export function elevateGooglePickerNodes(): void {
  document.querySelectorAll<HTMLElement>(PICKER_NODE_SELECTOR).forEach((node) => {
    node.style.pointerEvents = 'auto'
    node.style.zIndex = '2147483646'
  })
}

/** Keep elevating until Google injects the picker DOM, then stop. */
export function watchGooglePickerLayer(): () => void {
  setGooglePickerLayerOpen(true)
  elevateGooglePickerNodes()
  const interval = window.setInterval(elevateGooglePickerNodes, 50)
  const timeout = window.setTimeout(() => window.clearInterval(interval), 2000)
  return () => {
    window.clearInterval(interval)
    window.clearTimeout(timeout)
    setGooglePickerLayerOpen(false)
  }
}
