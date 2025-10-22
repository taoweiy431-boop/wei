import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Navbar(){
  const loc = useLocation();
  async function logout(){ if (isSupabaseConfigured && supabase) { await supabase.auth.signOut(); } location.href = '/'; }
  return (
    <div className="nav">
      <div className="nav-inner">
        <div className="brand">三角洲俱乐部</div>
        <Link className="link" to="/">首页</Link>
        <Link className="link" to="/hall">抢单大厅</Link>
        <Link className="link" to="/tasks">我的任务</Link>
        <Link className="link" to="/profile">个人中心</Link>
        <span style={{marginLeft:'auto'}}>
          {loc.pathname !== '/auth' && (
            <button className="btn" onClick={logout}>退出</button>
          )}
        </span>
      </div>
    </div>
  );
}
