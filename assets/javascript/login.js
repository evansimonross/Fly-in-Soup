let thisuser
var uid = null
var email
var database
var faveRef

$(function () {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCH953RAujY3nOz1LuoPDVXOsXEVTj5nd4",
        authDomain: "fly-in-soup.firebaseapp.com",
        databaseURL: "https://fly-in-soup.firebaseio.com",
        projectId: "fly-in-soup",
        storageBucket: "",
        messagingSenderId: "1016106732008"
    };
    firebase.initializeApp(config);
    database = firebase.database()
    faveRef = database.ref("/favorite")

    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                return true;
            },
            uiShown: function () {
                document.getElementById('loader').style.display = 'none';
            }
        },
        signInFlow: 'popup',
        signInSuccessUrl: 'index.html',
        signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID]
    };

    if (window.location.pathname.indexOf("login") != -1) {
        ui.start('#firebaseui-auth-container', uiConfig);
    }

    $("#login").on("click", function () {
        $("#signup-page").addClass("disappear")
        $("#login-page").removeClass("disappear")
    })

    $("#signup").on("click", function () {
        $("#login-page").addClass("disappear")
        $("#signup-page").removeClass("disappear")
    })

    function myFunction() {
        $("#NewInputPassword").attr("type") === "password" ? $("#NewInputPassword").attr("type", "text") : $("#NewInputPassword").attr("type", "password")
        $("#UserInputPassword").attr("type") === "password" ? $("#UserInputPassword").attr("type", "text") : $("#UserInputPassword").attr("type", "password")
    }

    $(".name").tooltip()
    $(".name").on("click", function () {
        var name = $(this).text()
        if (name === "Evan Simon Ross") { $('#evan-Modal').modal('show') }
        if (name === "Jano Roze") { $('#jano-Modal').modal('show') }
        if (name === "Katherine He") { $('#kat-Modal').modal('show') }
    })

    //check if user is logged in
    firebase.auth().onAuthStateChanged(function (x) {
        if (x) {
            $(".signin").addClass("disappear")
            $(".signout").removeClass("disappear")
            uid = x.uid
            faveRef.once('value', function (snapshot) {
                favorites = snapshot.val()[uid]
                localStorage.setItem("favorites", JSON.stringify(favorites));
            })
        } else {
            uid = null
            favorites = []
            localStorage.setItem("favorites", JSON.stringify(favorites));
        }
    });

    $(".signout a").on("click", function (event) {
        event.preventDefault()
        firebase.auth().signOut()
        $(".signin").removeClass("disappear")
        $(".signout").addClass("disappear")
    })
    
})