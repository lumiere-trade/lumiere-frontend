/**
 * Token Selector Component - Jupiter Style
 * Advanced token selector with search, logos, and filtering
 */
'use client';

import { useState, useMemo } from 'react';
import { useChronicler } from '@/hooks';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@lumiere/shared/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, symbol, or address..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No tokens found.</CommandEmpty>
            <CommandGroup>
              {filteredTokens.map((token) => (
                <CommandItem
                  key={token.address}
                  value={token.address}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue, token.symbol);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Image
                      src={token.logo_uri}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">{token.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {token.address.slice(0, 8)}...{token.address.slice(-6)}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === token.address ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
