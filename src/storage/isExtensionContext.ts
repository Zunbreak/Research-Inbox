export function isExtensionContext(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.storage?.local &&
    typeof chrome.runtime?.id === 'string'
  )
}
