'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CreatableComboboxProps {
  items: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  onCreate?: (name: string) => string | Promise<string>; // returns the new ID
  placeholder?: string;
}

export function CreatableCombobox({
  items,
  value,
  onChange,
  onCreate,
  placeholder = 'Select an option...',
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedItem = items.find((item) => item.id === value);
  const isExactMatch = items.some((item) => item.name.toLowerCase() === search.toLowerCase());

  const handleCreate = async () => {
    if (onCreate && search && !isExactMatch) {
      const newId = await Promise.resolve(onCreate(search));
      onChange(newId);
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        role="combobox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 flex flex-col" align="start">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-sm text-slate-500">
              No results found.
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {onCreate && search && !isExactMatch && (
            <div className="p-1 border-t">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create &quot;{search}&quot;
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
