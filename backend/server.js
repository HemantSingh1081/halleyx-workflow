const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
let workflows = [];
let executions = [];

// ==================== WORKFLOW APIS ====================

// Create Workflow
app.post('/api/workflows', (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
    try {
        const workflow = workflows.find(w => w.id === req.params.id);
        if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
        
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
            try {
                executeWorkflow(execution, workflow);
            } catch (error) {
                console.error('Execution error:', error);
                execution.status = 'failed';
                execution.ended_at = new Date().toISOString();
                execution.logs.push({
                    step: 'workflow',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }, 100);
        
        res.status(202).json({ execution_id: execution.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

// ==================== HELPER FUNCTIONS ====================

function executeWorkflow(execution, workflow) {
    console.log("🚀 Executing workflow:", workflow.name);
    
    let currentStepIndex = 0;
    const steps = workflow.steps || [];
    const rules = workflow.rules || [];
    
    execution.logs = [];
    execution.status = 'in_progress';
    
    execution.logs.push({
        step: 'workflow',
        status: 'started',
        message: 'Workflow execution started',
        timestamp: new Date().toISOString()
    });
    
    while (currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        
        execution.logs.push({
            step: currentStep.name,
            status: 'started',
            message: `Starting step: ${currentStep.name}`,
            timestamp: new Date().toISOString()
        });
        
        // Check rules for this step
        const stepRules = rules.filter(r => r.step_id === currentStep.id);
        let nextStepFound = false;
        let shouldReject = false;
        let rejectReason = '';
        
        if (stepRules.length > 0) {
            for (const rule of stepRules) {
                try {
                    const conditionMet = evaluateCondition(rule.condition, execution.input);
                    
                    execution.logs.push({
                        step: currentStep.name,
                        status: 'rule_check',
                        rule: rule.condition,
                        result: conditionMet ? 'matched' : 'not matched',
                        timestamp: new Date().toISOString()
                    });
                    
                    if (conditionMet) {
                        // Check if this rule leads to rejection
                        if (rule.next_step === 'REJECT' || rule.next_step === 'reject' || rule.next_step === 'Reject') {
                            shouldReject = true;
                            rejectReason = rule.condition;
                            execution.logs.push({
                                step: currentStep.name,
                                status: 'rejected',
                                rule: rule.condition,
                                message: `Workflow rejected due to: ${rule.condition}`,
                                timestamp: new Date().toISOString()
                            });
                            break;
                        }
                        
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
        }
        
        if (shouldReject) {
            execution.status = 'rejected';
            execution.ended_at = new Date().toISOString();
            execution.logs.push({
                step: 'workflow',
                status: 'rejected',
                message: `Workflow rejected: ${rejectReason}`,
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        if (!nextStepFound) {
            execution.logs.push({
                step: currentStep.name,
                status: 'completed',
                message: `Step ${currentStep.name} completed`,
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
        message: 'Workflow execution completed successfully',
        timestamp: new Date().toISOString()
    });
}

function evaluateCondition(condition, input) {
    if (!condition || condition === 'DEFAULT') return true;
    
    // Handle complex conditions with AND/OR
    if (condition.includes('&&')) {
        const parts = condition.split('&&').map(c => c.trim());
        return parts.every(part => evaluateSingleCondition(part, input));
    }
    
    if (condition.includes('||')) {
        const parts = condition.split('||').map(c => c.trim());
        return parts.some(part => evaluateSingleCondition(part, input));
    }
    
    return evaluateSingleCondition(condition, input);
}

function evaluateSingleCondition(condition, input) {
    const parts = condition.split(' ');
    if (parts.length === 3) {
        const field = parts[0];
        const operator = parts[1];
        let value = parts[2];
        
        const fieldValue = input[field];
        
        // Handle string values with quotes
        if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
        }
        
        switch(operator) {
            case '>': return parseFloat(fieldValue) > parseFloat(value);
            case '<': return parseFloat(fieldValue) < parseFloat(value);
            case '>=': return parseFloat(fieldValue) >= parseFloat(value);
            case '<=': return parseFloat(fieldValue) <= parseFloat(value);
            case '==': return fieldValue == value;
            case '!=': return fieldValue != value;
            default: return false;
        }
    }
    
    return false;
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 APIs ready:`);
    console.log(`   POST   /api/workflows`);
    console.log(`   GET    /api/workflows`);
    console.log(`   GET    /api/workflows/:id`);
    console.log(`   PUT    /api/workflows/:id`);
    console.log(`   DELETE /api/workflows/:id`);
    console.log(`   POST   /api/workflows/:id/execute`);
    console.log(`   GET    /api/executions/:id`);
});