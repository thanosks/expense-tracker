// login.js
firebase.initializeApp(firebaseConfig);
const database = firebase.database()
const firestore = firebase.firestore();

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user);
            window.location.href = 'app.html';
        })
        .catch((error) => {
            // Handle errors
            const errorMessage = error.message;
            console.error(errorMessage);
        });
});

// Function to initiate Google sign-in/sign-up
function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
        // Signed in with Google
        const user = result.user;
        const uid = user.uid; // Get the UID of the authenticated user
        const usersRef = database.ref('users/' + uid); // Include the UID in the database path
        usersRef.once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // User already exists, sign them in
                    console.log("User already exists");
                    window.location.href = 'app.html';
                } else {
                    // User does not exist, create a new user entry in the database
                    const newUser = {
                        name: user.displayName,
                        email: user.email,
                        balance: {
                            total: 0
                        },
                        expenses: {},
                        income: {},
                        timeline: {}
                    };
                    usersRef.set(newUser)
                        .then(() => {
                            // Set Default Settings
                            firestore.collection("settings").doc(user.uid).set({
                                Currency: 'USD',
                                Theme: 'dark',
                                Limit: 3,
                                wLimit: 0
                            })
                            .catch((error) => {
                                console.error("Error writing document: ", error);
                            })
                            .then(()=> {
                                console.log("New user created successfully");
                                window.location.href = 'app.html';
                            })
                        })
                        .catch((error) => {
                            console.error("Error creating user database:", error);
                        });
                }
            })
            .catch((error) => {
                console.error("Error checking user existence:", error);
            });
    })
    .catch((error) => {
        console.error(error.message);
    });
}

function show_password() {
    var x = document.getElementById("password");
    console.log(x);
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}

// Function to toggle the settings visibility
function toggle(id) {
    const popup = document.getElementById(id);

    if (popup.style.display === "block") {
        popup.style.display = "none";  // Close the popup
    } else {
        popup.style.display = "block";  // Open the popup
    }
  
}
  
function x_btn(element) {
    const parent = element.parentNode;
  
    parent.style.display = "none";
}

document.getElementById('submitForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const emailElement = document.getElementById('Email').value;

    firebase.auth().sendPasswordResetEmail(emailElement)
    .then(() => {
      console.log("Email Sent");
      alert("Email Sent");
    })
    .catch((error) => {
      console.error("Error Sending Email: ", error);
    });
});

// Event listener for the Google Sign-In button
document.getElementById('login-with-google-btn').addEventListener('click', googleSignIn);
