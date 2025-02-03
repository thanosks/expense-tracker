firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const firestore = firebase.firestore();

var uid;
var docRef;
var uidRef;
var displayName;

function getID() {
  var user = firebase.auth().currentUser;
  if (user) {
    console.log("UID ", user.uid);

    return user.uid;
  }
  else {
    return;
  }
}

// Show the page
function showPage() {
  document.getElementById("loading").style.display = "none";
}

document.getElementById("name").addEventListener("submit", function(event) {
  event.preventDefault();

  const input = document.getElementById("newName");
  var newDisplayName = input.value;
  
  var user = firebase.auth().currentUser;

  user.updateProfile({
    displayName: newDisplayName
  }).then(function() {
    location.reload();
  }).catch(function(error) {
    console.error("Error updating profile: ", error);
  });
});

document.getElementById("email").addEventListener("submit", function(event) {
  event.preventDefault();

  var user = firebase.auth().currentUser;

  const emailElement = document.getElementById('userEmail').textContent;

  const password = document.getElementById('email-password').value;
  const credential = firebase.auth.EmailAuthProvider.credential(
    emailElement, 
    password
  );

  console.log(credential);
  user.reauthenticateWithCredential(credential).then(() => {
    console.log("User re-authenticated");
    alert("Due to firebase internal error the email cant be changed sorry :(\nI made the UI tho!");

      const newEmail = document.getElementById('newEmail').textContent;
      /*
      user.verifyBeforeUpdateEmail(newEmail).then(() => {
        console.log("Email sent successfully");
        alert("Verify the new email and log back in");
      }).catch((error) => {
          console.error("Error updating email: ", error);
      });
      */
  }).catch((error) => {
    console.log("User didnt re-authenticate:",error);
  });
});

function reset_password() {
  var emailElement = document.getElementById('userEmail').textContent;

  firebase.auth().sendPasswordResetEmail(emailElement)
  .then(() => {
    console.log("Email Sent");
    alert("Email Sent");
  })
  .catch((error) => {
    console.error("Error Sending Email: ", error);
  });
}

document.getElementById("del-account").addEventListener("submit", function(event) {
  event.preventDefault();
  const emailElement = document.getElementById('userEmail').textContent;

  const password = document.getElementById('acc-password').value;
  const credential = firebase.auth.EmailAuthProvider.credential(
    emailElement, 
    password
  );

  var user = firebase.auth().currentUser;

  user.reauthenticateWithCredential(credential).then(() => {
    console.log("User re-authenticated");

    docRef.delete().then(() => {
      console.log("Document successfully deleted!");
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });

    uidRef.remove().then(() => {
      console.log("Database successfully deleted!");
    }).catch((error) => {
        console.error("Error deleting database: ", error);
    });

    user.delete().then(() => {
      console.log("User Deleted");
      window.location.href = 'login.html'; // Redirect to login page
    }).catch((error) => {
      console.error("Error deleting user: ", error);      
    });

  }).catch((error) => {
    console.log("User didnt re-authenticate:",error);
  });
});

function googleAccountDel() {
  var user = firebase.auth().currentUser;
  var provider = new firebase.auth.GoogleAuthProvider();

  user.reauthenticateWithPopup(provider)
  .then(() => {
    console.log("User successfully re-authenticated");

    docRef.delete().then(() => {
      console.log("Document successfully deleted!");
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });

    uidRef.remove().then(() => {
      console.log("Database successfully deleted!");
    }).catch((error) => {
        console.error("Error deleting database: ", error);
    });

    user.delete().then(() => {
      console.log("User Deleted");
      window.location.href = 'login.html'; // Redirect to login page
    }).catch((error) => {
      console.error("Error deleting user: ", error);      
    });
  })
  .catch((error) => {
    console.error("Error during re-authentication or user deletion:", error);
  });
}

// Function to toggle the settings visibility
function toggle(id) {
  // Get all the popups by their IDs
  const popupIds = ["name", "email", "del-account"];
  
  // Loop through each popup
  popupIds.forEach(popupId => {
    const popup = document.getElementById(popupId);

    if (popupId === id) {
      // Toggle the display for the specified popup
      popup.style.display = (popup.style.display === "block") ? "none" : "block";
    } else {
      // Ensure all other popups are closed
      popup.style.display = "none";
    }
  });
}

function show_password(password) {
  var x = document.getElementById(password);

  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}

function x_btn(element) {
  const parent = element.parentNode;

  parent.style.display = "none";
}



window.addEventListener("DOMContentLoaded", function() {
  if (window.innerWidth <= 768) {
    var nameElement = document.getElementById('name-btn');
    nameElement.innerHTML = '<i class="fa fa-edit" style="color:lighgrey;"></i>'
    var emailElement = document.getElementById('email-btn');
    emailElement.innerHTML = '<i class="fa fa-edit" style="color:lighgrey;"></i>'
  }
  else {
    var nameElement = document.getElementById('name-btn');
    nameElement.innerHTML = 'Edit Name'
    var emailElement = document.getElementById('email-btn');
    emailElement.innerHTML = 'Edit Email'
  }

  // Check if user is logged in before calling functions
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      uid = getID();
      docRef = firestore.collection("settings").doc(uid);
      uidRef = database.ref('users/' + uid);

      var usernameElement = document.getElementById('userName');
      displayName = user.displayName ? user.displayName : "???"; // Fallback if no displayName is set
      usernameElement.textContent = displayName;

      var emailElement = document.getElementById('userEmail');
      accountEmail = user.email ? user.email : "???"; // Fallback if no displayName is set
      emailElement.textContent = accountEmail;
      
      const providerData = user.providerData;

      // Check if any provider is Google
      const isGoogleUser = providerData.some((provider) => provider.providerId === "google.com");

      if (isGoogleUser) {
        document.getElementById('email-btn').onclick = null;
        console.log("User is signed in with Google.");
        document.getElementById("logoutBtn").setAttribute("onclick", "googleAccountDel()");
      } else {
        console.log("User is signed in, but not with Google.");
      }

      // Function to toggle light/dark mode based on selected theme
      const body = document.body;
        
      docRef.get().then((doc) => {
        if (doc.exists) {
          var data = doc.data();
          
          if (data.Theme === "light") {
              body.classList.add("light-mode");
          } else {
              body.classList.remove("light-mode");
          }
        }
      });

      setTimeout(showPage, 70);

    } else {
      console.log("No user logged in");
      window.location.href = 'login.html'; // Redirect to login page if not logged in
    }
  });
});
