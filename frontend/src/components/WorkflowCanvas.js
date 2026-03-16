import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Node Type Configuration
const NODE_CONFIG = {
  task: { icon: '', gradient: 'linear-gradient(135deg, #3498db, #2980b9)' },
  approval: { icon: '', gradient: 'linear-gradient(135deg, #f39c12, #e67e22)' },
  notification: { icon: '', gradient: 'linear-gradient(135deg, #27ae60, #229954)' },
  default: { icon: '', gradient: 'linear-gradient(135deg, #95a5a6, #7f8c8d)' }
};

// Custom Node Component
const CustomNode = ({ data, isConnectable }) => {
  const config = NODE_CONFIG[data.type] || NODE_CONFIG.default;
  
  return (
    <div className="custom-node-wrapper">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="custom-node" style={{ background: config.gradient }}>
        <div className="node-icon">{config.icon}</div>
        <div className="node-content">
          <div className="node-type">{data.type}</div>
          <div className="node-label">{data.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
};

// Custom Edge with Label
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data }) => {
  const path = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
  
  return (
    <>
      <path id={id} className="react-flow__edge-path" d={path} />
      {data?.condition && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {data.condition}
          </textPath>
        </text>
      )}
    </>
  );
};

const edgeTypes = { custom: CustomEdge };
const nodeTypes = { custom: CustomNode };

function WorkflowCanvas({ steps, rules, onStepsChange, onRulesChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Convert steps to nodes
  useEffect(() => {
    setNodes(steps.map((step, i) => ({
      id: step.id,
      type: 'custom',
      position: { x: 250 + (i % 2) * 300, y: Math.floor(i / 2) * 150 + 50 },
      data: { label: step.name, type: step.type || 'task' }
    })));
  }, [steps, setNodes]);

  // Convert rules to edges
  useEffect(() => {
    const validEdges = rules
      .map(rule => {
        const target = steps.find(s => s.name === rule.next_step);
        return target ? {
          id: `e-${rule.id}`,
          source: rule.step_id,
          target: target.id,
          type: 'custom',
          data: { condition: rule.condition }
        } : null;
      })
      .filter(Boolean);
    
    setEdges(validEdges);
  }, [rules, steps, setEdges]);

  const onConnect = useCallback((params) => {
    const source = steps.find(s => s.id === params.source);
    const target = steps.find(s => s.id === params.target);
    
    if (!source || !target) return;
    
    const condition = prompt('Condition (e.g., amount > 1000):', 'DEFAULT');
    if (!condition) return;
    
    onRulesChange([...rules, {
      id: Date.now().toString(),
      step_id: params.source,
      condition,
      next_step: target.name
    }]);
  }, [steps, rules, onRulesChange]);

  const addNewStep = () => {
    const name = prompt('Step name:');
    if (!name) return;
    
    const type = prompt('Type (task/approval/notification):', 'task') || 'task';
    
    onStepsChange([...steps, {
      id: `step-${Date.now()}`,
      name,
      type
    }]);
  };

  const updateSelectedNode = (field, value) => {
    if (!selectedNode) return;
    onStepsChange(steps.map(s => 
      s.id === selectedNode.id ? { ...s, [field]: value } : s
    ));
  };

  return (
    <div style={{ height: 600, background: '#fafafa', borderRadius: 12 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        onPaneClick={() => setSelectedNode(null)}
        onNodesDelete={(deleted) => {
          const deletedIds = deleted.map(n => n.id);
          onStepsChange(steps.filter(s => !deletedIds.includes(s.id)));
          onRulesChange(rules.filter(r => !deletedIds.includes(r.step_id)));
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={n => {
          switch(n.data?.type) {
            case 'task': return '#3498db';
            case 'approval': return '#f39c12';
            case 'notification': return '#27ae60';
            default: return '#95a5a6';
          }
        }} />
        
        <Panel position="top-left">
          <button onClick={addNewStep} className="canvas-btn primary"> Add Step</button>
        </Panel>
        
        {selectedNode && (
          <Panel position="top-right">
            <div className="node-editor">
              <h4> Edit Step</h4>
              <input
                value={selectedNode.data.label}
                onChange={e => updateSelectedNode('name', e.target.value)}
                placeholder="Name"
              />
              <select
                value={selectedNode.data.type}
                onChange={e => updateSelectedNode('type', e.target.value)}
              >
                <option value="task"> Task</option>
                <option value="approval"> Approval</option>
                <option value="notification"> Notification</option>
              </select>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export default WorkflowCanvas;