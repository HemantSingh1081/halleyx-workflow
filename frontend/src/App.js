import React, { useState } from 'react';
import WorkflowList from './components/WorkflowList';
import WorkflowEditor from './components/WorkflowEditor';
import ExecutionView from './components/ExecutionView';
import './App.css';

function App() {
  const [view, setView] = useState('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executionId, setExecutionId] = useState(null);

  return (
    <div className="App">
      <header className="app-header">
        <h1>⚡ Workflow Engine</h1>
        <nav>
          <button onClick={() => setView('list')}>Workflows</button>
          <button onClick={() => {
            setSelectedWorkflow(null);
            setView('editor');
          }}>+ Create New</button>
        </nav>
      </header>

      <main>
        {view === 'list' && (
          <WorkflowList 
            onEdit={(wf) => {
              setSelectedWorkflow(wf);
              setView('editor');
            }}
            onExecute={(id) => {
              setExecutionId(id);
              setView('execution');
            }}
          />
        )}

        {view === 'editor' && (
          <WorkflowEditor 
            workflow={selectedWorkflow}
            onSave={() => setView('list')}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'execution' && (
          <ExecutionView 
            workflowId={executionId}
            onBack={() => setView('list')}
          />
        )}
      </main>
    </div>
  );
}

export default App;