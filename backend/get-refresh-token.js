const { google } = require('googleapis');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Universal Playground redirect

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://mail.google.com/'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('🚀 GMAIL API AUTHORIZATION 🚀');
console.log('---------------------------');
console.log('Step 1: Open this URL in your browser and authorize the app:');
console.log('\n' + authUrl + '\n');
console.log('Step 2: Copy the "Authorization Code" from the browser address bar');
console.log('   (It looks like: 4/0AfgeXvw...)');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nStep 3: Enter the Authorization Code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ SUCCESS! Copy this REFRESH TOKEN to your .env file:');
    console.log('---------------------------');
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('---------------------------');
    console.log('\n(Note: If you already had one, this one will replace it)');
    rl.close();
  } catch (error) {
    console.error('❌ Error retrieving access token:', error.message);
    rl.close();
  }
});
