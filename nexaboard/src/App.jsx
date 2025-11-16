import { useState } from "react";
import Sidebar from "./components/Sidebar";
import StatusPage from "./pages/StatusPage";
import TextModePage from "./pages/TextModePage";
import ImagePage from "./pages/ImagePage";
import DrawPage from "./pages/DrawPage";
import GcodeViewerPage from "./pages/GcodeViewerPage";
import QueuePage from "./pages/QueuePage";
import LiveCamPage from "./pages/LiveCamPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="flex h-screen">
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      <div className="flex-1">
        {currentPage === "dashboard" && <StatusPage />}
        {currentPage === "textMode" && <TextModePage />}
        {currentPage === "imageMode" && <ImagePage />}
        {currentPage === "draw" && <DrawPage />}
        {currentPage === "gcodeViewer" && <GcodeViewerPage />}
        {currentPage === "queue" && <QueuePage />}
        {currentPage === "liveCam" && <LiveCamPage />}
      </div>
    </div>
  );
}
