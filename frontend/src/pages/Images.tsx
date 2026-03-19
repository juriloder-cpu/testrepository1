import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaRobot, FaDownload, FaTrash, FaImage } from 'react-icons/fa';
import { imagesApi, projectsApi, scriptsApi } from '../services/api';
import { Image, Project, Script } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Images = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [generateFormData, setGenerateFormData] = useState({
    project_id: 0,
    script_id: 0,
    auto_generate_from_script: false,
    providers: [] as string[],
    prompts: ['']
  });

  // Fetch projects only once on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch images when selected project changes
  useEffect(() => {
    if (selectedProject !== null) {
      fetchImages();
    }
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

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await imagesApi.getAll(selectedProject || undefined);
      setImages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const fetchScriptsForProject = async (projectId: number) => {
    try {
      const response = await scriptsApi.getAll(projectId);
      setScripts(response.data);
    } catch (err: any) {
      console.error('Failed to load scripts:', err);
    }
  };

  const handleGenerateClick = async () => {
    if (projects.length === 0) {
      toast.error('Please create a project first');
      return;
    }

    const projectId = selectedProject || projects[0].id;
    await fetchScriptsForProject(projectId);

    setGenerateFormData({
      ...generateFormData,
      project_id: projectId,
      providers: []
    });
    setShowGenerateModal(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (generateFormData.providers.length === 0) {
      toast.error('Please select at least one provider');
      return;
    }

    if (!generateFormData.auto_generate_from_script && generateFormData.prompts.filter(p => p.trim()).length === 0) {
      toast.error('Please provide at least one prompt or enable auto-generation from script');
      return;
    }

    try {
      setGenerating(true);
      await imagesApi.generate({
        ...generateFormData,
        prompts: generateFormData.prompts.filter(p => p.trim())
      });
      toast.success('Images generated successfully!');
      setShowGenerateModal(false);
      fetchImages();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate images');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadImage = async (id: number) => {
    try {
      const response = await imagesApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `image_${id}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Image downloaded');
    } catch (err: any) {
      toast.error('Failed to download image');
    }
  };

  const handleDownloadAll = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    try {
      const response = await imagesApi.downloadAll(selectedProject);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${selectedProject}_images.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('All images downloaded as ZIP');
    } catch (err: any) {
      toast.error('Failed to download images');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await imagesApi.delete(id);
      toast.success('Image deleted successfully');
      fetchImages();
    } catch (err: any) {
      toast.error('Failed to delete image');
    }
  };

  const toggleProvider = (provider: string) => {
    setGenerateFormData(prev => ({
      ...prev,
      providers: prev.providers.includes(provider)
        ? prev.providers.filter(p => p !== provider)
        : [...prev.providers, provider]
    }));
  };

  const addPromptField = () => {
    setGenerateFormData(prev => ({
      ...prev,
      prompts: [...prev.prompts, '']
    }));
  };

  const updatePrompt = (index: number, value: string) => {
    setGenerateFormData(prev => ({
      ...prev,
      prompts: prev.prompts.map((p, i) => i === index ? value : p)
    }));
  };

  const removePrompt = (index: number) => {
    setGenerateFormData(prev => ({
      ...prev,
      prompts: prev.prompts.filter((_, i) => i !== index)
    }));
  };

  if (loading && images.length === 0) {
    return <LoadingSpinner message="Loading images..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchImages} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Images</h1>
          <p className="text-gray-600 mt-1">Generate AI images for your video scenes</p>
        </div>
        <div className="flex gap-2">
          {images.length > 0 && selectedProject && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaDownload />
              Download All
            </button>
          )}
          <button
            onClick={handleGenerateClick}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FaRobot />
            Generate Images
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

      {images.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No images yet</h2>
          <p className="text-gray-500 mb-6">Generate images from your scripts or custom prompts</p>
          <button
            onClick={handleGenerateClick}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Generate Images
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => {
            const project = projects.find(p => p.id === image.project_id);

            return (
              <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 relative">
                  <img
                    src={`/api/images/${image.id}/download`}
                    alt={`Scene ${image.scene_number || ''}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {image.scene_number && (
                    <div className="absolute top-2 left-2 px-3 py-1 bg-black bg-opacity-70 text-white text-sm rounded-full">
                      Scene {image.scene_number}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {project?.name || 'Unknown Project'}
                    </h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {image.provider}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {image.prompt}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadImage(image.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <FaDownload />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-6">Generate Images</h2>

            <form onSubmit={handleGenerateSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={generateFormData.project_id}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, project_id: Number(e.target.value) })}
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
                  Image Generation Providers (select one or more)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={generateFormData.providers.includes('leonardo')}
                      onChange={() => toggleProvider('leonardo')}
                      className="text-blue-600"
                    />
                    Leonardo.ai
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={generateFormData.providers.includes('stable_diffusion')}
                      onChange={() => toggleProvider('stable_diffusion')}
                      className="text-blue-600"
                    />
                    Stable Diffusion
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={generateFormData.providers.includes('midjourney')}
                      onChange={() => toggleProvider('midjourney')}
                      className="text-blue-600"
                    />
                    Midjourney (requires unofficial API)
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={generateFormData.auto_generate_from_script}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, auto_generate_from_script: e.target.checked })}
                    className="text-blue-600"
                  />
                  Auto-generate prompts from script
                </label>
              </div>

              {generateFormData.auto_generate_from_script && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Script
                  </label>
                  <select
                    value={generateFormData.script_id}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, script_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a script...</option>
                    {scripts.map((script) => (
                      <option key={script.id} value={script.id}>
                        Script {script.id} - {new Date(script.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!generateFormData.auto_generate_from_script && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Prompts
                  </label>
                  <div className="space-y-2">
                    {generateFormData.prompts.map((prompt, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={prompt}
                          onChange={(e) => updatePrompt(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Prompt ${index + 1}`}
                        />
                        {generateFormData.prompts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrompt(index)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPromptField}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another prompt
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaRobot />
                      Generate Images
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
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

export default Images;
