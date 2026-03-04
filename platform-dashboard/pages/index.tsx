
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, Trash2, Database, Key, Server, Download, Globe, Shield, Radio, HardDrive } from 'lucide-react';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// Helper function to get API headers
const getApiHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }
  
  return headers;
};

interface Project {
  id: string;
  name: string;
  owner: string;
  status: string;
  created_at: string;
  api: {
    url: string;
    anon_key: string;
    service_key: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
  };
  services?: {
    kong: {
      port: number;
      url: string;
    };
    auth: {
      port: number;
      url: string;
    };
    rest: {
      port: number;
      url: string;
    };
    realtime: {
      port: number;
      url: string;
    };
    storage: {
      port: number;
      url: string;
    };
  };
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: getApiHeaders(),
      });
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Create project
  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProjectName) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ name: newProjectName, userId: 'current_user' }),
      });
      
      if (res.ok) {
        setNewProjectName('');
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await fetch(`${API_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Download Supabase config
  const downloadConfig = async (projectId: string, projectName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/config`, {
        headers: getApiHeaders(),
      });
      const configText = await res.text();
      const blob = new Blob([configText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-supabase-config.toml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download config:', error);
      alert('Failed to download config');
    }
  };

  // Download environment variables
  const downloadEnv = async (projectId: string, projectName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/env`, {
        headers: getApiHeaders(),
      });
      const envText = await res.text();
      const blob = new Blob([envText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-supabase.env`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download env:', error);
      alert('Failed to download environment variables');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>Platform Dashboard</title>
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Projects
            </h2>
          </div>
        </div>

        {/* Create Project Form */}
        <div className="bg-white shadow sm:rounded-lg mb-8 p-6">
          <form onSubmit={handleCreateProject} className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              disabled={creating}
            />
            <button
              type="submit"
              disabled={creating || !newProjectName}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {creating ? 'Creating...' : (
                <>
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  New Project
                </>
              )}
            </button>
          </form>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="text-center py-12">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No projects found. Create one to get started.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{project.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {project.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Server className="mr-2 h-4 w-4" />
                      <span className="truncate font-mono">{project.api.url}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Database Port: {project.database.port}</span>
                    </div>
                    
                    {project.services && (
                      <>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Services</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center text-xs text-gray-600">
                              <Globe className="mr-1 h-3 w-3" />
                              <span>Kong: {project.services.kong.port}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Shield className="mr-1 h-3 w-3" />
                              <span>Auth: {project.services.auth.port}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Server className="mr-1 h-3 w-3" />
                              <span>REST: {project.services.rest.port}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Radio className="mr-1 h-3 w-3" />
                              <span>Realtime: {project.services.realtime.port}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <HardDrive className="mr-1 h-3 w-3" />
                              <span>Storage: {project.services.storage.port}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API Keys</p>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all mb-2">
                        <span className="text-gray-400 select-none mr-2">ANON:</span>
                        {project.api.anon_key.substring(0, 10)}...
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                        <span className="text-gray-400 select-none mr-2">SERVICE:</span>
                        {project.api.service_key.substring(0, 10)}...
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadConfig(project.id, project.name)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      title="Download Supabase config"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Config
                    </button>
                    <button
                      onClick={() => downloadEnv(project.id, project.name)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      title="Download environment variables"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Env
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
