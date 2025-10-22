import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthSimple } from '@/lib/auth';

export default function Home() {
  const { user, loading } = useAuthSimple();

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-hd">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-hd">欢迎来到三角洲俱乐部抢单系统</div>
        <div className="card-bd">
          {!user && (
            <div>
              <p style={{ color:'#94a3b8' }}>请先登录后访问抢单大厅与任务管理。</p>
              <Link to="/auth" className="btn primary">去登录</Link>
            </div>
          )}
          {user && (
            <div>
              <p style={{ color:'#64748b', marginBottom: '16px' }}>
                欢迎回来，{user.email}！
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link to="/hall" className="btn">进入抢单大厅</Link>
                <Link to="/tasks" className="btn">查看我的任务</Link>
                <Link to="/profile" className="btn">查看个人中心</Link>
                <Link to="/csr" className="btn">客服管理</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}