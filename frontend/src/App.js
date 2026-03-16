import React, { useState, useCallback } from 'react';
import WorkflowList from './components/WorkflowList';
import WorkflowEditor from './components/WorkflowEditor';
import ExecutionView from './components/ExecutionView';
import './App.css';

function App() {
  const [view, setView] = useState('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executionId, setExecutionId] = useState(null);

  // View handlers - useCallback for performance
  const showList = useCallback(() => setView('list'), []);
  const showEditor = useCallback(() => {
    setSelectedWorkflow(null);
    setView('editor');
  }, []);
  
  const handleEdit = useCallback((workflow) => {
    setSelectedWorkflow(workflow);
    setView('editor');
  }, []);
  
  const handleExecute = useCallback((id) => {
    setExecutionId(id);
    setView('execution');
  }, []);

  return (
    <div className="App">
      <Header 
        onShowList={showList} 
        onShowEditor={showEditor} 
      />
      
      <main>
        {view === 'list' && (
          <WorkflowList 
            onEdit={handleEdit}
            onExecute={handleExecute}
          />
        )}

        {view === 'editor' && (
          <WorkflowEditor 
            workflow={selectedWorkflow}
            onSave={showList}
            onCancel={showList}
          />
        )}

        {view === 'execution' && (
          <ExecutionView 
            workflowId={executionId}
            onBack={showList}
          />
        )}
      </main>
    </div>
  );
}

// Separate Header Component (optional but cleaner)
const Header = React.memo(({ onShowList, onShowEditor }) => (
  <header className="app-header">
    <h1> Workflow Engine</h1>
    <nav>
      <button onClick={onShowList}>Workflows</button>
      <button onClick={onShowEditor}>+ Create New</button>
    </nav>
  </header>
));

export default App;