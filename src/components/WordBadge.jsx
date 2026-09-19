import React from 'react';

// Shared part-of-speech badge.
// Renders nothing when the word has no pos.
export default function WordBadge({ pos }) {
  if (!pos) return null;
  return (
    <span className="pos-badge" title={`Part of speech: ${pos}`}>
      {pos}
    </span>
  );
}
