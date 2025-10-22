import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Task } from '@/lib/types';
import dayjs from 'dayjs';

export default function Hall(){
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-hd">抢单大厅</div>
          <div className="card-bd">
            <p>缺少 Supabase 配置，请在项目根目录创建 <code>.env</code> 并填入变量：</p>
            <pre style={{ background:'#0e1628', padding:12, borderRadius:8 }}>{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY`}</pre>
          </div>
        </div>
      </div>
    );
  }

  async function load(){
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status','open')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setTasks(data||[]);
    setLoading(false);
  }

  async function claim(id:string){
    setMessage('');
    const { data, error } = await supabase.rpc('claim_task', { p_task_id: id });
    if (error) { setMessage(error.message); return; }
    if (data?.status === 'success') setMessage('抢单成功'); else setMessage(`抢单失败：${data?.reason||'不可用'}`);
    await load();
  }

  useEffect(()=>{ load();
    const channel = supabase.channel('realtime:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[]);

  function statusBadge(s:string){ return <span className={`badge ${s}`}>{s}</span>; }

  return (
    <div className="container">
      <div className="card">
        <div className="card-hd">抢单大厅</div>
        <div className="card-bd">
          {message && <div style={{ color:'#29b6f6', marginBottom:8 }}>{message}</div>}
          {loading && <div>加载中...</div>}
          {!loading && (
            <table className="table">
              <thead>
                <tr>
                  <th>任务</th><th>报酬</th><th>截止</th><th>状态</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t=> (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{t.title}</div>
                      <div style={{ color:'#94a3b8' }}>{t.description}</div>
                    </td>
                    <td>{t.reward}</td>
                    <td>{t.expires_at ? dayjs(t.expires_at).format('MM-DD HH:mm') : '-'}</td>
                    <td>{statusBadge(t.status)}</td>
                    <td><button className="btn success" onClick={()=>claim(t.id)}>抢单</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
