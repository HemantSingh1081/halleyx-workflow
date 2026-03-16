import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  addEdge,
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

// Beautiful Custom Node
const CustomNode = ({ data, isConnectable }) => {
  // Different colors for different node types
  const getNodeStyle = () => {
    switch(data.type) {
      case 'task':
        return {
          bg: '#e3f2fd',
          border: '#2196f3',
          icon: '⚙️',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };
      case 'approval':
        return {
          bg: '#fff3e0',
          border: '#ff9800',
          icon: '✓',
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        };
      case 'notification':
        return {
          bg: '#e8f5e9',
          border: '#4caf50',
          icon: '🔔',
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        };
      default:
        return {
          bg: '#f5f5f5',
          border: '#9e9e9e',
          icon: '📦',
          gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        };
    }
  };

  const style = getNodeStyle();

  return (
    <div className="custom-node-wrapper">
      {/* Top Handle (input) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border, width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      
      <div 
        className="custom-node"
        style={{
          background: style.gradient,
          borderColor: style.border,
        }}
      >
        <div className="node-icon">{style.icon}</div>
        <div className="node-content">
          <div className="node-type">{data.type}</div>
          <div className="node-label">{data.label}</div>
          {data.description && (
            <div className="node-description">{data.description}</div>
          )}
        </div>
      </div>

      {/* Bottom Handle (output) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border, width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

// Edge with label
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const edgePath = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
  
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          stroke: '#ff6b6b',
          strokeWidth: 3,
          strokeDasharray: data?.condition === 'DEFAULT' ? '0' : '5,5',
        }}
        markerEnd={markerEnd}
      />
      {data?.condition && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12, fill: '#333' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.condition}
          </textPath>
        </text>
      )}
    </>
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

const nodeTypes = {
  custom: CustomNode,
};

function WorkflowCanvas({ steps, rules, onStepsChange, onRulesChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Convert steps to beautiful nodes
  useEffect(() => {
    const newNodes = steps.map((step, index) => ({
      id: step.id,
      type: 'custom',
      position: { 
        x: 250 + (index % 2) * 300, 
        y: Math.floor(index / 2) * 180 + 50 
      },
      data: { 
        label: step.name, 
        type: step.type || 'task',
        description: step.description || ''
      },
    }));
    
    setNodes(newNodes);
  }, [steps]);

  // Convert rules to beautiful edges
  useEffect(() => {
    const newEdges = rules.map((rule, index) => {
      const targetStep = steps.find(s => s.name === rule.next_step);
      if (!targetStep) return null;
      
      return {
        id: `edge-${index}-${Date.now()}`,
        source: rule.step_id,
        target: targetStep.id,
        type: 'custom',
        animated: true,
        data: { condition: rule.condition },
        style: { stroke: '#ff6b6b', strokeWidth: 2 },
      };
    }).filter(edge => edge !== null);
    
    setEdges(newEdges);
  }, [rules, steps]);

  const onConnect = useCallback(
    (params) => {
      const sourceStep = steps.find(s => s.id === params.source);
      const targetStep = steps.find(s => s.id === params.target);
      
      if (sourceStep && targetStep) {
        const condition = prompt('Enter condition (e.g., amount > 1000) or "DEFAULT":', 'DEFAULT');
        if (condition === null) return;
        
        const newRule = {
          id: Date.now().toString(),
          step_id: params.source,
          condition: condition || 'DEFAULT',
          next_step: targetStep.name,
        };
        
        onRulesChange([...rules, newRule]);
      }
    },
    [steps, rules, onRulesChange]
  );

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const onNodesDelete = (deleted) => {
    const deletedIds = deleted.map(n => n.id);
    const newSteps = steps.filter(s => !deletedIds.includes(s.id));
    onStepsChange(newSteps);
    
    const newRules = rules.filter(r => !deletedIds.includes(r.step_id));
    onRulesChange(newRules);
  };

  const addNewStep = () => {
    const stepName = prompt('Enter step name:');
    if (!stepName) return;
    
    const stepType = prompt('Enter step type (task/approval/notification):', 'task');
    
    const newStep = {
      id: `node-${Date.now()}-${Math.random()}`,
      name: stepName,
      type: stepType || 'task',
    };
    
    onStepsChange([...steps, newStep]);
  };

  const saveLayout = () => {
    alert('Layout saved! You can now execute the workflow.');
  };

  return (
    <div style={{ height: 600, border: '1px solid #e0e0e0', borderRadius: 12, background: '#fafafa' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Background color="#aaa" gap={16} />
        
        <Controls 
          style={{
            bottom: 10,
            right: 10,
            left: 'auto',
            top: 'auto',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        />
        
        <MiniMap 
          style={{
            height: 120,
            width: 200,
            bottom: 10,
            left: 10,
            borderRadius: 8,
          }}
          nodeColor={(node) => {
            switch(node.data?.type) {
              case 'task': return '#2196f3';
              case 'approval': return '#ff9800';
              case 'notification': return '#4caf50';
              default: return '#9e9e9e';
            }
          }}
        />
        
        <Panel position="top-left" style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={addNewStep}
            className="canvas-btn primary"
          >
            ➕ Add Step
          </button>
          <button 
            onClick={saveLayout}
            className="canvas-btn success"
          >
            Save Layout
          </button>
        </Panel>
        
        {selectedNode && (
          <Panel position="top-right">
            <div className="node-editor">
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
                 Edit Step
              </h4>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const newSteps = steps.map(s => 
                      s.id === selectedNode.id 
                        ? { ...s, name: e.target.value }
                        : s
                    );
                    onStepsChange(newSteps);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Type:</label>
                <select
                  value={selectedNode.data.type}
                  onChange={(e) => {
                    const newSteps = steps.map(s => 
                      s.id === selectedNode.id 
                        ? { ...s, type: e.target.value }
                        : s
                    );
                    onStepsChange(newSteps);
                  }}
                >
                  <option value="task">Task</option>
                  <option value="approval">Approval</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export default WorkflowCanvas;