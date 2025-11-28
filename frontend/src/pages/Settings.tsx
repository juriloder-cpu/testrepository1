import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaSave, FaKey, FaPlus, FaTrash } from 'react-icons/fa';
import { settingsApi } from '../services/api';
import { Setting, SettingValue } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Settings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key_name: '',
    value: '',
    description: ''
  });

  const predefinedKeys = [
    { key: 'ANTHROPIC_API_KEY', description: 'Claude API Key for script generation' },
    { key: 'OPENAI_API_KEY', description: 'OpenAI API Key for script generation' },
    { key: 'LEONARDO_API_KEY', description: 'Leonardo.ai API Key for image generation' },
    { key: 'STABLE_DIFFUSION_API_KEY', description: 'Stable Diffusion API Key' },
    { key: 'MIDJOURNEY_API_KEY', description: 'Midjourney API Key (if using unofficial API)' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsApi.getAll();
      setSettings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (key: string) => {
    try {
      const response = await settingsApi.getByKey(key);
      setEditingKey(key);
      setEditValue(response.data.value);
    } catch (err: any) {
      toast.error('Failed to load setting value');
    }
  };

  const handleSave = async (key: string) => {
    try {
      const existing = settings.find(s => s.key_name === key);

      if (existing) {
        await settingsApi.update(key, { value: editValue });
        toast.success('Setting updated successfully');
      } else {
        const predefined = predefinedKeys.find(p => p.key === key);
        await settingsApi.create({
          key_name: key,
          value: editValue,
          description: predefined?.description
        });
        toast.success('Setting created successfully');
      }

      setEditingKey(null);
      setEditValue('');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save setting');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }

    try {
      await settingsApi.delete(key);
      toast.success('Setting deleted successfully');
      fetchSettings();
    } catch (err: any) {
      toast.error('Failed to delete setting');
    }
  };

  const handleAddNew = async () => {
    if (!newSetting.key_name || !newSetting.value) {
      toast.error('Key name and value are required');
      return;
    }

    try {
      await settingsApi.create(newSetting);
      toast.success('Setting created successfully');
      setShowAddForm(false);
      setNewSetting({ key_name: '', value: '', description: '' });
      fetchSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create setting');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-1">Manage API keys and configuration</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          Add Custom Setting
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Setting</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Name
              </label>
              <input
                type="text"
                value={newSetting.key_name}
                onChange={(e) => setNewSetting({ ...newSetting, key_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MY_CUSTOM_KEY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="password"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Setting
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewSetting({ key_name: '', value: '', description: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {predefinedKeys.map((predefined) => {
          const existing = settings.find(s => s.key_name === predefined.key);
          const isEditing = editingKey === predefined.key;

          return (
            <div key={predefined.key} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FaKey className="text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {predefined.key}
                    </h3>
                    {existing && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Configured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{predefined.description}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4">
                  <input
                    type="password"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    placeholder="Enter API key"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(predefined.key)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FaSave />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingKey(null);
                        setEditValue('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(predefined.key)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {existing ? 'Update' : 'Configure'}
                  </button>
                  {existing && (
                    <button
                      onClick={() => handleDelete(predefined.key)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom settings */}
        {settings
          .filter(s => !predefinedKeys.some(p => p.key === s.key_name))
          .map((setting) => {
            const isEditing = editingKey === setting.key_name;

            return (
              <div key={setting.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FaKey className="text-purple-500" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {setting.key_name}
                      </h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Custom
                      </span>
                    </div>
                    {setting.description && (
                      <p className="text-gray-600 text-sm mt-1">{setting.description}</p>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4">
                    <input
                      type="password"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(setting.key_name)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <FaSave />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingKey(null);
                          setEditValue('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(setting.key_name)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(setting.key_name)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Settings;
