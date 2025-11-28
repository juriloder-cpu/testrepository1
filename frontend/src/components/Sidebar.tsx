import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaProjectDiagram,
  FaFileAlt,
  FaImage,
  FaMicrophone,
  FaCog
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FaHome },
    { path: '/projects', label: 'Projects', icon: FaProjectDiagram },
    { path: '/scripts', label: 'Scripts', icon: FaFileAlt },
    { path: '/images', label: 'Images', icon: FaImage },
    { path: '/voiceovers', label: 'Voice Overs', icon: FaMicrophone },
    { path: '/settings', label: 'Settings', icon: FaCog },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">AI Story Video</h1>
        <p className="text-gray-400 text-sm mt-1">Creator Dashboard</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="text-xl" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs text-center">
          Version 1.0.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
