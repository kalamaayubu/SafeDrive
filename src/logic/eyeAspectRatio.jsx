export function calculateEAR(eyePoints) {
  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  const A = dist(eyePoints[1], eyePoints[5]);
  const B = dist(eyePoints[2], eyePoints[4]);
  const C = dist(eyePoints[0], eyePoints[3]);

  return (A + B) / (2.0 * C);
}
