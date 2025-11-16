import { useState } from 'react';
import Sidebar from './components/Sidebar';
import StatusPage from './pages/StatusPage';
import TextModePage from './pages/TextModePage';
import ImagePage from './pages/ImagePage';
import QueuePage from './pages/QueuePage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="flex h-screen">
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      <div className="flex-1">
        {currentPage === 'dashboard' && <StatusPage />}
        {currentPage === 'textMode' && <TextModePage />}
        {currentPage === 'imageMode' && <ImagePage />}
        {currentPage === 'queue' && <QueuePage />}
      </div>
    </div>
  );
}
