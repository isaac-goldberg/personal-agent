import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

// Scopes control the level of access your app has to a user's account.
// The `calendar.events` scope allows read and write access to calendar events.
// This is required to create new events.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events', "https://www.googleapis.com/auth/calendar"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
// The credentials.json file downloaded from the Google Cloud Console.
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

var AUTH = null;

/**
 * Reads a token from the `token.json` file.
 * @return {Promise<Object>} The token object from the file.
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes the token to the `token.json` file.
 * @param {Object} client The authenticated OAuth2 client.
 * @return {Promise<void>} A promise that resolves when the token is saved.
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Gets an authenticated OAuth2 client.
 * @return {Promise<google.auth.OAuth2>} An authorized OAuth2 client.
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

authorize().then(auth => {
    AUTH = auth;
}).catch(console.error);

export default {
    createCalenderEvent: async function (summary, location, startTime, endTime) {
        const calendar = google.calendar({ version: 'v3', auth: AUTH });

        const event = {
            'summary': summary,
            'location': location,
            "colorId": "2",
            'start': {
                'dateTime': startTime, 
                'timeZone': 'America/Los_Angeles',
            },
            'end': {
                'dateTime': endTime,
                'timeZone': 'America/Los_Angeles',
            },
        };

        try {
            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });
            console.log('Event created:', response.data.htmlLink);
        } catch (err) {
            console.error('There was an error contacting the Calendar service:', err);
            return;
        }
    }
}
