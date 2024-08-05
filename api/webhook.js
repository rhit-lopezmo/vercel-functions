// api/webhook.js
const express = require('express');
const { google } = require('googleapis');
const app = express();

app.use(express.json());

app.post('/webhook', async (req, res) => {
  try {
    // Extract data from the request
    const data = req.body;

    const playerFirstName = "";
    const playerLastName = "";
    const email = "";
    const teamTryingOutFor = "";
    
    // date formatting
    const date = new Date();
    const mm = date.getMonth() + 1;
    const dd = date.getDate();
    const yyyy = date.getFullYear();

    // Add leading zero if the day is less than 10
    if (dd < 10) {
        dd = '0' + dd;
    } 

    // Add leading zero if the month is less than 10
    if (mm < 10) {
        mm = '0' + mm;
    } 

    today = mm + '-' + dd + '-' + yyyy;

    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ID of the Google Sheet and the range where data will be written
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'Sheet1!A1:E1';

    // Prepare the data to write
    const values = [[
      date,
      playerFirstName,
      playerLastName,
      email,
      teamTryingOutFor,
    ]];

    // Write data to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;