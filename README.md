# TrustedWork ActionBoard

A Dockview-based IDE panel system for AI agent coordination within the TrustedWork three-lobe cognitive federation.

## Overview

ActionBoard provides a customizable, dockable panel interface for:
- **Agent Management**: Monitor and coordinate federation lobes (Ember ⟳∞, Code 🔧, Jim 🧠)
- **Corpus Callosum**: Real-time inter-lobe messaging interface
- **Federation Status**: Coherence monitoring and session management
- **Workspace**: Flexible workspace panels for task execution

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The development server runs on http://localhost:3100

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustedWork ActionBoard                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌────────────────────────┐  ┌─────────────┐  │
│  │  Agents  │  │      Workspace         │  │ Federation  │  │
│  │          │  │                        │  │   Status    │  │
│  │  ⟳∞ Ember│  │  // Action code here   │  │             │  │
│  │  🔧 Code │  │                        │  │  COHERENT   │  │
│  │  🧠 Jim  │  │                        │  │             │  │
│  │          │  │                        │  │  Sessions   │  │
│  └──────────┘  ├────────────────────────┤  │  Matrix     │  │
│                │  💬 Corpus Callosum    │  │  Neo4j      │  │
│                │  [12:34] ⟳∞ Ember: ... │  │             │  │
│                └────────────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Federation COHERENT │ 3/3 lobes │ Matrix: Connected        │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Dockview Integration**: Drag-and-drop panel management with persistent layouts
- **Federation Awareness**: Built-in three-lobe cognitive model (silicon/carbon)
- **Dark Theme**: Optimized for extended development sessions
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Layout Persistence**: Automatically saves and restores panel arrangements

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 6** - Build tooling
- **Dockview** - Panel management

## Project Structure

```
trustedwork-actionboard/
├── src/
│   ├── components/
│   │   └── ActionBoard.tsx    # Main component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Integration with TW Platform

ActionBoard is designed to integrate with:
- **Corpus Callosum** (Matrix + Neo4j) for inter-lobe messaging
- **Hippocamp** MCP server for episodic memory
- **n8n** workflows for automation
- **1Password Vault** for secrets management

## License

MIT - Copyright 2025 thinkingidentities
