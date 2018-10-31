const firebaseUiContainer = document.getElementById('firebaseui-auth-container');
const messagingContainer = document.getElementById('messaging-container');
const userName = document.getElementById('userName');
const logOut = document.getElementById('logOut');


const ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.disableAutoSignIn();

function getUIConfig () {
  return {
    'callbacks': {
      'signInSuccessWithAuthResult': function(authResult) {
        logInSuccess(authResult);
      },
      'signInFailure': function(error) {
        return handleUIError(error);
      },
      'uiShown': function() {
        document.getElementById('loading').style.display = 'none';
      }
    },
    'signInOptions': [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
  };
}

firebase.auth().onAuthStateChanged(function(user) {
  //document.getElementById('loading').style.display = 'none';
  user ? logInSuccess(user) : logOutSuccess();
});


function logInSuccess (user) {
  console.log('Login auth result', user);
  firebaseUiContainer.style.display = 'none';
  messagingContainer.style.display = 'block';
  userName.textContent = user.displayName;
}

function logOutSuccess () {
  userName.innerHTML = ', desconocido';
  firebaseUiContainer.style.display = 'block';
  messagingContainer.style.display = 'none';
  userName.innerHTML = 'desconocido';
  ui.start('#firebaseui-auth-container', getUIConfig());
}



const initApp  = function () {
  logOut.addEventListener('click', function () {
    firebase.auth().signOut().then(function() {
      logOutSuccess();
    }).catch(function(error) {
      console.log('no cerro, algo paso', error)
    });
  });
};

window.addEventListener('load', initApp);
