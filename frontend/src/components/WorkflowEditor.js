import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import WorkflowCanvas from './WorkflowCanvas';

const API = 'http://localhost:5000/api';


const STEP_TYPES = [
  { value: 'task', label: ' Task' },
  { value: 'approval', label: ' Approval' },
  { value: 'notification', label: ' Notification' }
];

function WorkflowEditor({ workflow, onSave, onCancel }) {
  const [name, setName] = useState(workflow?.name || '');
  const [steps, setSteps] = useState(workflow?.steps || []);
  const [rules, setRules] = useState(workflow?.rules || []);
  const [activeTab, setActiveTab] = useState('canvas');
  
  // Form states
  const [stepForm, setStepForm] = useState({ name: '', type: 'task' });
  const [ruleForm, setRuleForm] = useState({ step: '', condition: '', next: '' });

  // Memoized values
  const stepOptions = useMemo(() => 
    steps.map(s => ({ value: s.id, label: s.name })), [steps]
  );

  // Handlers
  const handleStepChange = useCallback((field, value) => {
    setStepForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRuleChange = useCallback((field, value) => {
    setRuleForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const addStep = useCallback(() => {
    if (!stepForm.name.trim()) return;
    
    setSteps(prev => [...prev, {
      id: Date.now().toString(),
      name: stepForm.name,
      type: stepForm.type
    }]);
    
    setStepForm({ name: '', type: 'task' });
  }, [stepForm]);

  const addRule = useCallback(() => {
    const { step, condition, next } = ruleForm;
    if (!step || !condition || !next) return;
    
    setRules(prev => [...prev, {
      id: Date.now().toString(),
      step_id: step,
      condition,
      next_step: next
    }]);
    
    setRuleForm({ step: '', condition: '', next: '' });
  }, [ruleForm]);

  const deleteStep = useCallback((id) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    setRules(prev => prev.filter(r => r.step_id !== id));
  }, []);

  const deleteRule = useCallback((id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const data = { name, steps, rules };
      
      if (workflow?.id) {
        await axios.put(`${API}/workflows/${workflow.id}`, data);
      } else {
        await axios.post(`${API}/workflows`, data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow: ' + error.message);
    }
  }, [name, steps, rules, workflow, onSave]);

  return (
    <div className="workflow-editor">
      <Header 
        title={workflow ? ' Edit Workflow' : '➕ Create Workflow'} 
      />
      
      <WorkflowName 
        value={name} 
        onChange={setName} 
      />

      <TabSwitcher 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'canvas' ? (
        <WorkflowCanvas 
          steps={steps}
          rules={rules}
          onStepsChange={setSteps}
          onRulesChange={setRules}
        />
      ) : (
        <ManualView
          steps={steps}
          rules={rules}
          stepForm={stepForm}
          ruleForm={ruleForm}
          stepOptions={stepOptions}
          onStepChange={handleStepChange}
          onRuleChange={handleRuleChange}
          onAddStep={addStep}
          onAddRule={addRule}
          onDeleteStep={deleteStep}
          onDeleteRule={deleteRule}
        />
      )}

      <ActionButtons 
        onSave={handleSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}

// ===== Sub-Components =====

const Header = React.memo(({ title }) => (
  <h2>{title}</h2>
));

const WorkflowName = React.memo(({ value, onChange }) => (
  <div className="form-group">
    <label>Workflow Name:</label>
    <input 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter workflow name"
    />
  </div>
));

const TabSwitcher = React.memo(({ activeTab, onTabChange }) => (
  <div className="tab-switcher">
    {[
      { id: 'canvas', label: 'Canvas View' },
      { id: 'manual', label: 'Manual Edit' }
    ].map(tab => (
      <button
        key={tab.id}
        className={activeTab === tab.id ? 'active' : ''}
        onClick={() => onTabChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
));

const ManualView = React.memo(({
  steps, rules, stepForm, ruleForm, stepOptions,
  onStepChange, onRuleChange, onAddStep, onAddRule,
  onDeleteStep, onDeleteRule
}) => (
  <>
    <StepsSection
      steps={steps}
      stepForm={stepForm}
      onStepChange={onStepChange}
      onAddStep={onAddStep}
      onDeleteStep={onDeleteStep}
    />
    
    <RulesSection
      steps={steps}
      rules={rules}
      ruleForm={ruleForm}
      stepOptions={stepOptions}
      onRuleChange={onRuleChange}
      onAddRule={onAddRule}
      onDeleteRule={onDeleteRule}
    />
  </>
));

const StepsSection = React.memo(({ steps, stepForm, onStepChange, onAddStep, onDeleteStep }) => (
  <div className="steps-section">
    <h3> Steps</h3>
    <div className="add-step">
      <input 
        value={stepForm.name}
        onChange={(e) => onStepChange('name', e.target.value)}
        placeholder="Step name"
      />
      <select 
        value={stepForm.type} 
        onChange={(e) => onStepChange('type', e.target.value)}
      >
        {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <button onClick={onAddStep}>Add Step</button>
    </div>
    
    <ul className="steps-list">
      {steps.map((s, i) => (
        <li key={s.id}>
          <span>
            <strong>{i+1}.</strong> {s.name} 
            <span className="step-type">({s.type})</span>
          </span>
          <button onClick={() => onDeleteStep(s.id)} className="delete-btn">❌</button>
        </li>
      ))}
      {!steps.length && <li className="empty-msg">No steps added yet</li>}
    </ul>
  </div>
));

const RulesSection = React.memo(({ steps, rules, ruleForm, stepOptions, onRuleChange, onAddRule, onDeleteRule }) => (
  <div className="rules-section">
    <h3> Rules</h3>
    <div className="add-rule">
      <select 
        value={ruleForm.step} 
        onChange={(e) => onRuleChange('step', e.target.value)}
      >
        <option value="">Select Step</option>
        {stepOptions.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      
      <input 
        placeholder="Condition (e.g., amount > 1000)"
        value={ruleForm.condition}
        onChange={(e) => onRuleChange('condition', e.target.value)}
      />
      
      <select 
        value={ruleForm.next} 
        onChange={(e) => onRuleChange('next', e.target.value)}
      >
        <option value="">Next Step</option>
        <option value="REJECT" className="reject-option"> REJECT (End Workflow)</option>
        {stepOptions.map(s => (
          <option key={s.value} value={s.label}>{s.label}</option>
        ))}
      </select>
      
      <button onClick={onAddRule}>Add Rule</button>
    </div>

    <ul className="rules-list">
      {rules.map(r => {
        const step = steps.find(s => s.id === r.step_id);
        return (
          <li key={r.id} className={r.next_step === 'REJECT' ? 'reject-rule' : ''}>
            <span>
              <strong>{step?.name || 'Unknown'}:</strong> {r.condition} → <strong>{r.next_step}</strong>
            </span>
            <button onClick={() => onDeleteRule(r.id)} className="delete-btn">❌</button>
          </li>
        );
      })}
      {!rules.length && <li className="empty-msg">No rules added yet</li>}
    </ul>
  </div>
));

const ActionButtons = React.memo(({ onSave, onCancel }) => (
  <div className="actions">
    <button onClick={onSave} className="save-btn"> Save Workflow</button>
    <button onClick={onCancel} className="cancel-btn"> Cancel</button>
  </div>
));

export default WorkflowEditor;