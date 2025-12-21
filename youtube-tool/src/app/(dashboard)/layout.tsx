export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">YouTube Video Tool</h1>
              </div>
              <div className="ml-10 flex items-center space-x-4">
                <a
                  href="/projects"
                  className="text-gray-900 hover:bg-gray-50 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Projects
                </a>
                <a
                  href="/settings"
                  className="text-gray-500 hover:bg-gray-50 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
