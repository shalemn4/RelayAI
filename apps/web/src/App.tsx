import React, { useState } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { LeadsView } from './components/LeadsView';
import { CallsView } from './components/CallsView';
import { FleetView } from './components/FleetView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Operations Command Center', subtitle: 'Live telemetry stream, AI resolution KPIs & inbound traffic' };
      case 'inbox':
        return { title: 'Unified Omnichannel Inbox', subtitle: 'Human-in-the-loop triage, AI response review, and safe SQL AST filtering' };
      case 'leads':
        return { title: 'Lead Pipeline & Opportunity Tracker', subtitle: 'Conversion probability, deal values, and automated stage progression' };
      case 'calls':
        return { title: 'Live Voice Call Operations', subtitle: 'Real-time audio waveform, speech-to-text transcript & supervisor barge-in' };
      case 'fleet':
        return { title: 'AI Agent Fleet Telemetry', subtitle: 'Autonomous triage agents, model configurations & takeover rates' };
      case 'analytics':
        return { title: 'Operational Analytics & Metrics', subtitle: 'Dynamic SQL calculations, channel volume distribution & latency percentiles' };
      case 'settings':
        return { title: 'Settings & Diagnostics', subtitle: 'FastAPI backend connection status and session management' };
    }
  };

  const meta = getHeaderMeta();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace */}
      <main className="app-main">
        <Header title={meta.title} subtitle={meta.subtitle} />

        {activeTab === 'overview' && (
          <DashboardView 
            setActiveTab={setActiveTab} 
            onSelectConversation={(id) => setSelectedConversationId(id)} 
          />
        )}

        {activeTab === 'inbox' && (
          <InboxView 
            selectedConversationId={selectedConversationId} 
            setSelectedConversationId={setSelectedConversationId} 
          />
        )}

        {activeTab === 'leads' && <LeadsView />}

        {activeTab === 'calls' && <CallsView />}

        {activeTab === 'fleet' && <FleetView />}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default App;
