import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Task } from '@/lib/types';
import dayjs from 'dayjs';

export default function MyTasks(){
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState('');

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-hd">我的任务</div>
          <div className="card-bd">
            <p>缺少 Supabase 配置，请在项目根目录创建 <code>.env</code> 并填入变量：</p>
            <pre style={{ background:'#0e1628', padding:12, borderRadius:8 }}>{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY`}</pre>
          </div>
        </div>
      </div>
    );
  }

  async function load(){
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`claimed_by.eq.${user?.id},assigned_to.eq.${user?.id}`)
      .order('updated_at', { ascending: false });
    if (error) console.error(error);
    setTasks(data||[]);
  }

  async function complete(id:string){
    setMessage('');
    const { data, error } = await supabase.rpc('complete_task', { p_task_id: id });
    if (error) { setMessage(error.message); return; }
    if (data?.status==='success') setMessage('任务已结算'); else setMessage(`结算失败：${data?.reason||'未知'}`);
    await load();
  }

  useEffect(()=>{ load();
    const ch = supabase.channel('realtime:mytasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-hd">我的任务</div>
        <div className="card-bd">
          {message && <div style={{ color:'#29b6f6', marginBottom:8 }}>{message}</div>}
          <table className="table">
            <thead><tr><th>任务</th><th>奖励</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
            <tbody>
              {tasks.map(t=> (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight:600 }}>{t.title}</div>
                    <div style={{ color:'#94a3b8' }}>{t.description}</div>
                  </td>
                  <td>{t.reward}</td>
                  <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                  <td>{dayjs(t.updated_at).format('MM-DD HH:mm')}</td>
                  <td>
                    {t.status!=='completed' && <button className="btn success" onClick={()=>complete(t.id)}>结算</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
