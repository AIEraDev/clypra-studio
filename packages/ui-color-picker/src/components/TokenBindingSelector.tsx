/**
 * Clypra Design Token & Theme Variable Selector Component
 * Enables binding clip/effect colors to semantic Clypra design tokens.
 */

import React from 'react';
import type { ColorToken } from '../types/color';

export interface TokenBindingSelectorProps {
  tokens?: ColorToken[];
  selectedTokenVariable?: string;
  onSelectToken: (token: ColorToken) => void;
  disabled?: boolean;
  className?: string;
}

export const DEFAULT_CLYPRA_TOKENS: ColorToken[] = [
  { id: 't1', name: 'Primary Accent', variable: '--clypra-color-accent-primary', value: '#8B5CF6', category: 'brand' },
  { id: 't2', name: 'Secondary Accent', variable: '--clypra-color-accent-secondary', value: '#6366F1', category: 'brand' },
  { id: 't3', name: 'Timeline Cursor', variable: '--clypra-color-timeline-playhead', value: '#EF4444', category: 'editor' },
  { id: 't4', name: 'Keyframe Diamond', variable: '--clypra-color-keyframe-active', value: '#F59E0B', category: 'editor' },
  { id: 't5', name: 'Audio Waveform', variable: '--clypra-color-audio-wave', value: '#10B981', category: 'editor' },
  { id: 't6', name: 'Text Subtitle', variable: '--clypra-color-subtitle-text', value: '#FFFFFF', category: 'captions' },
  { id: 't7', name: 'Subtitle Scrim', variable: '--clypra-color-subtitle-bg', value: 'rgba(0, 0, 0, 0.75)', category: 'captions' },
];

export const TokenBindingSelector: React.FC<TokenBindingSelectorProps> = ({
  tokens = DEFAULT_CLYPRA_TOKENS,
  selectedTokenVariable,
  onSelectToken,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 w-full text-zinc-300 ${className}`}>
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span>Semantic Theme Tokens</span>
        <span>{tokens.length} variables</span>
      </div>

      <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1">
        {tokens.map((token) => {
          const isActive = selectedTokenVariable === token.variable;
          return (
            <button
              key={token.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectToken(token)}
              className={`flex items-center justify-between p-2 rounded-md border text-left transition-colors cursor-pointer ${
                isActive
                  ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm'
                  : 'bg-zinc-900 border-white/5 text-zinc-300 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-4 h-4 rounded-md border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: token.value }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-zinc-200 truncate">{token.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 truncate">{token.variable}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">{token.category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
