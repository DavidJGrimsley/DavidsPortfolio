import React from 'react';
import { InfoCard } from '~/src/components/PublicFacing/InfoCard';

export function WhatIsMCPCard() {
  return (
    <InfoCard
      icon="💡"
      title="What is MCP?"
      paragraphs={[
        "The Model Context Protocol (MCP) is an open standard that enables AI assistants (like Claude, ChatGPT, or GitHub Copilot) to securely connect to external data sources, tools, and services.",
        "These MCP servers expose structured development guides, architecture patterns, and best practices that AI tools can query to provide context-aware code assistance."
      ]}
    />
  );
}
