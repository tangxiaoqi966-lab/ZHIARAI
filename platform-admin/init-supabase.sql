-- Supabase API 模拟版数据库初始化脚本
-- 创建 Supabase 相关 schema 和表，与现有平台架构完全独立

-- 1. 创建 supabase schema 用于存储跨项目元数据
CREATE SCHEMA IF NOT EXISTS supabase;

-- 设置搜索路径
SET search_path TO supabase, platform, public;

-- 2. Auth 模块表 (模拟 GoTrue 用户管理)
CREATE TABLE IF NOT EXISTS supabase.auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID,
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    invited_at TIMESTAMP WITH TIME ZONE,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMP WITH TIME ZONE,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    phone VARCHAR(50),
    phone_confirmed_at TIMESTAMP WITH TIME ZONE,
    phone_change VARCHAR(50),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (
        LEAST(email_confirmed_at, phone_confirmed_at)
    ) STORED,
    email_change_token_current VARCHAR(255) DEFAULT '',
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMP WITH TIME ZONE,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMP WITH TIME ZONE,
    is_sso_user BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_anonymous BOOLEAN DEFAULT false,
    
    -- 索引
    CONSTRAINT auth_users_email_unique UNIQUE(email),
    CONSTRAINT auth_users_phone_unique UNIQUE(phone)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS auth_users_instance_id_idx ON supabase.auth_users(instance_id);
CREATE INDEX IF NOT EXISTS auth_users_email_idx ON supabase.auth_users(email);
CREATE INDEX IF NOT EXISTS auth_users_created_at_idx ON supabase.auth_users(created_at);
CREATE INDEX IF NOT EXISTS auth_users_updated_at_idx ON supabase.auth_users(updated_at);

-- Auth sessions 表
CREATE TABLE IF NOT EXISTS supabase.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES supabase.auth_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    factor_id UUID,
    aal VARCHAR(2),
    not_after TIMESTAMP WITH TIME ZONE,
    refreshed_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip INET,
    tag VARCHAR(255)
);

-- Auth identities 表 (用于社交登录)
CREATE TABLE IF NOT EXISTS supabase.auth_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES supabase.auth_users(id) ON DELETE CASCADE,
    identity_data JSONB NOT NULL,
    provider VARCHAR(255) NOT NULL,
    last_sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    email VARCHAR(255),
    UNIQUE(provider, email)
);

-- 3. Storage 模块表 (模拟 Supabase Storage)
CREATE TABLE IF NOT EXISTS supabase.storage_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL UNIQUE,
    owner UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    public BOOLEAN DEFAULT false,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[],
    avif_autodetection BOOLEAN DEFAULT false,
    
    -- 索引
    CONSTRAINT storage_buckets_name_unique UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS supabase.storage_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id UUID NOT NULL REFERENCES supabase.storage_buckets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version VARCHAR(50),
    mime_type VARCHAR(255),
    size BIGINT,
    etag VARCHAR(255),
    
    -- 索引
    UNIQUE(bucket_id, name)
);

-- 4. RLS Policies 表 (行级安全策略)
CREATE TABLE IF NOT EXISTS supabase.rls_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    schema_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')),
    roles TEXT[] NOT NULL,
    using_expression TEXT,
    check_expression TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_enabled BOOLEAN DEFAULT true,
    
    -- 索引
    UNIQUE(schema_name, table_name, name)
);

-- 5. Edge Functions 表 (模拟 Deno Functions)
CREATE TABLE IF NOT EXISTS supabase.edge_functions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'FAILED', 'DEPLOYING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    runtime VARCHAR(50) DEFAULT 'deno',
    entrypoint_path VARCHAR(255) DEFAULT 'index.ts',
    import_map_path VARCHAR(255) DEFAULT 'import_map.json',
    verify_jwt BOOLEAN DEFAULT true,
    secrets JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    source_code TEXT,
    
    -- 索引
    UNIQUE(project_id, name)
);

-- 6. API Keys 扩展表 (存储 Supabase 风格的 API Keys)
CREATE TABLE IF NOT EXISTS supabase.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL UNIQUE,
    key_type VARCHAR(50) NOT NULL CHECK (key_type IN ('anon', 'service_role', 'supabase_key')),
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    
    -- 索引
    UNIQUE(project_id, name)
);

-- 7. 服务状态监控表
CREATE TABLE IF NOT EXISTS supabase.service_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('database', 'auth', 'storage', 'realtime', 'functions', 'edge_functions')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'stopped', 'degraded', 'error')),
    last_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- 索引
    UNIQUE(project_id, service_type)
);

-- 8. Automation 日志表 (记录 Trae 自动化操作)
CREATE TABLE IF NOT EXISTS supabase.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('project_create', 'sql_execute', 'migration_execute', 'apikey_create', 'storage_create', 'function_deploy')),
    action_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- 索引
    INDEX automation_logs_project_id_idx (project_id),
    INDEX automation_logs_action_type_idx (action_type),
    INDEX automation_logs_status_idx (status)
);

