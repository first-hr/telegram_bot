
const google = require('googleapis');
const sheets = google.sheets('v4');
const spreadsheetId = '1VwHhX93tJgyYACKobhvkam2E5Bv0fm1PKj9qKE-6i7A';

module.exports = {

    addRow: (auth, row) => {
        return new Promise(resolve => {
            sheets.spreadsheets.values.append({
                auth,
                spreadsheetId,
                range: 'A:B',
                insertDataOption: 'INSERT_ROWS',
                valueInputOption: 'RAW',
                resource: {
                    values: [row]
                }
            }, (err, response) => {
                if (err) throw err;
                resolve(response)
            });
        })
    },

    getRows: (auth, date) => {
        return new Promise((resolve, reject) => {
            sheets.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: 'A:B',
            }, (err, response) => {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return reject(err);
                }
                const rows = response.values;
                const array = [];
                for (let i = 1; i < rows.length; i++) {
                    let row = rows[i];
                    if (date === row[0]) {
                        array.push(row);
                    }
                }
                return resolve(array)
            });
        });
    }
};