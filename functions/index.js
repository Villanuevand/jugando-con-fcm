const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Send Notifications, se disparará cuando se escriba en /notifications/{notificationId}
exports.sendNotifications = functions.database.ref('/notifications/{notificationId}').onWrite((change, context) => {

  // Obteniendo los datos que están siendo escritos
  const rawData = change.after.val();
  // ID de notificación
  const notificationID = context.params.notificationId;
  // Verifica si existe datos antes del evento
  if (change.before.exists()) { return null;}
  // Si no existen datos despues de la realizacion del evento
  if (!change.after.exists()) { return null;}

  // Construcción de la notificacion
  const payload = {
    notification: {
      title: `Nuevo mensaje de: ${rawData.user}!`,
      body: rawData.message,
      icon: rawData.photoURL,
      click_action: 'https://jugando-con-fcm.firebaseapp.com'
    }
  };


  // Invalidación de TOkens
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

// Obteniendo todos los tokens para hacer el envio de las notificaciones
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
  // Enviando las notificaciones a todos los dispositivos
    return admin.messaging().sendToDevice(tokens, payload)
      .then((response) => cleanInvalidTokens(tokensWithKey, response.results))
      .then(() => admin.database().ref('/notifications').child(notificationID).remove())
  });


});
