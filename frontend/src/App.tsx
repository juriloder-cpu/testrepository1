import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Scripts from './pages/Scripts';
import Images from './pages/Images';
import VoiceOvers from './pages/VoiceOvers';
import Settings from './pages/Settings';
import Waveform from './pages/Waveform';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/images" element={<Images />} />
          <Route path="/voiceovers" element={<VoiceOvers />} />
          <Route path="/waveform" element={<Waveform />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;
