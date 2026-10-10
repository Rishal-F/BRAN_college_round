import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProblemStory from './components/ProblemStory';
import WorkflowPipeline from './components/WorkflowPipeline';
import ResearchWorkspace from './components/ResearchWorkspace/ResearchWorkspace';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import CanvasBackground from './components/ui/CanvasBackground';
import Toast from './components/ui/Toast';
import { checkBackend } from './services/api';

export default function App() {
  // Real backend connection state
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'checking' | 'offline'

  // Application research workspace state
  const [activeWorkspaceStage, setActiveWorkspaceStage] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractionResponse, setExtractionResponse] = useState(null);
  const [auditResult, setAuditResult] = useState(null);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check backend health (GET /health)
  const verifyBackendHealth = useCallback(async (isManualRetry = false) => {
    setBackendStatus('checking');
    try {
      const res = await checkBackend();
      if (res && res.status === 'ok') {
        setBackendStatus('connected');
        if (isManualRetry) {
          addToast({
            type: 'success',
            title: 'FastAPI Connected',
            message: 'Successfully established connection to backend at 127.0.0.1:8000 (/health).',
          });
        }
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
      if (isManualRetry) {
        addToast({
          type: 'error',
          title: 'Backend Offline',
          message: 'Unable to reach FastAPI server at http://127.0.0.1:8000. Ensure uvicorn is running.',
        });
      }
    }
  }, [addToast]);

  // Initial ping on mount & periodic 30s heartbeat
  useEffect(() => {
    verifyBackendHealth(false);
    const intervalId = setInterval(() => verifyBackendHealth(false), 30000);
    return () => clearInterval(intervalId);
  }, [verifyBackendHealth]);

  // Stage navigation helper
  const handleNavigateToWorkspaceStage = (stageId) => {
    setActiveWorkspaceStage(stageId);
    const element = document.getElementById('workspace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartAudit = () => {
    handleNavigateToWorkspaceStage('upload');
  };

  const handleExploreWorkflow = () => {
    const element = document.getElementById('workflow');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-primary font-sans relative selection:bg-steel selection:text-white">
      {/* Subtle scientific ambient canvas background */}
      <CanvasBackground />

      {/* Floating Header Capsule with Live Health Indicator */}
      <Header
        backendStatus={backendStatus}
        onRetryBackend={() => verifyBackendHealth(true)}
        onNavigateToStage={handleNavigateToWorkspaceStage}
      />

      {/* Main Content Sections */}
      <main className="relative z-10">
        
        {/* Section A: Hero & Interactive Audit Lifecycle */}
        <HeroSection
          onStartAudit={handleStartAudit}
          onExploreWorkflow={handleExploreWorkflow}
          onSelectStage={handleNavigateToWorkspaceStage}
        />

        {/* Section B: The Reproducibility Problem */}
        <ProblemStory />

        {/* Section C: The CrisisGrid Workflow */}
        <WorkflowPipeline
          uploadedFile={uploadedFile}
          extractionStatus={extractionResponse?.status}
          auditResult={auditResult}
          onSelectStage={handleNavigateToWorkspaceStage}
        />

        {/* Section D & E: Interactive Research Workspace & Metric Audit */}
        <ResearchWorkspace
          activeStage={activeWorkspaceStage}
          setActiveStage={setActiveWorkspaceStage}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          extractionResponse={extractionResponse}
          setExtractionResponse={setExtractionResponse}
          auditResult={auditResult}
          setAuditResult={setAuditResult}
          addToast={addToast}
        />

        {/* Section F: Final Call to Action */}
        <CallToAction onStartAudit={handleStartAudit} />

      </main>

      {/* System Specifications & Team Roles Footer */}
      <Footer backendStatus={backendStatus} />

      {/* Toast Notification Stack */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
