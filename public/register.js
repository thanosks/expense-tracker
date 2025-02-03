// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize variables
const auth = firebase.auth()
const database = firebase.database()
const firestore = firebase.firestore();

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const password_1 = document.getElementById('password_1').value;

    if (password != password_1) {
        console.log('Passwords do not match');
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        // Signed up
        const user = userCredential.user;
        console.log(user);
        user.updateProfile({
            displayName: name
        })
        // Create a new user entry in the database with the structure similar to the old database
        const newUserRef = database.ref('users/' + user.uid);
        const newUser = {
            name: name,
            email: user.email,
            balance: {
                total: 0
            },
            expenses: {},
            income: {},
            timeline: {}
        };
        newUserRef.set(newUser);

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

        firebase.auth().currentUser.sendEmailVerification()
        .then(() => {
            window.location.href = 'app.html';
        })
        .catch((error) => {
            console.error("Error sending email:", error);
        });
    })
    .catch((error) => {
        console.error("Error creating account:", error);
        return;
    });
});

function show_password() {
    var x = document.getElementById("password");
    console.log(x);
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }

    var x = document.getElementById("password_1");
    console.log(x);
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}
