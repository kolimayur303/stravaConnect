import React from 'react';
import './App.css';
import ConnectStrava from './ConnectStrava';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Strava Activity Sync</h1>
        <ConnectStrava />
      </header>
    </div>
  );
}

export default App;
