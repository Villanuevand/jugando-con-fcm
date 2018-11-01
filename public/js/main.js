const userName = document.getElementById('userName');
const logOut = document.getElementById('logOut');


const ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.disableAutoSignIn();

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

firebase.auth().onAuthStateChanged((user) => {
  user ? subscribeToNotifications(user) : userLogOut();
});


function userLogIn (user) {
  toggleElements('firebaseui-auth-container', 'none');
  toggleElements('messaging-container', 'block');
  toggleElements('error-container','none');
  userName.textContent = user.displayName;
}

function userLogOut () {
  userName.textContent = 'desconocido';
  toggleElements('firebaseui-auth-container', 'block');
  toggleElements('messaging-container', 'none');
  ui.start('#firebaseui-auth-container', getUIConfig());
  signOut();
}

function subscribeToNotifications (user) {
  firebase.messaging().requestPermission()
    .then(() =>  userLogIn(user))
    .catch(() => {
      userLogOut();
      toggleElements('error-container','block');
      document.getElementById('error-container')
        .textContent = 'Para continuar debes aceptar las notificaciones 😕';
    });
}

function  signOut() {
  firebase.auth().signOut();
}

function toggleElements (element, option) {
  document.getElementById(element).style.display = option;
}

const initApp  = function () {
  logOut.addEventListener('click', function () {
    firebase.auth().signOut()
      .then(() => userLogOut())
      .catch(() => console.log('no cerro, algo paso', error));
  });
};

window.addEventListener('load', initApp);
