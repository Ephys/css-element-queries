
export const domStyleSheets = new WeakSet();

export function isDeadStyleSheet(styleSheet) {
  return !styleSheet.ownerNode && domStyleSheets.has(styleSheet);
}
