import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaRobot, FaDownload, FaEdit, FaTrash, FaFileAlt } from 'react-icons/fa';
import { scriptsApi, projectsApi } from '../services/api';
import { Script, Project } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Scripts = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);

  const [formData, setFormData] = useState({
    project_id: 0,
    content: ''
  });

  const [aiFormData, setAiFormData] = useState({
    project_id: 0,
    provider: 'claude' as 'claude' | 'openai',
    tone: 'neutral',
    length: 'medium',
    genre: 'general',
    custom_prompt: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchScripts();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data);
      if (response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchScripts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scriptsApi.getAll(selectedProject || undefined);
      setScripts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = () => {
    if (projects.length === 0) {
      toast.error('Please create a project first');
      return;
    }

    setEditingScript(null);
    setFormData({
      project_id: selectedProject || projects[0].id,
      content: ''
    });
    setShowModal(true);
  };

  const handleGenerateAI = () => {
    if (projects.length === 0) {
      toast.error('Please create a project first');
      return;
    }

    setAiFormData({
      ...aiFormData,
      project_id: selectedProject || projects[0].id
    });
    setShowAIModal(true);
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setFormData({
      project_id: script.project_id,
      content: script.content
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error('Script content is required');
      return;
    }

    try {
      if (editingScript) {
        await scriptsApi.update(editingScript.id, { content: formData.content });
        toast.success('Script updated successfully');
      } else {
        await scriptsApi.create(formData);
        toast.success('Script created successfully');
      }

      setShowModal(false);
      fetchScripts();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save script');
    }
  };

  const handleGenerateAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setGeneratingAI(true);
      await scriptsApi.generate(aiFormData);
      toast.success('Script generated successfully!');
      setShowAIModal(false);
      setAiFormData({
        project_id: selectedProject || projects[0].id,
        provider: 'claude',
        tone: 'neutral',
        length: 'medium',
        genre: 'general',
        custom_prompt: ''
      });
      fetchScripts();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate script');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleExport = async (id: number, format: 'txt' | 'md') => {
    try {
      const response = await scriptsApi.export(id, format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `script_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Script exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error('Failed to export script');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this script?')) {
      return;
    }

    try {
      await scriptsApi.delete(id);
      toast.success('Script deleted successfully');
      fetchScripts();
    } catch (err: any) {
      toast.error('Failed to delete script');
    }
  };

  if (loading && scripts.length === 0) {
    return <LoadingSpinner message="Loading scripts..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchScripts} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scripts</h1>
          <p className="text-gray-600 mt-1">Create and manage your video scripts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateManual}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaPlus />
            Manual Script
          </button>
          <button
            onClick={handleGenerateAI}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FaRobot />
            AI Generate
          </button>
        </div>
      </div>

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Project
          </label>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {scripts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No scripts yet</h2>
          <p className="text-gray-500 mb-6">Create a script manually or generate one with AI</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCreateManual}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Script
            </button>
            <button
              onClick={handleGenerateAI}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {scripts.map((script) => {
            const project = projects.find(p => p.id === script.project_id);

            return (
              <div key={script.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {project?.name || 'Unknown Project'}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      {script.ai_provider && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          AI: {script.ai_provider}
                        </span>
                      )}
                      {script.genre && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {script.genre}
                        </span>
                      )}
                      {script.tone && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {script.tone}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(script.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                    {script.content}
                  </pre>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleEdit(script)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleExport(script.id, 'txt')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <FaDownload />
                    Export TXT
                  </button>
                  <button
                    onClick={() => handleExport(script.id, 'md')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <FaDownload />
                    Export MD
                  </button>
                  <button
                    onClick={() => handleDelete(script.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Script Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingScript ? 'Edit Script' : 'Create New Script'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingScript}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Script Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={15}
                  placeholder="Enter your script here..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingScript ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-6">Generate Script with AI</h2>

            <form onSubmit={handleGenerateAISubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={aiFormData.project_id}
                  onChange={(e) => setAiFormData({ ...aiFormData, project_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="claude"
                      checked={aiFormData.provider === 'claude'}
                      onChange={(e) => setAiFormData({ ...aiFormData, provider: e.target.value as 'claude' | 'openai' })}
                      className="text-blue-600"
                    />
                    Claude (Anthropic)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="openai"
                      checked={aiFormData.provider === 'openai'}
                      onChange={(e) => setAiFormData({ ...aiFormData, provider: e.target.value as 'claude' | 'openai' })}
                      className="text-blue-600"
                    />
                    OpenAI (GPT-4)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <select
                    value={aiFormData.genre}
                    onChange={(e) => setAiFormData({ ...aiFormData, genre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="educational">Educational</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="documentary">Documentary</option>
                    <option value="story">Story</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={aiFormData.tone}
                    onChange={(e) => setAiFormData({ ...aiFormData, tone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="dramatic">Dramatic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length
                  </label>
                  <select
                    value={aiFormData.length}
                    onChange={(e) => setAiFormData({ ...aiFormData, length: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="short">Short (30s)</option>
                    <option value="medium">Medium (1-2min)</option>
                    <option value="long">Long (3-5min)</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  value={aiFormData.custom_prompt}
                  onChange={(e) => setAiFormData({ ...aiFormData, custom_prompt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Provide specific instructions for the AI..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={generatingAI}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingAI ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaRobot />
                      Generate Script
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  disabled={generatingAI}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scripts;
