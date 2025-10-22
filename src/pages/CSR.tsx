import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export default function CSR(){
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reward, setReward] = useState(100);
  const [expires, setExpires] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-hd">客服任务管理</div>
          <div className="card-bd">
            <p>缺少 Supabase 配置，请在项目根目录创建 <code>.env</code> 并填入变量：</p>
            <pre style={{ background:'#0e1628', padding:12, borderRadius:8 }}>{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY`}</pre>
          </div>
        </div>
      </div>
    );
  }

  async function create(){
    await supabase.from('tasks').insert({ title, description: desc, reward, expires_at: expires || null, status:'open' });
    setTitle(''); setDesc(''); setReward(100); setExpires('');
    await load();
  }

  async function load(){
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending:false });
    setTasks(data||[]);
  }

  useEffect(()=>{ load(); },[]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-hd">客服任务管理</div>
        <div className="card-bd">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ marginBottom:8 }}>
                <label className="label">标题</label>
                <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div style={{ marginBottom:8 }}>
                <label className="label">描述</label>
                <textarea className="input" value={desc} onChange={e=>setDesc(e.target.value)} />
              </div>
              <div style={{ marginBottom:8 }}>
                <label className="label">奖励</label>
                <input className="input" type="number" value={reward} onChange={e=>setReward(Number(e.target.value))} />
              </div>
              <div style={{ marginBottom:8 }}>
                <label className="label">截止时间</label>
                <input className="input" type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)} />
              </div>
              <button className="btn primary" onClick={create}>创建任务</button>
            </div>
            <div>
              <table className="table">
                <thead><tr><th>任务</th><th>奖励</th><th>状态</th></tr></thead>
                <tbody>
                  {tasks.map(t=> (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{t.reward}</td>
                      <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
