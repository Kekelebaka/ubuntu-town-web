'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Send, AtSign } from 'lucide-react';

interface Comment {
  id: string; work_id: string; author_id: string; body: string; mentions: string[];
  created_at: string; author_name?: string;
}
interface TownMember { id: string; display_name: string; user_id?: string; }

export function CommentThread({ workId }: { workId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<TownMember[]>([]);
  const [body, setBody] = useState('');
  const [showMention, setShowMention] = useState(false);

  useEffect(() => {
    load();
    const ch = supabase.channel('comments:' + workId)
      .on('postgres_changes', { event: 'INSERT', schema: 'uto', table: 'work_comments', filter: 'work_id=eq.' + workId }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [workId]);

  async function load() {
    const { data } = await supabase.from('work_comments').select('*').eq('work_id', workId).order('created_at', { ascending: true });
    if (data) setComments(data);
  }

  async function loadMembers() {
    if (members.length) return;
    const { data } = await supabase.from('coordinators').select('id, display_name');
    if (data) setMembers(data);
  }

  async function submit() {
    if (!body.trim()) return;
    const mentions: string[] = [];
    body.replace(/@([a-zA-Z0-9_-]+)/g, (_, name) => {
      const m = members.find(x => x.display_name.toLowerCase().includes(name.toLowerCase()));
      if (m) mentions.push(m.id);
      return '';
    });
    await supabase.from('work_comments').insert({ work_id: workId, body, mentions });
    setBody('');
    load();
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--background)33' }}>
      <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Discussion</div>
      {comments.map(c => (
        <div key={c.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--secondary)', fontSize: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{c.author_name || 'Coordinator'}</div>
          <div style={{ color: '#333', marginTop: 2 }}>{c.body}</div>
          <div style={{ color: '#999', fontSize: 10, marginTop: 4 }}>{new Date(c.created_at).toLocaleString('en-ZA')}</div>
        </div>
      ))}
      <div style={{ padding: '8px 14px', display: 'flex', gap: 8 }}>
        <button onClick={() => { setShowMention(!showMention); loadMembers(); }} style={{ background: 'var(--color-ubuntu-orange)22', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }} title="Mention someone">
          <AtSign size={14} color="var(--color-ubuntu-orange)" />
        </button>
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Comment… use @name to mention"
          style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}
        />
        <button onClick={submit} style={{ background: 'var(--color-ubuntu-orange)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
          <Send size={14} color="white" />
        </button>
      </div>
      {showMention && members.length > 0 && (
        <div style={{ padding: '6px 14px', background: 'var(--card)', borderTop: '1px solid var(--border)', maxHeight: 120, overflowY: 'auto' }}>
          {members.map(m => (
            <div key={m.id} onClick={() => { setBody(b => b + '@' + m.display_name + ' '); setShowMention(false); }} style={{ fontSize: 12, padding: '4px 8px', cursor: 'pointer', borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {m.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
