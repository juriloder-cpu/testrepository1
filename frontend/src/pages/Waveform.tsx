import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaUpload, FaDownload, FaSpinner, FaMusic } from 'react-icons/fa';
import { waveformApi } from '../services/api';

const Waveform = () => {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ file_id: string; filename: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.mp3')) {
        toast.error('Please select an MP3 file');
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 50MB.');
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.toLowerCase().endsWith('.mp3')) {
      if (dropped.size > 50 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 50MB.');
        return;
      }
      setFile(dropped);
      setResult(null);
    } else {
      toast.error('Please drop an MP3 file');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setProgress('Uploading and converting... This may take a minute.');
    setResult(null);

    try {
      const response = await waveformApi.convert(file);
      setResult({
        file_id: response.data.file_id,
        filename: response.data.filename,
      });
      toast.success('Waveform video generated successfully!');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Conversion failed. Please try again.';
      toast.error(detail);
    } finally {
      setConverting(false);
      setProgress('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = waveformApi.getDownloadUrl(result.file_id, result.filename);
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">MP3 Waveform Converter</h1>
        <p className="text-gray-600 mt-2">
          Upload an MP3 file to generate a waveform visualization video
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            file
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          {!file ? (
            <>
              <FaMusic className="mx-auto text-5xl text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-4">
                Drag and drop an MP3 file here, or click to browse
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                <FaUpload />
                Choose MP3 File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-400 mt-3">Maximum file size: 50MB</p>
            </>
          ) : (
            <>
              <FaMusic className="mx-auto text-5xl text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {file && (
          <div className="mt-6 flex gap-4 justify-center">
            {!converting && !result && (
              <>
                <button
                  onClick={handleConvert}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FaUpload />
                  Generate Waveform Video
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              </>
            )}

            {converting && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 px-8 py-3 bg-gray-100 text-gray-600 rounded-lg">
                  <FaSpinner className="animate-spin" />
                  Processing...
                </div>
                <p className="text-sm text-gray-500">{progress}</p>
              </div>
            )}

            {result && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full text-center">
                  <p className="text-green-800 font-medium">
                    Waveform video generated successfully!
                  </p>
                  <p className="text-green-600 text-sm mt-1">{result.filename}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <FaDownload />
                    Download Video
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Convert Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-10 bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
            <li>Upload an MP3 audio file (up to 50MB)</li>
            <li>The tool analyzes the audio waveform data</li>
            <li>A video is generated with a white waveform visualization on a black background</li>
            <li>The audio is synced with the waveform animation</li>
            <li>Download the resulting MP4 video file</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Waveform;
