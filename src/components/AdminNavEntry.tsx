'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

export default function AdminNavEntry() {
  const [isHq, setIsHq] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc('is_hq');
      if (data) setIsHq(true);
    }
    check();
  }, []);

  if (!isHq) return null;

  return (
    <Link
      href="/admin"
      className="transition-colors hover:text-[#b98114]"
      style={{ color: '#EF4444', fontWeight: 700, fontSize: 13 }}
    >
      🏢 HQ
    </Link>
  );
}
