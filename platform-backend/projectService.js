
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// In-memory project store (replace with a real database like Postgres)
const projects = [];

// Port allocation: start from 5433 to avoid conflict with default Postgres (5432)
let nextDbPort = 5433;
// Port allocation for project services (each project gets a range)
let nextProjectBasePort = 10000;

// Data directory base path (mounted from host)
const DATA_BASE_PATH = '/data';

// Helper functions
function generateJwtSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function generateAnonKey(jwtSecret, projectRef) {
  const payload = {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), // 10 years
    ref: projectRef
  };
  return jwt.sign(payload, jwtSecret);
}

function generateServiceKey(jwtSecret, projectRef) {
  const payload = {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), // 10 years
    ref: projectRef
  };
  return jwt.sign(payload, jwtSecret);
}

// Generate publishable key (same as anon key for compatibility)
function generatePublishableKey(jwtSecret, projectRef) {
  const payload = {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), // 10 years
    ref: projectRef
  };
  return jwt.sign(payload, jwtSecret);
}

async function createProject(name, userId) {
  console.log(`[ProjectService] Creating project "${name}" for user ${userId}...`);

  // 1. Generate unique project reference
  const projectRef = crypto.randomBytes(10).toString('hex');

  // 2. Generate secrets
  const jwtSecret = generateJwtSecret();
  const anonKey = generateAnonKey(jwtSecret, projectRef);
  const serviceKey = generateServiceKey(jwtSecret, projectRef);
  const publishableKey = generatePublishableKey(jwtSecret, projectRef);
  const dbPassword = crypto.randomBytes(16).toString('hex');

  // 3. Provision Infrastructure (Docker Containers)
  const infrastructure = await provisionInfrastructure(projectRef, jwtSecret, dbPassword);

  const project = {
    id: projectRef,
    name,
    owner: userId,
    status: 'ACTIVE_HEALTHY',
    created_at: new Date().toISOString(),
    api: {
      url: `http://localhost:${infrastructure.kongPort}`, // Kong API Gateway URL
      anon_key: anonKey,
      service_key: serviceKey,
      publishable_key: publishableKey,
      jwt_secret: jwtSecret // Keep this secret - internal only
    },
    database: {
      host: 'localhost',
      port: infrastructure.dbHostPort, // External host port for direct connection
      internal_port: 5432, // Internal container port
      user: 'postgres',
      password: dbPassword
    },
    services: {
      kong: {
        port: infrastructure.kongPort,
        url: `http://localhost:${infrastructure.kongPort}`
      },
      auth: {
        port: infrastructure.authPort,
        url: `http://localhost:${infrastructure.authPort}`
      },
      rest: {
        port: infrastructure.restPort,
        url: `http://localhost:${infrastructure.restPort}`
      },
      realtime: {
        port: infrastructure.realtimePort,
        url: `http://localhost:${infrastructure.realtimePort}`
      },
      storage: {
        port: infrastructure.storagePort,
        url: `http://localhost:${infrastructure.storagePort}`
      }
    },
    infrastructure: {
      dbHostPort: infrastructure.dbHostPort,
      kongPort: infrastructure.kongPort,
      authPort: infrastructure.authPort,
      restPort: infrastructure.restPort,
      realtimePort: infrastructure.realtimePort,
      storagePort: infrastructure.storagePort,
      volumeName: infrastructure.volumeName,
      projectBasePort: infrastructure.projectBasePort
    }
  };

  projects.push(project);
  return project;
}

