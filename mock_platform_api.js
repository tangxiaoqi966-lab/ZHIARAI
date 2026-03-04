
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 模拟“平台后端”服务
class PlatformAPI {
  constructor() {
    this.projects = []; // 内存数据库，存储所有项目信息
  }

  // 生成一个安全的随机 JWT 密钥（每个项目独有）
  generateJwtSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 生成标准的 Anon Key（客户端使用，带 RLS 限制）
  generateAnonKey(jwtSecret, projectRef) {
    const payload = {
      role: 'anon', // 角色
      iss: 'supabase',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), // 10年有效期
      ref: projectRef // 额外信息，用于多租户路由
    };
    return jwt.sign(payload, jwtSecret);
  }

  // 生成 Service Role Key（服务端使用，超级管理员权限）
  generateServiceKey(jwtSecret, projectRef) {
    const payload = {
      role: 'service_role', // 角色
      iss: 'supabase',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10), // 10年有效期
      ref: projectRef // 额外信息，用于多租户路由
    };
    return jwt.sign(payload, jwtSecret);
  }

  // 核心功能：创建新项目
  async createProject(userId, projectName) {
    console.log(`\n[Platform] Creating project "${projectName}" for user ${userId}...`);

    // 1. 生成项目唯一标识符 (ref)
    const projectRef = crypto.randomBytes(10).toString('hex');

    // 2. 生成项目专属 JWT Secret
    const jwtSecret = this.generateJwtSecret();

    // 3. 生成 API 密钥
    const anonKey = this.generateAnonKey(jwtSecret, projectRef);
    const serviceKey = this.generateServiceKey(jwtSecret, projectRef);

    // 4. (模拟) 调用基础设施 API 启动服务
    // 在真实环境中，这里会调用 Kubernetes API 或 Docker API 来启动一组容器
    const dbConfig = await this.provisionInfrastructure(projectRef, jwtSecret);

    const project = {
      id: projectRef,
      name: projectName,
      owner: userId,
      status: 'ACTIVE_HEALTHY',
      api: {
        url: `https://${projectRef}.api.your-platform.com`, // 专属 API URL
        anon_key: anonKey,
        service_key: serviceKey,
        jwt_secret: jwtSecret // 注意：这通常不直接暴露给用户，只用于内部验证
      },
      database: dbConfig
    };

    this.projects.push(project);
    return project;
  }

  // (模拟) 调用基础设施 API
  async provisionInfrastructure(projectRef, jwtSecret) {
    console.log(`  > Provisioning Postgres database for ${projectRef}...`);
    console.log(`  > Starting PostgREST service with JWT_SECRET=${jwtSecret.substring(0, 5)}...`);
    console.log(`  > Configuring Kong Gateway route for ${projectRef}...`);
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      host: `db.${projectRef}.internal`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: crypto.randomBytes(16).toString('hex') // 生成随机数据库密码
    };
  }
}

// --- 演示使用 ---

(async () => {
  const platform = new PlatformAPI();

  // 1. 用户 A 创建项目
  const projectA = await platform.createProject('user_123', 'My First App');
  
  console.log('\n--- Project Created Successfully ---');
  console.log('Project ID:', projectA.id);
  console.log('API URL:   ', projectA.api.url);
  console.log('Anon Key:  ', projectA.api.anon_key);
  console.log('Service Key:', projectA.api.service_key);
  console.log('DB Password:', projectA.database.password);

  // 2. 用户 B 创建项目
  const projectB = await platform.createProject('user_456', 'E-commerce Backend');
  
  console.log('\n--- Project Created Successfully ---');
  console.log('Project ID:', projectB.id);
  console.log('API URL:   ', projectB.api.url);
  // 注意：Project B 的 Key 与 Project A 完全不同，且互不通用
})();
