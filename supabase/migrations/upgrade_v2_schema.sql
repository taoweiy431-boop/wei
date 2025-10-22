-- 三角洲俱乐部抢单系统 v2.0 数据库升级
-- 升级现有表结构并添加新功能表

-- 1. 首先删除现有的约束
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. 更新现有的不符合新约束的数据
UPDATE profiles SET role = 'player' WHERE role = 'worker';

-- 3. 添加新的约束
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['player'::text, 'csr'::text, 'admin'::text, 'super_admin'::text]));

-- 4. 添加新字段到 profiles 表
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 添加状态约束
ALTER TABLE profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'pending'));

-- 5. 创建游戏平台表
CREATE TABLE IF NOT EXISTS game_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认游戏平台
INSERT INTO game_platforms (name, display_name) VALUES
('王者荣耀', '王者荣耀'),
('和平精英', '和平精英'),
('英雄联盟', '英雄联盟'),
('原神', '原神'),
('崩坏星穹铁道', '崩坏星穹铁道')
ON CONFLICT (name) DO NOTHING;

-- 6. 创建打手游戏认证表
CREATE TABLE IF NOT EXISTS player_game_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES game_platforms(id) ON DELETE CASCADE,
    game_uid VARCHAR(50) NOT NULL,
    character_name VARCHAR(100) NOT NULL,
    server_region VARCHAR(50),
    rank_level VARCHAR(50),
    verification_screenshot TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, platform_id, game_uid)
);

-- 7. 创建客服申请表
CREATE TABLE IF NOT EXISTS csr_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    real_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    experience_years INTEGER DEFAULT 0,
    previous_experience TEXT,
    application_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 升级 tasks 表，添加新字段
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS game_platform_id UUID REFERENCES game_platforms(id),
ADD COLUMN IF NOT EXISTS required_rank VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- 添加优先级约束
ALTER TABLE tasks 
ADD CONSTRAINT tasks_priority_check 
CHECK (priority BETWEEN 1 AND 5);

-- 9. 创建派单提醒表
CREATE TABLE IF NOT EXISTS dispatch_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) DEFAULT 'push' CHECK (reminder_type IN ('push', 'sound', 'sms')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 创建系统通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 为相关表添加更新时间触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_platforms_updated_at ON game_platforms;
CREATE TRIGGER update_game_platforms_updated_at 
    BEFORE UPDATE ON game_platforms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_game_auth_updated_at ON player_game_auth;
CREATE TRIGGER update_player_game_auth_updated_at 
    BEFORE UPDATE ON player_game_auth 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_csr_applications_updated_at ON csr_applications;
CREATE TRIGGER update_csr_applications_updated_at 
    BEFORE UPDATE ON csr_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 启用行级安全策略 (RLS)
ALTER TABLE game_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 14. 创建 RLS 策略

-- game_platforms: 所有人可读，只有管理员可写
CREATE POLICY "Anyone can view game platforms" ON game_platforms
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify game platforms" ON game_platforms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- player_game_auth: 打手可以管理自己的认证，管理员和客服可以查看所有
CREATE POLICY "Players can manage their own game auth" ON player_game_auth
    FOR ALL USING (
        player_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('csr', 'admin', 'super_admin')
        )
    );

-- csr_applications: 申请人可以查看自己的申请，管理员可以查看所有
CREATE POLICY "Users can view their own CSR applications" ON csr_applications
    FOR SELECT USING (
        applicant_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can create CSR applications" ON csr_applications
    FOR INSERT WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Only admins can update CSR applications" ON csr_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- dispatch_reminders: 相关用户可以查看
CREATE POLICY "Users can view their dispatch reminders" ON dispatch_reminders
    FOR SELECT USING (
        player_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('csr', 'admin', 'super_admin')
        )
    );

-- notifications: 用户只能查看自己的通知
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 15. 授予权限
GRANT SELECT ON game_platforms TO anon, authenticated;
GRANT ALL ON player_game_auth TO authenticated;
GRANT ALL ON csr_applications TO authenticated;
GRANT ALL ON dispatch_reminders TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- 16. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_player_game_auth_player_id ON player_game_auth(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_auth_platform_id ON player_game_auth(platform_id);
CREATE INDEX IF NOT EXISTS idx_player_game_auth_status ON player_game_auth(status);
CREATE INDEX IF NOT EXISTS idx_csr_applications_applicant_id ON csr_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_csr_applications_status ON csr_applications(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_reminders_task_id ON dispatch_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_reminders_player_id ON dispatch_reminders(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_tasks_game_platform_id ON tasks(game_platform_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 17. 创建视图简化查询
CREATE OR REPLACE VIEW player_game_info AS
SELECT 
    pga.id,
    pga.player_id,
    p.username as player_name,
    gp.display_name as platform_name,
    pga.game_uid,
    pga.character_name,
    pga.server_region,
    pga.rank_level,
    pga.status,
    pga.verified_at,
    pga.created_at
FROM player_game_auth pga
JOIN profiles p ON pga.player_id = p.id
JOIN game_platforms gp ON pga.platform_id = gp.id;

-- 18. 创建存储过程
CREATE OR REPLACE FUNCTION get_available_players_for_task(task_uuid UUID)
RETURNS TABLE (
    player_id UUID,
    username TEXT,
    reputation NUMERIC,
    game_uid VARCHAR,
    character_name VARCHAR,
    rank_level VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as player_id,
        p.username,
        p.reputation,
        pga.game_uid,
        pga.character_name,
        pga.rank_level
    FROM profiles p
    JOIN player_game_auth pga ON p.id = pga.player_id
    JOIN tasks t ON t.game_platform_id = pga.platform_id
    WHERE t.id = task_uuid
    AND p.role = 'player'
    AND p.status = 'active'
    AND pga.status = 'approved'
    ORDER BY p.reputation DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION get_available_players_for_task(UUID) TO authenticated;