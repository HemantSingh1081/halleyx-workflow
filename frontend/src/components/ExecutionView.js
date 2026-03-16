import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';


const STATUS_CONFIG = {
  in_progress: { class: 'status-in_progress', icon: '⏳' },
  completed: { class: 'status-completed', icon: '✅' },
  rejected: { class: 'status-rejected', icon: '❌' },
  failed: { class: 'status-failed', icon: '⚠️' },
  canceled: { class: 'status-canceled', icon: '🛑' }
};

const LOG_STATUS_CLASS = {
  started: 'log-status-started',
  completed: 'log-status-completed',
  rejected: 'log-status-rejected',
  failed: 'log-status-failed',
  canceled: 'log-status-canceled',
  rule_matched: 'log-status-rule_matched'
};

function ExecutionView({ workflowId, onBack }) {
  const [input, setInput] = useState('{"amount": 500}');
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState(null);
  const intervalRef = useRef(null); // Interval cleanup ke liye

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getStatusInfo = (status) => 
    STATUS_CONFIG[status] || { class: '', icon: '' };

  const startExecution = useCallback(async () => {
    setLoading(true);
    try {
      const data = JSON.parse(input);
      console.log(" Starting execution:", data);
      
      const res = await axios.post(`${API}/workflows/${workflowId}/execute`, data);
      const newExecutionId = res.data.execution_id;
      
      setExecutionId(newExecutionId);
      
      // Clear previous interval if any
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      // Poll for status
      intervalRef.current = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API}/executions/${newExecutionId}`);
          setExecution(statusRes.data);
          
          const finalStatuses = ['completed', 'rejected', 'failed', 'canceled'];
          if (finalStatuses.includes(statusRes.data.status)) {
            clearInterval(intervalRef.current);
          }
        } catch (err) {
          console.error(" Status check error:", err);
        }
      }, 2000);
      
    } catch (e) {
      console.error(" Execution error:", e);
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [input, workflowId]);

  const resetExecution = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setExecutionId(null);
    setExecution(null);
  }, []);

  const formatTime = (timestamp) => 
    new Date(timestamp).toLocaleTimeString();

  const { icon, class: statusClass } = getStatusInfo(execution?.status);

  return (
    <div className="execution-view">
      <h2>Execute Workflow</h2>
      
      {!executionId && !execution ? (
        <InputForm 
          input={input}
          setInput={setInput}
          loading={loading}
          onStart={startExecution}
        />
      ) : (
        <ExecutionResult
          execution={execution}
          icon={icon}
          statusClass={statusClass}
          formatTime={formatTime}
          onBack={onBack}
          onReset={resetExecution}
        />
      )}
    </div>
  );
}

// Separate Components for better readability
const InputForm = React.memo(({ input, setInput, loading, onStart }) => (
  <div>
    <h3>Input Data (JSON):</h3>
    <textarea 
      rows="5" 
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder='{"amount": 500}'
    />
    <button onClick={onStart} disabled={loading}>
      {loading ? ' Starting...' : ' Start Execution'}
    </button>
  </div>
));

const ExecutionResult = React.memo(({ execution, icon, statusClass, formatTime, onBack, onReset }) => (
  <div>
    <h3>
      Execution Status: {icon} 
      <span className={statusClass}>
        {execution?.status || 'Loading...'}
      </span>
    </h3>
    
    {execution?.ended_at && (
      <p>Completed: {formatTime(execution.ended_at)}</p>
    )}
    
    <Logs execution={execution} formatTime={formatTime} />
    
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
      <button onClick={onBack}>← Back to List</button>
      <button onClick={onReset}>New Execution</button>
    </div>
  </div>
));

const Logs = React.memo(({ execution, formatTime }) => (
  <div className="logs">
    <h4>Execution Logs ({execution?.logs?.length || 0} entries):</h4>
    {execution?.logs?.map((log, i) => (
      <div key={i} className={`log-entry ${log.status}`}>
        <strong>{formatTime(log.timestamp)}</strong> - 
        <span className={LOG_STATUS_CLASS[log.status] || ''}> 
          {log.step}: {log.status}
        </span>
        {log.rule && <div className="log-rule"> {log.rule} → {log.next_step}</div>}
        {log.message && <div className="log-message">{log.message}</div>}
        {log.error && <div className="log-error"> {log.error}</div>}
      </div>
    ))}
    {execution?.logs?.length === 0 && <p>No logs available yet...</p>}
  </div>
));

export default ExecutionView;