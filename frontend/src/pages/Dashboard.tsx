import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaFileAlt, FaImage, FaMicrophone, FaPlus } from 'react-icons/fa';
import { projectsApi, scriptsApi, imagesApi } from '../services/api';
import { Project, Script, Image } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, scriptsRes, imagesRes] = await Promise.all([
        projectsApi.getAll(),
        scriptsApi.getAll(),
        imagesApi.getAll()
      ]);

      setProjects(projectsRes.data);
      setScripts(scriptsRes.data);
      setImages(imagesRes.data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const recentProjects = projects.slice(0, 3);
  const recentScripts = scripts.slice(0, 3);
  const recentImages = images.slice(0, 6);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to AI Story Video Creator</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Projects</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{projects.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaProjectDiagram className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Scripts</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{scripts.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Images</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{images.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaImage className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Voice Overs</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaMicrophone className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/projects"
            className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaPlus className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">New Project</p>
              <p className="text-sm text-gray-600">Start a new video project</p>
            </div>
          </Link>

          <Link
            to="/scripts"
            className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Generate Script</p>
              <p className="text-sm text-gray-600">Create AI-powered scripts</p>
            </div>
          </Link>

          <Link
            to="/images"
            className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaImage className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Generate Images</p>
              <p className="text-sm text-gray-600">Create scene images with AI</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{project.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Scripts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Scripts</h2>
            <Link to="/scripts" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          {recentScripts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scripts yet</p>
          ) : (
            <div className="space-y-3">
              {recentScripts.map((script) => (
                <div key={script.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">Script #{script.id}</h3>
                    {script.ai_provider && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {script.ai_provider}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{script.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(script.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Images */}
      {recentImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Images</h2>
            <Link to="/images" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentImages.map((image) => (
              <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={`/api/images/${image.id}/download`}
                  alt={`Scene ${image.scene_number || ''}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
