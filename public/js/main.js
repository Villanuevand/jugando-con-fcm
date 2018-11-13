const userName = document.getElementById('userName');
const logOut = document.getElementById('logOut');
const sendMessage = document.getElementById('send');
// ID de Usuario Actual
let currentUid = null;


const ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.disableAutoSignIn();

/**
 * @name
 * @description
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
 * @description
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
 * @description
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
 * @description
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
 * @description
 */
function signOut() {
  unsubscribeNotifications();
}

/**
 *
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
      console.log('snapshopp',snapshot);
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
 * @description
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
 *
 * @param {Element} - element
 * @param {String} - option
 */
function toggleElements (element, option) {
  document.getElementById(element).style.display = option;
}

function sendNotifications (e) {
  e.preventDefault();
  let message = document.getElementById('notification-message').value;
  firebase.database().ref('/notifications').push({
    user: firebase.auth().currentUser.displayName,
    photoURL: firebase.auth().currentUser.photoURL,
    message: message,
  })
    .then(() => document.getElementById('notification-message').value = '')
    .catch((error) => console.error('No se puedo enviar la notificacion ☹️', error))
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

  firebase.messaging().onTokenRefresh(getUserToken);
  firebase.messaging().onMessage( (payload) => {
      console.log('Paylaod', payload);
  })
};
// Ejecuta initApp, al cargar todos los recursos
window.addEventListener('load', initApp);
