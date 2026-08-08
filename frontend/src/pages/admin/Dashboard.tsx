export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">MAFIA</h1>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Admin Portal</p>
        </div>
        
        <nav className="space-y-2">
          <a href="#" className="block px-4 py-3 rounded-lg bg-red-50 text-primary font-bold">Live Games</a>
          <a href="#" className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold transition-colors">Generate Team</a>
          <a href="#" className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold transition-colors">Game History</a>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Live Games</h2>
          <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-red-800 transition-colors">
            + New Team
          </button>
        </div>

        {/* Live Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Active Game Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg text-gray-900">TEAM 05</h3>
                <p className="text-xs text-gray-500 font-medium">Code: K7M2PX</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">DISCUSSION</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">Timer</span>
                <span className="text-xl font-bold text-primary">01:24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">Status</span>
                <span className="text-sm font-bold text-gray-900">6/6 Alive</span>
              </div>
              <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                View Details
              </button>
            </div>
          </div>

          {/* Waiting Game Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg text-gray-900">TEAM 08</h3>
                <p className="text-xs text-gray-500 font-medium">Code: X9L4TY</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">WAITING</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">Players</span>
                <span className="text-sm font-bold text-gray-900">4/6 Joined</span>
              </div>
              <div className="h-[28px]"></div> {/* Spacer to match height */}
              <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                View Details
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
