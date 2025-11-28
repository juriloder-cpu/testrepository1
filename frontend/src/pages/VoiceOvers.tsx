import { FaMicrophone, FaInfoCircle } from 'react-icons/fa';

const VoiceOvers = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Voice Overs</h1>
        <p className="text-gray-600 mt-1">Text-to-speech voice generation</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaMicrophone className="text-5xl text-blue-600" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Voice Over Module
        </h2>

        <div className="max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-600 text-xl flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Coming Soon</h3>
                <p className="text-blue-800 text-sm">
                  The Voice Over module is currently under development. This feature will allow you to:
                </p>
                <ul className="list-disc list-inside text-blue-800 text-sm mt-3 space-y-1">
                  <li>Convert scripts to speech using AI voice models</li>
                  <li>Choose from multiple voice options and languages</li>
                  <li>Customize voice parameters (speed, pitch, tone)</li>
                  <li>Preview and download audio files</li>
                  <li>Sync audio with your video timeline</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Planned Voice Providers</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-700">ElevenLabs</p>
                <p className="text-sm text-gray-500">High-quality AI voices</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-700">Google Text-to-Speech</p>
                <p className="text-sm text-gray-500">Natural sounding voices</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-700">Amazon Polly</p>
                <p className="text-sm text-gray-500">Lifelike speech synthesis</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-700">Azure Speech</p>
                <p className="text-sm text-gray-500">Neural voice technology</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceOvers;
