import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';


const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

function WorkflowList({ onEdit, onExecute }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch workflows
  useEffect(() => {
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
    
    fetchWorkflows();
  }, []);

  // Delete handler
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this workflow?')) return;
    
    try {
      await axios.delete(`${API}/workflows/${id}`);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }, []);

  // Filtered workflows - memoized
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
      const matchesSearch = wf.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && wf.is_active) ||
        (filterStatus === 'inactive' && !wf.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchTerm, filterStatus]);

  // Stats - memoized
  const stats = useMemo(() => ({
    showing: filteredWorkflows.length,
    total: workflows.length
  }), [filteredWorkflows.length, workflows.length]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="workflow-list-container">
      <Header onEdit={onEdit} />
      
      <Filters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {filteredWorkflows.length === 0 ? (
        <EmptyState onEdit={onEdit} />
      ) : (
        <>
          <WorkflowGrid
            workflows={filteredWorkflows}
            onEdit={onEdit}
            onExecute={onExecute}
            onDelete={handleDelete}
          />
          <ListFooter stats={stats} />
        </>
      )}
    </div>
  );
}

// ===== Sub-Components =====

const LoadingSpinner = React.memo(() => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading workflows...</p>
  </div>
));

const Header = React.memo(({ onEdit }) => (
  <div className="list-header">
    <div className="header-title">
      <h1>Workflows</h1>
      <p>Manage and execute your workflow processes</p>
    </div>
    <button className="create-btn" onClick={() => onEdit(null)}>
      <span>➕</span> Create New Workflow
    </button>
  </div>
));

const Filters = React.memo(({ searchTerm, onSearchChange, filterStatus, onFilterChange }) => (
  <div className="filters-section">
    <div className="search-box">
      <span className="search-icon"></span>
      <input
        type="text"
        placeholder="Search workflows..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <div className="filter-tabs">
      {FILTER_OPTIONS.map(option => (
        <button
          key={option.value}
          className={filterStatus === option.value ? 'active' : ''}
          onClick={() => onFilterChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
));

const EmptyState = React.memo(({ onEdit }) => (
  <div className="empty-state">
    <div className="empty-icon"></div>
    <h3>No workflows found</h3>
    <p>Get started by creating your first workflow</p>
    <button className="create-empty-btn" onClick={() => onEdit(null)}>
      Create Workflow
    </button>
  </div>
));

const WorkflowGrid = React.memo(({ workflows, onEdit, onExecute, onDelete }) => (
  <div className="workflow-grid">
    {workflows.map(workflow => (
      <WorkflowCard
        key={workflow.id}
        workflow={workflow}
        onEdit={onEdit}
        onExecute={onExecute}
        onDelete={onDelete}
      />
    ))}
  </div>
));

const WorkflowCard = React.memo(({ workflow, onEdit, onExecute, onDelete }) => {
  const { id, name, is_active, version, steps, rules, created_at } = workflow;
  
  return (
    <div className="workflow-card">
      <CardHeader name={name} isActive={is_active} />
      <CardBody
        version={version}
        steps={steps}
        rules={rules}
        createdAt={created_at}
      />
      <CardFooter
        onEdit={() => onEdit(workflow)}
        onExecute={() => onExecute(id)}
        onDelete={() => onDelete(id)}
      />
    </div>
  );
});

const CardHeader = React.memo(({ name, isActive }) => (
  <div className="card-header">
    <div className="workflow-icon">{name.charAt(0).toUpperCase()}</div>
    <div className="workflow-info">
      <h3>{name}</h3>
      <StatusBadge isActive={isActive} />
    </div>
  </div>
));

const StatusBadge = React.memo(({ isActive }) => (
  <div className={isActive ? 'status-badge active' : 'status-badge inactive'}>
    {isActive ? '● Active' : '○ Inactive'}
  </div>
));

const CardBody = React.memo(({ version, steps, rules, createdAt }) => (
  <div className="card-body">
    <div className="workflow-meta">
      <MetaItem text={`v${version || 1}`} />
      <MetaItem text={`${steps?.length || 0} step${steps?.length !== 1 ? 's' : ''}`} />
      <MetaItem text={`${rules?.length || 0} rules`} />
    </div>
    <CreatedDate date={createdAt} />
  </div>
));

const MetaItem = React.memo(({ icon, text }) => (
  <div className="meta-item">
    <span>{icon}</span>
    <span>{text}</span>
  </div>
));

const CreatedDate = React.memo(({ date }) => (
  <div className="created-date">
    <span></span>
    Created: {new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })}
  </div>
));

const CardFooter = React.memo(({ onEdit, onExecute, onDelete }) => (
  <div className="card-footer">
    <ActionButton onClick={onEdit} className="edit"  text="Edit" />
    <ActionButton onClick={onExecute} className="execute" text="Execute" />
    <ActionButton onClick={onDelete} className="delete" text="Delete" />
  </div>
));

const ActionButton = React.memo(({ onClick, className, icon, text }) => (
  <button className={`action-btn ${className}`} onClick={onClick}>
    {icon} {text}
  </button>
));

const ListFooter = React.memo(({ stats }) => (
  <div className="list-footer">
    <p>Showing {stats.showing} of {stats.total} workflows</p>
  </div>
));

export default WorkflowList;