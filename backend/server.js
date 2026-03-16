const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Database
let workflows = [];
let executions = [];

// ==================== WORKFLOW APIS ====================

// Create Workflow
app.post('/api/workflows', (req, res) => {
    const { name, steps, rules } = req.body;
    
    const newWorkflow = {
        id: uuidv4(),
        name,
        steps: steps || [],
        rules: rules || [],
        version: 1,
        is_active: true,
        created_at: new Date().toISOString()
    };
    
    workflows.push(newWorkflow);
    res.status(201).json(newWorkflow);
});

// List Workflows
app.get('/api/workflows', (req, res) => {
    res.json(workflows);
});

// Get Single Workflow
app.get('/api/workflows/:id', (req, res) => {
    const workflow = workflows.find(w => w.id === req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Not found' });
    res.json(workflow);
});

// Update Workflow
app.put('/api/workflows/:id', (req, res) => {
    const index = workflows.findIndex(w => w.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    workflows[index] = { ...workflows[index], ...req.body };
    res.json(workflows[index]);
});

// Delete Workflow
app.delete('/api/workflows/:id', (req, res) => {
    workflows = workflows.filter(w => w.id !== req.params.id);
    res.status(204).send();
});

// ==================== EXECUTION APIS ====================

// Execute Workflow
app.post('/api/workflows/:id/execute', (req, res) => {
    const workflow = workflows.find(w => w.id === req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Not found' });
    
    const inputData = req.body;
    
    const execution = {
        id: uuidv4(),
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        status: 'in_progress',
        input: inputData,
        logs: [],
        current_step: workflow.steps[0] || null,
        started_at: new Date().toISOString(),
        ended_at: null
    };
    
    executions.push(execution);
    
    // Simple execution
    setTimeout(() => {
        executeWorkflow(execution, workflow);
    }, 100);
    
    res.status(202).json({ execution_id: execution.id });
});

// Get Execution Status
app.get('/api/executions/:id', (req, res) => {
    const execution = executions.find(e => e.id === req.params.id);
    if (!execution) return res.status(404).json({ error: 'Not found' });
    res.json(execution);
});

// Cancel Execution
app.post('/api/executions/:id/cancel', (req, res) => {
    const execution = executions.find(e => e.id === req.params.id);
    if (!execution) return res.status(404).json({ error: 'Not found' });
    
    execution.status = 'canceled';
    execution.ended_at = new Date().toISOString();
    res.json(execution);
});

// Helper Functions
function executeWorkflow(execution, workflow) {
    let currentStepIndex = 0;
    const steps = workflow.steps || [];
    const rules = workflow.rules || [];
    
    execution.logs.push({
        step: 'workflow',
        status: 'started',
        timestamp: new Date().toISOString()
    });
    
    while (currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        
        execution.logs.push({
            step: currentStep.name,
            status: 'started',
            timestamp: new Date().toISOString()
        });
        
        // Check rules
        const stepRules = rules.filter(r => r.step_id === currentStep.id);
        let nextStepFound = false;
        
        for (const rule of stepRules) {
            try {
                const conditionMet = evaluateCondition(rule.condition, execution.input);
                
                if (conditionMet) {
                    execution.logs.push({
                        step: currentStep.name,
                        status: 'rule_matched',
                        rule: rule.condition,
                        next_step: rule.next_step,
                        timestamp: new Date().toISOString()
                    });
                    
                    const nextStepIndex = steps.findIndex(s => s.name === rule.next_step);
                    if (nextStepIndex !== -1) {
                        currentStepIndex = nextStepIndex;
                        nextStepFound = true;
                        break;
                    }
                }
            } catch (e) {
                execution.logs.push({
                    step: currentStep.name,
                    status: 'rule_error',
                    error: e.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        if (!nextStepFound) {
            execution.logs.push({
                step: currentStep.name,
                status: 'completed',
                timestamp: new Date().toISOString()
            });
            currentStepIndex++;
        }
    }
    
    execution.status = 'completed';
    execution.ended_at = new Date().toISOString();
    
    execution.logs.push({
        step: 'workflow',
        status: 'completed',
        timestamp: new Date().toISOString()
    });
}

function evaluateCondition(condition, input) {
    if (!condition || condition === 'DEFAULT') return true;
    
    const parts = condition.split(' ');
    if (parts.length === 3) {
        const field = parts[0];
        const operator = parts[1];
        const value = parts[2];
        
        const fieldValue = input[field];
        
        switch(operator) {
            case '>': return fieldValue > parseFloat(value);
            case '<': return fieldValue < parseFloat(value);
            case '==': return fieldValue == value.replace(/'/g, '');
            case '!=': return fieldValue != value.replace(/'/g, '');
            default: return false;
        }
    }
    
    return false;
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});