async function provisionInfrastructure(projectRef, jwtSecret, dbPassword) {
  console.log(`  > Provisioning resources for ${projectRef}...`);

  // 1. Allocate ports for project
  const dbHostPort = nextDbPort;
  nextDbPort++;
  
  const projectBasePort = nextProjectBasePort;
  nextProjectBasePort += 100; // Reserve 100 ports for each project
  
  const kongPort = projectBasePort;          // Kong API Gateway
  const authPort = projectBasePort + 1;      // Auth service
  const restPort = projectBasePort + 2;      // REST API
  const realtimePort = projectBasePort + 3;  // Realtime
  const storagePort = projectBasePort + 4;   // Storage
  
  console.log(`  > Allocated ports: DB=${dbHostPort}, Kong=${kongPort}, Auth=${authPort}, REST=${restPort}, Realtime=${realtimePort}, Storage=${storagePort}`);

  // 2. Create Docker volume for persistent storage
  const volumeName = `supabase-db-volume-${projectRef}`;
  try {
    const volume = await docker.createVolume({ Name: volumeName });
    console.log(`  > Created Docker volume: ${volumeName}`);
  } catch (e) {
    console.log(`  > Volume ${volumeName} may already exist:`, e.message);
  }

  // 3. Start Postgres Container with persistent volume
  const dbContainer = await docker.createContainer({
    Image: 'postgres:15',
    name: `supabase-db-${projectRef}`,
    Env: [
      `POSTGRES_PASSWORD=${dbPassword}`,
      `POSTGRES_DB=postgres`
    ],
    HostConfig: {
      PortBindings: {
        '5432/tcp': [{ HostPort: String(dbHostPort) }]
      },
      Mounts: [
        {
          Type: 'volume',
          Source: volumeName,
          Target: '/var/lib/postgresql/data'
        }
      ]
    }
  });
  await dbContainer.start();
  console.log(`  > Database started for ${projectRef} (host port: ${dbHostPort})`);

  // 4. Create temporary project object for Kong config generation
  const tempProjectForConfig = {
    api: {
      anon_key: jwt.sign({ role: 'anon', iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), ref: projectRef }, jwtSecret),
      service_key: jwt.sign({ role: 'service_role', iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), ref: projectRef }, jwtSecret)
    },
    services: {
      kong: { port: kongPort, url: `http://localhost:${kongPort}` },
      auth: { port: authPort, url: `http://localhost:${authPort}` },
      rest: { port: restPort, url: `http://localhost:${restPort}` },
      realtime: { port: realtimePort, url: `http://localhost:${realtimePort}` },
      storage: { port: storagePort, url: `http://localhost:${storagePort}` }
    }
  };
  
  // Generate Kong configuration
  const kongConfig = generateKongConfig(tempProjectForConfig);
  
  // Base64 encode config to avoid newline issues in environment variable
  const kongConfigBase64 = Buffer.from(kongConfig).toString('base64');
  console.log(`  > Generated Kong config (base64 encoded)`);

  // 5. Create Kong API Gateway container with config as environment variable
  const kongContainer = await docker.createContainer({
    Image: 'kong:2.8.1',
    name: `supabase-kong-${projectRef}`,
    Env: [
      'KONG_DATABASE=off',
      'KONG_DECLARATIVE_CONFIG=/tmp/kong.yml',
      'KONG_DNS_ORDER=LAST,A,CNAME',
      'KONG_PLUGINS=request-transformer,cors,key-auth,acl',
      'KONG_PROXY_ACCESS_LOG=/dev/stdout',
      'KONG_ADMIN_ACCESS_LOG=/dev/stdout',
      'KONG_PROXY_ERROR_LOG=/dev/stderr',
      'KONG_ADMIN_ERROR_LOG=/dev/stderr',
      `KONG_CONFIG_BASE64=${kongConfigBase64}`
    ],
    Cmd: ['sh', '-c', 'echo "$KONG_CONFIG_BASE64" | base64 -d > /tmp/kong.yml && /docker-entrypoint.sh kong docker-start'],
    HostConfig: {
      PortBindings: {
        '8000/tcp': [{ HostPort: String(kongPort) }],
        '8443/tcp': [{ HostPort: String(kongPort + 100) }] // HTTPS port
      }
    }
  });
  await kongContainer.start();
  console.log(`  > Kong API Gateway started (port: ${kongPort})`);

  // 5. Wait for services to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  return {
    dbHostPort,
    kongPort,
    authPort,
    restPort,
    realtimePort,
    storagePort,
    volumeName,
    projectBasePort
  };
}

async function listProjects() {
  return projects;
}

async function getProject(id) {
  return projects.find(p => p.id === id);
}

