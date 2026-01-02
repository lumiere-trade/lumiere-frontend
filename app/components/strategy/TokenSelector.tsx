/**
 * Token Selector Component - Jupiter Style
 * Advanced token selector with search, logos, and filtering
 */
'use client';

import { useState, useMemo } from 'react';
import { useChronicler } from '@/hooks';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@lumiere/shared/components/ui/button';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TokenSelectorProps {
  value?: string;
  onChange?: (tokenAddress: string, tokenSymbol: string) => void;
  className?: string;
}

export function TokenSelector({ value, onChange, className }: TokenSelectorProps) {
  const { tokens, isLoading, error } = useChronicler();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!search) return tokens;
    
    const searchLower = search.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase().includes(searchLower)
    );
  }, [tokens, search]);

  // Find selected token
  const selectedToken = tokens.find((t) => t.address === value);

  if (isLoading) {
    return (
      <Button variant="outline" className={cn('w-full justify-start', className)} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading tokens...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="outline" className={cn('w-full justify-start', className)} disabled>
        Error loading tokens
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedToken ? (
            <div className="flex items-center gap-2">
              <Image
                src={selectedToken.logo_uri}
                alt={selectedToken.symbol}
                width={24}
                height={24}
                className="rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="font-medium">{selectedToken.symbol}</span>
              <span className="text-xs text-muted-foreground">{selectedToken.name}</span>
            </div>
          ) : (
            'Select token...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, symbol, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          {/* Token List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onChange?.(token.address, token.symbol);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer",
                    value === token.address 
                      ? "bg-muted" 
                      : "hover:bg-muted"
                  )}
                >
                  <Image
                    src={token.logo_uri}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="rounded-full flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{token.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {token.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {token.address.slice(0, 8)}...{token.address.slice(-6)}
                    </span>
                  </div>
                  {value === token.address && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