-- 9. Realtime 订阅表 (模拟 Websocket 订阅)
CREATE TABLE IF NOT EXISTS supabase.realtime_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    channel VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    subscription_id VARCHAR(255) NOT NULL UNIQUE,
    client_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- 索引
    UNIQUE(project_id, channel, topic)
);

-- 10. 跨项目审计日志表 (所有操作记录)
CREATE TABLE IF NOT EXISTS supabase.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES platform.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES supabase.auth_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- 索引
    INDEX audit_logs_project_id_idx (project_id),
    INDEX audit_logs_user_id_idx (user_id),
    INDEX audit_logs_action_idx (action),
    INDEX audit_logs_created_at_idx (created_at)
);

-- 11. 项目与 Supabase 元数据关联表
CREATE TABLE IF NOT EXISTS supabase.project_metadata (
    project_id UUID PRIMARY KEY REFERENCES platform.projects(id) ON DELETE CASCADE,
    supabase_project_ref VARCHAR(255) UNIQUE,
    supabase_url VARCHAR(255),
    region VARCHAR(50) DEFAULT 'ap-southeast-1',
    plan VARCHAR(50) DEFAULT 'free',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建视图：项目完整信息视图
CREATE OR REPLACE VIEW supabase.project_full_info AS
SELECT 
    p.id,
    p.name,
    p.schema_name,
    p.api_key,
    p.created_at,
    p.updated_at,
    p.is_active,
    pm.supabase_project_ref,
    pm.supabase_url,
    pm.region,
    pm.plan,
    pm.features,
    (SELECT COUNT(*) FROM supabase.auth_users au WHERE au.instance_id = p.id) as auth_user_count,
    (SELECT COUNT(*) FROM supabase.storage_buckets sb WHERE sb.project_id = p.id) as storage_bucket_count,
    (SELECT COUNT(*) FROM supabase.edge_functions ef WHERE ef.project_id = p.id) as edge_function_count,
    (SELECT COUNT(*) FROM supabase.api_keys ak WHERE ak.project_id = p.id) as api_key_count
FROM platform.projects p
LEFT JOIN supabase.project_metadata pm ON p.id = pm.project_id;

-- 创建函数：初始化新项目的 Supabase 元数据
CREATE OR REPLACE FUNCTION supabase.init_project_metadata(
    project_id UUID,
    supabase_project_ref VARCHAR DEFAULT NULL,
    supabase_url VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project_ref VARCHAR;
    v_project_url VARCHAR;
BEGIN
    -- 生成项目引用 ID
    IF supabase_project_ref IS NULL THEN
        v_project_ref := 'sb_' || replace(gen_random_uuid()::text, '-', '');
    ELSE
        v_project_ref := supabase_project_ref;
    END IF;
    
    -- 生成 Supabase URL
    IF supabase_url IS NULL THEN
        v_project_url := 'https://' || v_project_ref || '.supabase.co';
    ELSE
        v_project_url := supabase_url;
    END IF;
    
    -- 插入项目元数据
    INSERT INTO supabase.project_metadata (project_id, supabase_project_ref, supabase_url)
    VALUES (project_id, v_project_ref, v_project_url)
    ON CONFLICT (project_id) DO UPDATE
    SET supabase_project_ref = EXCLUDED.supabase_project_ref,
        supabase_url = EXCLUDED.supabase_url;
    
    -- 创建默认的 API Keys
    INSERT INTO supabase.api_keys (project_id, name, key, key_type, description)
    VALUES 
        (project_id, 'anon', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWRldiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjgwMDAwMDAwLCJleHAiOjE3MTE1MzYwMDB9.mock-anon-key', 'anon', '默认匿名访问密钥'),
        (project_id, 'service_role', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWRldiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTcxMTUzNjAwMH0.mock-service-role-key', 'service_role', '默认服务角色密钥');
    
    RETURN project_id;
END;
$$;

-- 创建函数：记录审计日志
CREATE OR REPLACE FUNCTION supabase.log_audit_event(
    p_project_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id VARCHAR DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO supabase.audit_logs (
        project_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_project_id,
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- 授予权限
GRANT USAGE ON SCHEMA supabase TO postgres, authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA supabase TO postgres, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA supabase TO postgres, authenticator;

-- 注释
COMMENT ON SCHEMA supabase IS 'Supabase API 模拟版数据库 schema，存储所有 Supabase 兼容功能的元数据';
COMMENT ON TABLE supabase.auth_users IS 'Supabase Auth 用户表，模拟 GoTrue 用户管理系统';
COMMENT ON TABLE supabase.storage_buckets IS 'Supabase Storage 存储桶表';
COMMENT ON TABLE supabase.rls_policies IS '行级安全策略表 (RLS Policies)';
COMMENT ON TABLE supabase.edge_functions IS 'Edge Functions (Deno) 函数表';
COMMENT ON TABLE supabase.api_keys IS 'Supabase 风格 API 密钥表';
COMMENT ON TABLE supabase.automation_logs IS 'Trae 自动化操作日志表';
COMMENT ON TABLE supabase.audit_logs IS '跨项目审计日志表，记录所有操作';