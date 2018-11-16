const userName = document.getElementById('userName');
const logOut = document.getElementById('logOut');
const sendMessage = document.getElementById('send');
// ID de Usuario Actual
let currentUid = null;

// Inicializacion de Firebase.ui
const ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.disableAutoSignIn();

/**
 * @name getUIConfig
 * @description Retorna un objeto para la configuración de FirebaseUI
 * @return {{callbacks: {uiShown: callbacks.uiShown}, signInOptions: (string)[]}}
 */
function getUIConfig () {
  return {
    'callbacks': {
      'uiShown': () =>  {
        toggleElements('loading', 'none');
      }
    },
    'signInOptions': [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
  };
}

/**
 * @name signInUI
 * @description Muestra elementos en el DOM al autenticar
 * @param {firebase.User} - user
 */
function signInUI (user) {
  toggleElements('firebaseui-auth-container', 'none');
  toggleElements('messaging-container', 'block');
  toggleElements('error-container','none');
  userName.textContent = user.displayName;
  firebase.database().ref(`users/${user.uid}`).update({
    displayName: user.displayName,
    photoURL: user.photoURL
  });
  // Almancenando el ID del usuario actual
  currentUid = user.uid;
}

/**
 * @name signOutUI
 * @description hace cambios en elementos del DOM al finalizar sesión
 */
function signOutUI () {
  userName.textContent = 'desconocido';
  toggleElements('firebaseui-auth-container', 'block');
  toggleElements('messaging-container', 'none');
  ui.start('#firebaseui-auth-container', getUIConfig());
  // Limpiando el ID del usuario actual
  currentUid = null;
}

/**
 * @name requestPermission
 * @description Solicita permisos para mostrar las notificaciones
 */
function requestPermission () {
  firebase.messaging().requestPermission()
    .then(() => getUserToken())
    .then(() => signInUI(arguments[0]))
    .catch(() => {
      signOut();
      toggleElements('error-container','block');
      document.getElementById('error-container')
        .textContent = 'Para continuar debes aceptar las notificaciones 😕';
    });
}

/**
 * @name signOut
 * @description Ejecuta la función para desuscribir las notificaciones
 */
function signOut() {
  unsubscribeNotifications();
}

/**
 * @name unsubscribeNotifications
 * @description Borrar tokens de la base de datos
 * @return {Q.Promise<T | never> | Q.IPromise<T | never> | a | * | PromiseLike<T | never> | Promise<T | never>}
 */
function unsubscribeNotifications () {
  firebase.messaging().getToken()
    .then( token => firebase.messaging().deleteToken(token))
    .then( () => firebase.database().ref('/tokens')
      .orderByChild('uid')
      .equalTo(firebase.auth().currentUser.uid)
      .once('value'))
    .then(snapshot => {
      const key = Object.keys(snapshot.val())[0];
      return firebase.database().ref('/tokens').child(key).remove();
    })
    .then(() => firebase.auth().signOut())
    .catch( error => {
      console.error('No se puedo hacer la desuscripción ☹️', error);
      firebase.auth().signOut();
    })
}

/**
 * @name getUserToken
 * @description Obtiene el token para habilirar el envio de notificaiones
 */
function getUserToken() {
  return firebase.messaging().getToken()
    .then( token => {
      firebase.database().ref('/tokens').push({
        token: token,
        uid: firebase.auth().currentUser.uid
      });
    })
    .catch( error => {
      console.error('No se puedo obtener el token ☹️', error);
    });
}

/**
 * @name toggleElements
 * @description Muestra o no elementos del DOM
 * @param {Element} - element
 * @param {String} - option
 */
function toggleElements (element, option) {
  document.getElementById(element).style.display = option;
}

/**
 * @name showNotification
 * @description muestra las notificacionas una estás lleguen a la app
 * @param {Notification} - payload
 */
function showNotification (payload) {
  console.log('payload', payload);
  if (payload.notification) {
    if (window.Notification instanceof Function) {
      new Notification(payload.notification.title, payload.notification);
    }
  }
}

/**
 * @name sendNotifications
 * @description Almacena los mensajes en la base de datos.
 * @param e
 */
function sendNotifications (e) {
  e.preventDefault();
  let message = document.getElementById('notification-message').value;
  firebase.database().ref('/notifications').push({
    user: firebase.auth().currentUser.displayName,
    photoURL: firebase.auth().currentUser.photoURL,
    message: message,
  })
    .then(() => document.getElementById('notification-message').value = '')
    .catch((error) => console.error('No se puedo guardar el mensaje de la notificacion ☹️', error))
}

const initApp  = function () {
  logOut.addEventListener('click',  signOut);
  sendMessage.addEventListener('click', sendNotifications);

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      requestPermission(user);
    } else {
      signOutUI();
    }
  });

  // Evento que detecta el refrescamiento de un Token
  firebase.messaging().onTokenRefresh(getUserToken);
  // Evento  que detecta la llegada de una nueva notificacion
  firebase.messaging().onMessage(showNotification);
};
// Ejecuta initApp, al cargar todos los recursos
window.addEventListener('load', initApp);
