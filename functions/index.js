const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotifications = functions.database.ref('/notifications/{notificationId}').onWrite((change, context) => {

  const notificationID = context.params.notificationId;
  if (change.before.exists()) {
    return null;
  }

  if (!change.after.exists()) {
    return null;
  }
  // Setup notification
  const rawData = change.after.val();
  console.log('rawData, ',rawData);

  const payload = {
    notification: {
      title: `New Message from ${rawData.user}!`,
      body: rawData.message,
      icon: rawData.photoURL,
      click_action: 'https://jugando-con-fcm.firebaseapp.com'
    }
  };

  console.log('payload', payload);

  // Clean invalid tokens
  function cleanInvalidTokens(tokensWithKey, results) {
    console.log('tokensWithKey',tokensWithKey);
    console.log('results',results);

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
    console.log('/token on value', data);
    if ( !data.val() ) return;

    const snapshot = data.val();
    console.log('/token on value  - snapshot', snapshot);
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
