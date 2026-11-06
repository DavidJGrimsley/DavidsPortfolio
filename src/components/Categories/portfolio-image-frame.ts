// Match the reference screenshot while allowing the frame to shrink on phones.
// Images use contain mode so portrait and landscape sources keep their proportions.
export const portfolioImageFrame = {
  width: '100%',
  maxWidth: 600,
  aspectRatio: 12 / 7,
  alignSelf: 'center',
  flexShrink: 0,
} as const;
