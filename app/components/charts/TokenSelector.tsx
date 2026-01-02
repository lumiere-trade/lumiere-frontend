/**
 * Token Selector Component
 * Dropdown for selecting Solana tokens
 */

'use client';

import { useMemo } from 'react';
import { useChronicler } from '@/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle } from 'lucide-react';

interface TokenSelectorProps {
  value?: string;
  onChange?: (tokenAddress: string) => void;
  className?: string;
}

export function TokenSelector({
  value,
  onChange,
  className,
}: TokenSelectorProps) {
  const { tokens, isLoading, error } = useChronicler();

  // Sort tokens: verified first, then by symbol
  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const aVerified = a.tags.includes('verified');
      const bVerified = b.tags.includes('verified');
      if (aVerified !== bVerified) return aVerified ? -1 : 1;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [tokens]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tokens...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error loading tokens
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select token" />
      </SelectTrigger>
      <SelectContent>
        {sortedTokens.map((token) => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{token.symbol}</span>
              <span className="text-xs text-muted-foreground">
                {token.name}
              </span>
              {token.tags.includes('verified') && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
