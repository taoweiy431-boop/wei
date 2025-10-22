import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AuthPage(){
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(()=>{(async()=>{
    if (!isSupabaseConfigured || !supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) location.href = '/';
  })();},[]);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth:480, margin:'40px auto' }}>
          <div className="card-hd">环境未配置</div>
          <div className="card-bd">
            <p>缺少 Supabase 配置，请在项目根目录创建 <code>.env</code>：</p>
            <pre style={{ background:'#0e1628', padding:12, borderRadius:8 }}>{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY`}</pre>
            <p>保存后运行：<code>npm run build && npm run preview</code>。</p>
          </div>
        </div>
      </div>
    );
  }

  async function signin(){
    setError('');
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) setError(error.message); else location.href = '/';
  }

  async function signup(){
    setError('');
    const { error } = await supabase!.auth.signUp({ email, password, options: { data: { username } } });
    if (error) setError(error.message);
    else alert('注册成功，请检查邮箱验证后登录');
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth:480, margin:'40px auto' }}>
        <div className="card-hd">{mode==='signin'?'登录':'注册'}</div>
        <div className="card-bd">
          {mode==='signup' && (
            <div style={{ marginBottom:10 }}>
              <label className="label">昵称</label>
              <input className="input" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
          )}
          <div style={{ marginBottom:10 }}>
            <label className="label">邮箱</label>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom:10 }}>
            <label className="label">密码</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <div style={{ color:'#ef4444', marginBottom:10 }}>{error}</div>}
          {mode==='signin' ? (
            <button className="btn primary" onClick={signin}>登录</button>
          ) : (
            <button className="btn primary" onClick={signup}>注册</button>
          )}
          <div style={{ marginTop:10 }}>
            <button className="btn" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>
              切换到{mode==='signin'?'注册':'登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
