const userName = document.getElementById('userName');
const logOut = document.getElementById('logOut');
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
  getUserToken()
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
    .then(() => getUserToken() )
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
  firebase.auth().signOut();
}

/**
 *
 * @return {Q.Promise<T | never> | Q.IPromise<T | never> | a | * | PromiseLike<T | never> | Promise<T | never>}
 */
function unsubscribeNotifications () {
  return firebase.database().ref(`users/${currentUid}`).remove();
}

/**
 * @name getUserToken
 * @description
 */
function getUserToken() {
  firebase.messaging().getToken()
    .then( currentToken => {
      if (currentToken) {
        firebase.database().ref(`users/${currentUid}/notificationsTokens/${currentToken}`).set(true)
      } else {
        requestPermission();
      }
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

const initApp  = function () {
  logOut.addEventListener('click',  signOut);
  firebase.auth().onAuthStateChanged((user) => {
    if (user && currentUid === user.uid) {
      return;
    }
    if (user) {
      signInUI(user);
    } else {
      signOutUI();
    }
  });
};
// Ejecuta initApp, al cargar todos los recursos
window.addEventListener('load', initApp);
