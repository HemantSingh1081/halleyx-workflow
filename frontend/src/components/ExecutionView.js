import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function ExecutionView({ workflowId, onBack }) {
  const [input, setInput] = useState('{"amount": 500}');
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState(null);

  const startExecution = async () => {
    setLoading(true);
    try {
      const data = JSON.parse(input);
      console.log("Starting execution with data:", data);
      const res = await axios.post(`${API}/workflows/${workflowId}/execute`, data);
      console.log("Execution started:", res.data);
      setExecutionId(res.data.execution_id);
      
      // Poll for status every 2 seconds
      const interval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API}/executions/${res.data.execution_id}`);
          console.log("Execution status:", statusRes.data);
          setExecution(statusRes.data);
          
          if (statusRes.data.status === 'completed' || statusRes.data.status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Status check error:", err);
        }
      }, 2000);
      
    } catch (e) {
      console.error("Execution error:", e);
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecution = async (id) => {
    try {
      const res = await axios.get(`${API}/executions/${id}`);
      console.log("Fetched execution:", res.data);
      setExecution(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  return (
    <div className="execution-view">
      <h2>Execute Workflow</h2>
      
      {!executionId && !execution ? (
        <div>
          <h3>Input Data (JSON):</h3>
          <textarea 
            rows="5" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"amount": 500}'
          />
          <button onClick={startExecution} disabled={loading}>
            {loading ? 'Starting...' : 'Start Execution'}
          </button>
        </div>
      ) : (
        <div>
          <h3>Execution Status: 
            <span className={`status-${execution?.status || 'unknown'}`}>
              {execution?.status || 'Loading...'}
            </span>
          </h3>
          
          {execution?.ended_at && (
            <p>Completed at: {new Date(execution.ended_at).toLocaleString()}</p>
          )}
          
          <div className="logs">
            <h4>Execution Logs ({execution?.logs?.length || 0} entries):</h4>
            {execution?.logs?.map((log, i) => (
              <div key={i} className="log-entry">
                <strong>{new Date(log.timestamp).toLocaleTimeString()}</strong> - 
                <span className={`log-status-${log.status}`}> {log.step}: {log.status}</span>
                {log.rule && <div className="log-rule">Rule: {log.rule} → {log.next_step}</div>}
                {log.message && <div className="log-message">{log.message}</div>}
              </div>
            ))}
            {execution?.logs?.length === 0 && (
              <p>No logs available yet...</p>
            )}
          </div>
          
          <button onClick={onBack}>Back to List</button>
          <button onClick={() => {
            setExecutionId(null);
            setExecution(null);
          }}>New Execution</button>
        </div>
      )}
    </div>
  );
}

export default ExecutionView;