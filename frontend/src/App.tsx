import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JoinPage } from './pages/JoinPage';
import { AdminDashboard } from './pages/admin/Dashboard';
import { SocketProvider } from './services/SocketContext';
import { PlayerPortal } from './pages/PlayerPortal';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<JoinPage />} />
          <Route path="/game" element={<PlayerPortal />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
