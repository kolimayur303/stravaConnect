const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3001;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const clientId = '128282';
const clientSecret = '6802a9f45e5255c68b0e4deebe6a9798bc58eb1c';

let tokens = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null
};

app.get('/exchange_token', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  if (error) {
    res.send(`Error: ${error}`);
    return;
  }
  if (!code) {
    res.send('Error: No code provided');
    return;
  }
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }
    });
    tokens.accessToken = response.data.access_token;
    tokens.refreshToken = response.data.refresh_token;
    tokens.expiresAt = response.data.expires_at;

    res.redirect(`/activities?access_token=${tokens.accessToken}`);
  } catch (error) {
    console.error('Error exchanging token:', error.response ? error.response.data : error.message);
    res.send('Error exchanging token');
  }
});

async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    });
    tokens.accessToken = response.data.access_token;
    tokens.refreshToken = response.data.refresh_token;
    tokens.expiresAt = response.data.expires_at;

    return tokens.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function ensureValidAccessToken(req, res, next) {
  if (Date.now() / 1000 > tokens.expiresAt) {
    try {
      const newAccessToken = await refreshAccessToken(tokens.refreshToken);
      req.accessToken = newAccessToken;
    } catch (error) {
      return res.status(401).send('Failed to refresh access token');
    }
  } else {
    req.accessToken = tokens.accessToken;
  }
  next();
}

app.get('/activities', ensureValidAccessToken, async (req, res) => {
  const accessToken = req.accessToken;
  try {
    const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const activities = activitiesResponse.data;
    res.render('activities', { activities, accessToken });
  } catch (error) {
    console.error('Error fetching activities:', error.response ? error.response.data : error.message);
    res.send('Error fetching activities');
  }
});

app.post('/create_activity', ensureValidAccessToken, async (req, res) => {
  const { name, type, start_date_local, elapsed_time, description } = req.body;
  const accessToken = req.accessToken;
  try {
    console.log('Creating activity with data:', { name, type, start_date_local, elapsed_time, description });
    const response = await axios.post('https://www.strava.com/api/v3/activities', {
      name,
      type,
      start_date_local,
      elapsed_time,
      description,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    res.redirect(`/activities?access_token=${accessToken}`);
  } catch (error) {
    console.error('Error creating activity:', error.response ? error.response.data : error.message);
    res.send('Error creating activity');
  }
});

app.post('/edit_activity', ensureValidAccessToken, async (req, res) => {
  const { activityId, name, description } = req.body;
  const accessToken = req.accessToken;
  try {
    await axios.put(`https://www.strava.com/api/v3/activities/${activityId}`, {
      name: name,
      description: description
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    res.redirect(`/activities?access_token=${accessToken}`);
  } catch (error) {
    console.error('Error editing activity:', error.response ? error.response.data : error.message);
    res.send('Error editing activity');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});