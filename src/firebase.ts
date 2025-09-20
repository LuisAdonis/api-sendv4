import admin from 'firebase-admin';

var serviceAccount = require("./config/clouds-send-firebase-adminsdk-9mdg4-df1b160faa.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://clouds-send-default-rtdb.firebaseio.com"
});

export const auth = admin.auth();
