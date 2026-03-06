-- Platform Management Database Schema for Multi-Tenant Supabase
-- This schema manages multiple projects (tenants) each with their own schema

-- Create platform schema if not exists
CREATE SCHEMA IF NOT EXISTS platform;

-- Switch to platform schema
SET search_path TO platform, public;

-- Projects table: stores information about each tenant/project
CREATE TABLE IF NOT EXISTS platform.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    schema_name TEXT NOT NULL UNIQUE CHECK (schema_name ~ '^[a-z][a-z0-9_]*$'),
    api_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS projects_api_key_idx ON platform.projects(api_key);
CREATE INDEX IF NOT EXISTS projects_schema_name_idx ON platform.projects(schema_name);

-- Migrations table: tracks schema changes for each project
CREATE TABLE IF NOT EXISTS platform.migrations (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES platform.projects(id) ON DELETE CASCADE,
    schema_name TEXT NOT NULL,
    migration_sql TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    version TEXT, -- optional version identifier
    description TEXT -- optional description of the migration
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS migrations_project_id_idx ON platform.migrations(project_id);
CREATE INDEX IF NOT EXISTS migrations_schema_name_idx ON platform.migrations(schema_name);

-- Default tables that will be created in each project schema
-- These are templates that can be used when creating a new project
COMMENT ON TABLE platform.projects IS 'Stores information about all projects (tenants) in the multi-tenant system';
COMMENT ON TABLE platform.migrations IS 'Tracks schema migration history for each project';

-- Function to create a new project schema with default tables
CREATE OR REPLACE FUNCTION platform.create_project_schema(
    project_name TEXT,
    project_schema_name TEXT DEFAULT NULL,
    api_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project_id UUID;
    v_schema_name TEXT;
    v_api_key TEXT;
BEGIN
    -- Generate schema name if not provided
    IF project_schema_name IS NULL THEN
        v_schema_name := 'project_' || lower(regexp_replace(project_name, '[^a-zA-Z0-9]', '_', 'g'));
    ELSE
        v_schema_name := project_schema_name;
    END IF;
    
    -- Generate API key if not provided
    IF api_key IS NULL THEN
        v_api_key := gen_random_uuid()::TEXT;
    ELSE
        v_api_key := api_key;
    END IF;
    
    -- Insert project record
    INSERT INTO platform.projects (name, schema_name, api_key)
    VALUES (project_name, v_schema_name, v_api_key)
    RETURNING id INTO v_project_id;
    
    -- Create the schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema_name);
    
    -- Create default tables in the new schema
    -- Users table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )', v_schema_name);
    
    -- Settings table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.settings (
            key TEXT PRIMARY KEY,
            value JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )', v_schema_name);
    
    -- Logs table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.logs (
            id SERIAL PRIMARY KEY,
            action TEXT,
            data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )', v_schema_name);
    
    -- Record the initial migration
    INSERT INTO platform.migrations (project_id, schema_name, migration_sql, description)
    VALUES (
        v_project_id,
        v_schema_name,
        'Initial schema creation with default tables (users, settings, logs)',
        'Initial project setup'
    );
    
    RETURN v_project_id;
END;
$$;

-- Function to delete a project schema
CREATE OR REPLACE FUNCTION platform.delete_project_schema(
    project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schema_name TEXT;
BEGIN
    -- Get schema name
    SELECT schema_name INTO v_schema_name
    FROM platform.projects
    WHERE id = project_id;
    
    IF v_schema_name IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Drop the schema (cascade will drop all tables in the schema)
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', v_schema_name);
    
    -- Delete project record (cascade will delete migrations)
    DELETE FROM platform.projects WHERE id = project_id;
    
    RETURN TRUE;
END;
$$;

-- Function to execute migration SQL in a project schema
CREATE OR REPLACE FUNCTION platform.execute_migration(
    project_id UUID,
    migration_sql TEXT,
    description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schema_name TEXT;
    v_migration_id INTEGER;
BEGIN
    -- Get schema name
    SELECT schema_name INTO v_schema_name
    FROM platform.projects
    WHERE id = project_id;
    
    IF v_schema_name IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Execute the migration SQL
    -- Note: This is a simplified version. In production, you should validate the SQL
    -- and ensure it only operates on the target schema
    EXECUTE migration_sql;
    
    -- Record the migration
    INSERT INTO platform.migrations (project_id, schema_name, migration_sql, description)
    VALUES (project_id, v_schema_name, migration_sql, description)
    RETURNING id INTO v_migration_id;
    
    RETURN v_migration_id;
END;
$$;

-- Create a view to show project information with migration count
CREATE OR REPLACE VIEW platform.project_overview AS
SELECT 
    p.id,
    p.name,
    p.schema_name,
    p.api_key,
    p.created_at,
    p.updated_at,
    p.is_active,
    COUNT(m.id) as migration_count,
    MAX(m.executed_at) as last_migration_at
FROM platform.projects p
LEFT JOIN platform.migrations m ON p.id = m.project_id
GROUP BY p.id, p.name, p.schema_name, p.api_key, p.created_at, p.updated_at, p.is_active;

-- Grant permissions (adjust based on your security requirements)
-- Typically, you would create specific roles for the platform management
GRANT USAGE ON SCHEMA platform TO postgres, authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO postgres, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA platform TO postgres, authenticator;