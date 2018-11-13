importScripts('/__/firebase/5.5.6/firebase-app.js');
importScripts('/__/firebase/5.5.6/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('mensahe bacjground', payload);

  var notificationTitle = 'Background mensaje de fondo';
  var notificationOptions = {
    body: 'Mensaje de prueba.',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
