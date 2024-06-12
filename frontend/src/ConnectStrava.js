import React from 'react';

const ConnectStrava = () => {
  const clientId = '128282';
  const redirectUri = 'http://localhost:3001/exchange_token';

  const connectToStrava = () => {
    const scopes = 'activity:read_all,activity:write,read_all';
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&approval_prompt=force`;
  };

  return (
    <div>
      <button onClick={connectToStrava}>Connect to Strava</button>
    </div>
  );
};

export default ConnectStrava;


