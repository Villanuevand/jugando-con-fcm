const firebaseUiContainer = document.getElementById('firebaseui-auth-container');
const messagingContainer = document.getElementById('messaging-container');
const userName = document.getElementById('userName');
const logOut = document.getElementById('logOut');

document.addEventListener('DOMContentLoaded', function() {
  initFirebaseUI();
});


function initFirebaseUI () {
  const uiConfig = {
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function(authResult) {
        logInSuccess(authResult);
      },
      signInFailure: function(error) {
        return handleUIError(error);
      },
      uiShown: function() {
        document.getElementById('loading').style.display = 'none';
      }
    }

  };
  const ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start('#firebaseui-auth-container', uiConfig);
}

function logInSuccess (authResult) {
  firebaseUiContainer.style.display = 'none';
  userName.innerHTML = `, ${ authResult.user.displayName}`;
  messagingContainer.style.display = 'block';
  console.log('Login auth result', authResult);
  return true;
}

function logOutSuccess (authResult) {
  firebaseUiContainer.style.display = 'block';
  userName.innerHTML = ', desconocido';
  messagingContainer.style.display = 'none';
  console.log('Logout auth result', authResult);
  return false;
}

logOut.addEventListener('click', function () {
  firebase.auth().signOut().then(function() {
    logOutSuccess();
  }).catch(function(error) {
    console.log('no cerro, algo paso', error)
  });
})
