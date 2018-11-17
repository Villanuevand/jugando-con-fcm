const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotifications = functions.database.ref('/notifications/{notificationId}').onWrite((change, context) => {

  const rawData = change.after.val();
  const notificationID = context.params.notificationId;
  if (change.before.exists()) { return null;}
  if (!change.after.exists()) { return null;}
  const payload = {
    notification: {
      title: `Nuevo mensaje de: ${rawData.user}!`,
      body: rawData.message,
      icon: rawData.photoURL,
      click_action: 'https://jugando-con-fcm.firebaseapp.com'
    }
  };


  // Clean invalid tokens
  function cleanInvalidTokens(tokensWithKey, results) {
    const invalidTokens = [];

    results.forEach((result, i) => {
      if ( !result.error ) return;
      console.error('Failure sending notification to', tokensWithKey[i].token, result.error);

      switch(result.error.code) {
        case "messaging/invalid-registration-token":
        case "messaging/registration-token-not-registered":
          invalidTokens.push( admin.database().ref('/tokens').child(tokensWithKey[i].key).remove() );
          break;
        default:
          break;
      }
    });

    return Promise.all(invalidTokens);
  }


  return admin.database().ref('/tokens').once('value').then((data) => {
    if ( !data.val() ) return;

    const snapshot = data.val();
    const tokensWithKey = [];
    const tokens = [];

    for (let key in snapshot) {
      tokens.push( snapshot[key].token );
      tokensWithKey.push({
        token: snapshot[key].token,
        key: key
      });
    }

    return admin.messaging().sendToDevice(tokens, payload)
      .then((response) => cleanInvalidTokens(tokensWithKey, response.results))
      .then(() => admin.database().ref('/notifications').child(notificationID).remove())
  });


});
