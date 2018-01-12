const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
require('dotenv').config();

const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = `${TOKEN_DIR}sheets.googleapis.com-firsthr.json`;

// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }

    // Authorize a client with the loaded credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), addData);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize(credentials, callback) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const auth = new googleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getNewToken(oauth2Client, callback);
        }

        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */

console.log(process.env);

function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: process.env.SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', code => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }

            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if ('EEXIST' !== err.code) {
            throw err;
        }
    }

    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

function addData(auth) {
    const sheets = google.sheets('v4');
    sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: '1VwHhX93tJgyYACKobhvkam2E5Bv0fm1PKj9qKE-6i7A',
        range: 'A:C',
        insertDataOption: 'INSERT_ROWS',
        valueInputOption: 'RAW',
        resource: {
            values: [
                [
                    'ewfew', 'ewfwewe', '26'
                ]
            ]
        }
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(response);
    });
}