async function deleteProject(id) {
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    // Stop and remove containers
    const projectRef = projects[index].id;
    const containerNames = [
      `supabase-db-${projectRef}`,
      `supabase-kong-${projectRef}`
    ];
    
    for (const containerName of containerNames) {
      try {
        const container = docker.getContainer(containerName);
        await container.stop();
        await container.remove();
        console.log(`Stopped and removed container ${containerName}`);
      } catch (e) {
        console.error(`Error removing container ${containerName}:`, e.message);
      }
    }
    
    // Remove Docker volume
    const volumeName = `supabase-db-volume-${projectRef}`;
    try {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      console.log(`Removed Docker volume ${volumeName}`);
    } catch (e) {
      console.error(`Error removing volume ${volumeName}:`, e.message);
    }
    
    // Clean up temporary files
    try {
      const kongConfigDir = path.join('/data', 'kong-configs', projectRef);
      await fs.promises.rm(kongConfigDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary config directory: ${kongConfigDir}`);
    } catch (e) {
      // Ignore errors if directory doesn't exist
      if (e.code !== 'ENOENT') {
        console.error(`Error removing kong config directory:`, e.message);
      }
    }
    
    try {
      const projectDataDir = path.join('/data', projectRef);
      await fs.promises.rm(projectDataDir, { recursive: true, force: true });
      console.log(`Cleaned up project data directory: ${projectDataDir}`);
    } catch (e) {
      // Ignore errors if directory doesn't exist
      if (e.code !== 'ENOENT') {
        console.error(`Error removing project data directory:`, e.message);
      }
    }
    
    projects.splice(index, 1);
  }
}

// Generate Supabase config.toml for a project
function generateSupabaseConfig(project) {
  const { id, name, api, database, services } = project;
  
  return `# Supabase Configuration for ${name}
project_id = "${id}"

[api]
port = ${services.kong.port}
schemas = ["public", "storage"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
host = "${database.host}"
port = ${database.port}
database = "postgres"
username = "${database.user}"
password = "${database.password}"
major_version = 15

[auth]
site_url = "${services.kong.url}"
additional_redirect_urls = [
  "${services.kong.url}/auth/v1/callback"
]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[storage]
file_size_limit = "50MiB"

# API Keys
[api.keys]
anon_key = "${api.anon_key}"
service_key = "${api.service_key}"
jwt_secret = "${api.jwt_secret}"

# Services
[services]
kong_port = ${services.kong.port}
auth_port = ${services.auth.port}
rest_port = ${services.rest.port}
realtime_port = ${services.realtime.port}
storage_port = ${services.storage.port}
`;
}

// Generate Kong configuration for API Gateway
function generateKongConfig(project) {
  const { api, services } = project;
  
  return `_format_version: "2.1"
_transform: true

services:
  # Auth service
  - name: auth
    url: http://host.docker.internal:${services.auth.port}
    routes:
      - name: auth-routes
        paths:
          - /auth/v1/
          - /auth/v1
        strip_path: true
    plugins:
      - name: cors
        config:
          origins: ["*"]
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
          headers: ["*"]
          credentials: true
      - name: request-transformer
        config:
          add:
            headers:
              - "x-anon-key: ${api.anon_key}"
              - "x-service-key: ${api.service_key}"

  # REST API service
  - name: rest
    url: http://host.docker.internal:${services.rest.port}
    routes:
      - name: rest-routes
        paths:
          - /rest/v1/
          - /rest/v1
        strip_path: true
    plugins:
      - name: cors
        config:
          origins: ["*"]
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
          headers: ["*"]
          credentials: true

  # Realtime service
  - name: realtime
    url: http://host.docker.internal:${services.realtime.port}
    routes:
      - name: realtime-routes
        paths:
          - /realtime/v1/
          - /realtime/v1
        strip_path: true
    plugins:
      - name: cors
        config:
          origins: ["*"]
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
          headers: ["*"]
          credentials: true

  # Storage service
  - name: storage
    url: http://host.docker.internal:${services.storage.port}
    routes:
      - name: storage-routes
        paths:
          - /storage/v1/
          - /storage/v1
        strip_path: true
    plugins:
      - name: cors
        config:
          origins: ["*"]
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
          headers: ["*"]
          credentials: true

  # Database REST API (PostgREST)
  - name: postgrest
    url: http://host.docker.internal:${services.rest.port}
    routes:
      - name: postgrest-routes
        paths:
          - /
        strip_path: false
    plugins:
      - name: cors
        config:
          origins: ["*"]
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
          headers: ["*"]
          credentials: true
`;
}

// Generate environment variables for the project
function generateEnvVars(project) {
  const { api, database, services } = project;
  
  return `# Supabase Environment Variables
SUPABASE_URL=${services.kong.url}
SUPABASE_ANON_KEY=${api.anon_key}
SUPABASE_SERVICE_ROLE_KEY=${api.service_key}
SUPABASE_JWT_SECRET=${api.jwt_secret}

# Database
DATABASE_URL=postgresql://${database.user}:${database.password}@${database.host}:${database.port}/postgres
POSTGRES_PASSWORD=${database.password}

# Service URLs
AUTH_URL=${services.auth.url}
REST_URL=${services.rest.url}
REALTIME_URL=${services.realtime.url}
STORAGE_URL=${services.storage.url}
`;
}

// Secure project serialization - remove sensitive information
function secureProjectSerialize(project) {
  if (!project) return null;
  
  const safeProject = { ...project };
  
  // Remove JWT secret from API response
  if (safeProject.api && safeProject.api.jwt_secret) {
    delete safeProject.api.jwt_secret;
  }
  
  // Optionally mask database password
  if (safeProject.database && safeProject.database.password) {
    safeProject.database.password = '••••••••';
  }
  
  return safeProject;
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  deleteProject,
  generateSupabaseConfig,
  generateKongConfig,
  generateEnvVars,
  secureProjectSerialize
};
