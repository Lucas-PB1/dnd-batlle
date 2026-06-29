'use client';

import { useEffect, useState } from 'react';
import type { Arena } from '@/domain/entities';
import { sortArenas } from '@/lib/arena-utils';

export function useArenas(includeInactive = false) {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const url = includeInactive ? '/api/admin/arenas' : '/api/public/arenas';
      const response = await fetch(url);
      const data = await response.json();
      if (!active) return;
      setArenas(sortArenas((data.arenas ?? []) as Arena[]));
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [includeInactive]);

  const activeArenas = arenas.filter((arena) => arena.active);
  const maxDiceValue =
    activeArenas.length > 0 ? Math.max(...activeArenas.map((arena) => arena.diceValue)) : 6;

  return { arenas, activeArenas, maxDiceValue, loading };
}
