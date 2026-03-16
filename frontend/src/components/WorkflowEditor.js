import React, { useState } from 'react';
import axios from 'axios';
import WorkflowCanvas from './WorkflowCanvas';

const API = 'http://localhost:5000/api';

function WorkflowEditor({ workflow, onSave, onCancel }) {
  const [name, setName] = useState(workflow?.name || '');
  const [steps, setSteps] = useState(workflow?.steps || []);
  const [rules, setRules] = useState(workflow?.rules || []);
  const [activeTab, setActiveTab] = useState('canvas');
  
  const [stepName, setStepName] = useState('');
  const [ruleCondition, setRuleCondition] = useState('');
  const [ruleStep, setRuleStep] = useState('');
  const [ruleNext, setRuleNext] = useState('');

  // Manual step add
  const addStep = () => {
    if (stepName.trim()) {
      setSteps([
        ...steps,
        { id: Date.now().toString(), name: stepName, type: 'task' }
      ]);
      setStepName('');
    }
  };

  // Manual rule add
  const addRule = () => {
    if (ruleCondition && ruleStep && ruleNext) {
      setRules([
        ...rules,
        {
          id: Date.now().toString(),
          step_id: ruleStep,
          condition: ruleCondition,
          next_step: ruleNext
        }
      ]);
      setRuleCondition('');
    }
  };

  const handleSubmit = async () => {
    const data = { name, steps, rules };
    
    if (workflow?.id) {
      await axios.put(`${API}/workflows/${workflow.id}`, data);
    } else {
      await axios.post(`${API}/workflows`, data);
    }
    onSave();
  };

  return (
    <div className="workflow-editor">
      <h2>{workflow ? 'Edit' : 'Create'} Workflow</h2>
      
      <div className="form-group">
        <label>Workflow Name:</label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter workflow name"
        />
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button 
          className={activeTab === 'canvas' ? 'active' : ''}
          onClick={() => setActiveTab('canvas')}
        >
           Canvas View
        </button>
        <button 
          className={activeTab === 'manual' ? 'active' : ''}
          onClick={() => setActiveTab('manual')}
        >
           Manual Edit
        </button>
      </div>

      {/* Canvas View */}
      {activeTab === 'canvas' && (
        <WorkflowCanvas 
          steps={steps}
          rules={rules}
          onStepsChange={setSteps}
          onRulesChange={setRules}
        />
      )}

      {/* Manual View */}
      {activeTab === 'manual' && (
        <>
          <div className="steps-section">
            <h3>Steps</h3>
            <div className="add-step">
              <input 
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="Step name"
              />
              <button onClick={addStep}>Add</button>
            </div>
            
            <ul>
              {steps.map((s, i) => (
                <li key={s.id}>
                  {i+1}. {s.name} ({s.type})
                  <button onClick={() => {
                    setSteps(steps.filter(step => step.id !== s.id));
                  }} style={{ marginLeft: 10 }}>❌</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rules-section">
            <h3>Rules</h3>
            <div className="add-rule">
              <select onChange={(e) => setRuleStep(e.target.value)}>
                <option value="">Select Step</option>
                {steps.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              
              <input 
                placeholder="Condition (amount > 100)"
                value={ruleCondition}
                onChange={(e) => setRuleCondition(e.target.value)}
              />
              
              <select onChange={(e) => setRuleNext(e.target.value)}>
                <option value="">Next Step</option>
                {steps.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              
              <button onClick={addRule}>Add Rule</button>
            </div>

            <ul>
              {rules.map(r => {
                const step = steps.find(s => s.id === r.step_id);
                return (
                  <li key={r.id}>
                    If {step?.name} → {r.condition} → {r.next_step}
                    <button onClick={() => {
                      setRules(rules.filter(rule => rule.id !== r.id));
                    }} style={{ marginLeft: 10 }}>❌</button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      <div className="actions">
        <button onClick={handleSubmit}>Save Workflow</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default WorkflowEditor;