// src/components/SimpleApiTest.jsx
import React, { useState } from 'react';
import useSimpleTestStore from '../stores/apiTestStore';

const SimpleApiTest = () => {
  const { 
    pingResponse, 
    echoResponse, 
    loading, 
    error, 
    testPing, 
    testEcho, 
    clearAll 
  } = useSimpleTestStore();

  const [customMessage, setCustomMessage] = useState('Hello from frontend!');

  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: '#6200ea',
      color: 'white',
      padding: '20px',
      borderRadius: '10px 10px 0 0',
      marginBottom: '20px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'all 0.3s'
    },
    pingButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    echoButton: {
      backgroundColor: '#2196F3',
      color: 'white',
    },
    clearButton: {
      backgroundColor: '#f44336',
      color: 'white',
    },
    card: {
      backgroundColor: '#f5f5f5',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #ddd'
    },
    responseBox: {
      backgroundColor: '#1e1e1e',
      color: '#00ff00',
      padding: '15px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '14px',
      overflow: 'auto',
      maxHeight: '200px'
    },
    input: {
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '16px',
      flex: 1,
      marginRight: '10px'
    },
    status: {
      padding: '10px',
      borderRadius: '5px',
      marginBottom: '20px'
    },
    success: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    error: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    info: {
      backgroundColor: '#d1ecf1',
      color: '#0c5460',
      border: '1px solid #bee5eb'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🧪 Simple API Test</h1>
        <p>Testing /ping (GET) and /echo (POST) endpoints</p>
        <p>Backend URL: http://localhost:3000/api/test</p>
      </div>

      {/* Status messages */}
      {loading && (
        <div style={{...styles.status, ...styles.info}}>
          ⏳ Sending request to backend...
        </div>
      )}
      
      {error && (
        <div style={{...styles.status, ...styles.error}}>
          ❌ Error: {error}
        </div>
      )}

      {/* Test buttons */}
      <div style={styles.buttonContainer}>
        <button 
          onClick={testPing}
          style={{...styles.button, ...styles.pingButton}}
          disabled={loading}
        >
          🏓 Test GET /ping
        </button>

        <button 
          onClick={() => testEcho(customMessage)}
          style={{...styles.button, ...styles.echoButton}}
          disabled={loading}
        >
          🔊 Test POST /echo
        </button>

        <button 
          onClick={clearAll}
          style={{...styles.button, ...styles.clearButton}}
        >
          🧹 Clear All
        </button>
      </div>

      {/* Custom message input for echo */}
      <div style={styles.card}>
        <h3>Custom Echo Message</h3>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter message to echo"
            style={styles.input}
          />
          <button 
            onClick={() => testEcho(customMessage)}
            style={{...styles.button, ...styles.echoButton, padding: '10px 20px'}}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>

      {/* Results display */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Ping Result */}
        {pingResponse && (
          <div style={styles.card}>
            <h3>🏓 GET /ping Response</h3>
            <div style={styles.responseBox}>
              <pre>{JSON.stringify(pingResponse, null, 2)}</pre>
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              ✓ Backend says: "{pingResponse.message}"
            </p>
          </div>
        )}

        {/* Echo Result */}
        {echoResponse && (
          <div style={styles.card}>
            <h3>🔊 POST /echo Response</h3>
            <div style={styles.responseBox}>
              <pre>{JSON.stringify(echoResponse, null, 2)}</pre>
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              ✓ Backend echoed your message back
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={styles.card}>
        <h3>📋 Instructions</h3>
        <ol>
          <li>Make sure your backend is running on port 3000</li>
          <li>Open browser console (F12) to see detailed logs</li>
          <li>Click "Test GET /ping" - should see "test succeeded"</li>
          <li>Click "Test POST /echo" - sends your message and gets it back</li>
          <li>Check console for request/response details</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleApiTest;