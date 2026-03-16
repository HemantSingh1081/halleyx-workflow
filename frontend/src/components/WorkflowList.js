import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function WorkflowList({ onEdit, onExecute }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await axios.get(`${API}/workflows`);
      setWorkflows(res.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await axios.delete(`${API}/workflows/${id}`);
        fetchWorkflows();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  // Filter workflows based on search and status
  const filteredWorkflows = workflows.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && wf.is_active) ||
      (filterStatus === 'inactive' && !wf.is_active);
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (isActive) => {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  };

  // Get step count with icon
  const getStepInfo = (steps) => {
    const count = steps?.length || 0;
    return (
      <span className="step-info">
        <span className="step-icon">📋</span>
        <span>{count} step{count !== 1 ? 's' : ''}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="workflow-list-container">
      {/* Header Section */}
      <div className="list-header">
        <div className="header-title">
          <h1>📋 Workflows</h1>
          <p>Manage and execute your workflow processes</p>
        </div>
        <button className="create-btn" onClick={() => onEdit(null)}>
          <span className="btn-icon">➕</span>
          Create New Workflow
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button 
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={filterStatus === 'active' ? 'active' : ''}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button 
            className={filterStatus === 'inactive' ? 'active' : ''}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Workflow Cards Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No workflows found</h3>
          <p>Get started by creating your first workflow</p>
          <button className="create-empty-btn" onClick={() => onEdit(null)}>
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="workflow-grid">
          {filteredWorkflows.map(wf => (
            <div key={wf.id} className="workflow-card">
              {/* Card Header */}
              <div className="card-header">
                <div className="workflow-icon">
                  {wf.name.charAt(0).toUpperCase()}
                </div>
                <div className="workflow-info">
                  <h3>{wf.name}</h3>
                  <div className={getStatusBadge(wf.is_active)}>
                    {wf.is_active ? '● Active' : '○ Inactive'}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <div className="workflow-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📦</span>
                    <span>v{wf.version || 1}</span>
                  </div>
                  <div className="meta-item">
                    {getStepInfo(wf.steps)}
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⚡</span>
                    <span>{wf.rules?.length || 0} rules</span>
                  </div>
                </div>

                {/* Created Date */}
                <div className="created-date">
                  <span className="date-icon">🕒</span>
                  Created: {new Date(wf.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>

              {/* Card Footer with Actions */}
              <div className="card-footer">
                <button 
                  className="action-btn edit"
                  onClick={() => onEdit(wf)}
                  title="Edit workflow"
                >
                  ✏️ Edit
                </button>
                <button 
                  className="action-btn execute"
                  onClick={() => onExecute(wf.id)}
                  title="Execute workflow"
                >
                  ▶️ Execute
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDelete(wf.id)}
                  title="Delete workflow"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {filteredWorkflows.length > 0 && (
        <div className="list-footer">
          <p>Showing {filteredWorkflows.length} of {workflows.length} workflows</p>
        </div>
      )}
    </div>
  );
}

export default WorkflowList;