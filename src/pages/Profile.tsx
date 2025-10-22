import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export default function ProfilePage(){
  const [profile, setProfile] = useState<Profile|null>(null);

  useEffect(()=>{(async()=>{
    if (!isSupabaseConfigured || !supabase) return;
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data as any);
  })();},[]);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth:520, margin:'40px auto' }}>
          <div className="card-hd">个人中心</div>
          <div className="card-bd">
            <p>缺少 Supabase 配置，请在项目根目录创建 <code>.env</code> 并填入变量：</p>
            <pre style={{ background:'#0e1628', padding:12, borderRadius:8 }}>{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY`}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth:520, margin:'40px auto' }}>
        <div className="card-hd">个人中心</div>
        <div className="card-bd">
          {!profile && <div>加载中...</div>}
          {profile && (
            <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:12 }}>
              <div>用户ID</div><div>{profile.id}</div>
              <div>昵称</div><div>{profile.username}</div>
              <div>角色</div><div>{profile.role}</div>
              <div>信誉分</div><div>{Math.round(profile.reputation)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
