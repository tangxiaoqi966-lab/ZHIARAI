
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createProject, listProjects, deleteProject, getProject, generateSupabaseConfig, generateEnvVars, secureProjectSerialize } = require('./projectService');

const app = express();
const PORT = process.env.PORT || 3001;

// API Authentication Configuration
const API_AUTH_ENABLED = process.env.API_AUTH_ENABLED !== 'false'; // Enabled by default
const API_KEY = process.env.API_KEY || '';

// Configuration validation on startup
function validateConfig() {
  const errors = [];
  
  if (API_AUTH_ENABLED && !API_KEY) {
    errors.push('API_KEY environment variable is required when API authentication is enabled');
  }
  
  if (!process.env.PORT) {
    errors.push('PORT environment variable is not set');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('Please check your environment variables and restart the service.');
    process.exit(1);
  }
}

// Run validation
validateConfig();

// Authentication middleware
const authenticate = (req, res, next) => {
  // Skip authentication if disabled
  if (!API_AUTH_ENABLED) {
    return next();
  }
  
  // Check for API key in headers
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Authentication required', 
      message: 'API key is missing. Provide x-api-key header or Authorization header' 
    });
  }
  
  // Validate API key (strip 'Bearer ' prefix if present)
  const providedKey = apiKey.replace(/^Bearer\s+/i, '');
  
  if (!API_KEY) {
    console.error('API_KEY environment variable is not configured');
    return res.status(500).json({ 
      error: 'Server configuration error', 
      message: 'API authentication is not properly configured' 
    });
  }
  
  if (providedKey !== API_KEY) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Invalid API key' 
    });
  }
  
  next();
};

app.use(cors());
app.use(bodyParser.json());

// Apply authentication middleware to all API routes (except /health which is defined below)
app.use('/api', authenticate);

// 1. Create a new project
// POST /api/projects
// Body: { name: "My Project", userId: "user_123" }
app.post('/api/projects', async (req, res) => {
  try {
    const { name, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }
    const project = await createProject(name, userId);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// 2. List all projects
// GET /api/projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await listProjects();
    const safeProjects = projects.map(secureProjectSerialize);
    res.json(safeProjects);
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// 3. Get project details
// GET /api/projects/:id
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const safeProject = secureProjectSerialize(project);
    res.json(safeProject);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// 4. Delete a project
// DELETE /api/projects/:id
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 5. Get project Supabase config
// GET /api/projects/:id/config
app.get('/api/projects/:id/config', async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const config = generateSupabaseConfig(project);
    res.set('Content-Type', 'text/plain');
    res.send(config);
  } catch (error) {
    console.error('Get project config error:', error);
    res.status(500).json({ error: 'Failed to generate config' });
  }
});

// 6. Get project environment variables
// GET /api/projects/:id/env
app.get('/api/projects/:id/env', async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const envVars = generateEnvVars(project);
    res.set('Content-Type', 'text/plain');
    res.send(envVars);
  } catch (error) {
    console.error('Get project env error:', error);
    res.status(500).json({ error: 'Failed to generate environment variables' });
  }
});

// 7. Health check endpoint (no authentication required)
// GET /health
app.get('/health', async (req, res) => {
  try {
    // Simple health check - return service status
    res.json({
      status: 'healthy',
      service: 'platform-backend',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Service unavailable' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Platform API Backend running on http://localhost:${PORT}`);
  console.log(`API Authentication: ${API_AUTH_ENABLED ? 'ENABLED' : 'DISABLED'}`);
});
