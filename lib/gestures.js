export function horizontalSwipe({ startX, startY, endX, endY, threshold = 55 }) {
  const deltaX = Number(endX) - Number(startX);
  const deltaY = Number(endY) - Number(startY);
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return null;
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return null;
  return deltaX > 0 ? "right" : "left";
}
