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
    var database = firebase.database()
    
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    var uiConfig = {
        callbacks: {
          signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            return true;
          },
          uiShown: function() {
            // The widget is rendered.
            // Hide the loader.
            document.getElementById('loader').style.display = 'none';
          }
        },
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInSuccessUrl: 'index.html',
        signInOptions: [
          // Leave the lines as is for the providers you want to offer your users.
        //   firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        //   firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        //   firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        //   firebase.auth.GithubAuthProvider.PROVIDER_ID,
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //   firebase.auth.PhoneAuthProvider.PROVIDER_ID
        ],
        // // Terms of service url.
        // tosUrl: 'index.html',
        // // Privacy policy url.
        // privacyPolicyUrl: '<your-privacy-policy-url>'
    };

    ui.start('#firebaseui-auth-container', uiConfig);

    $("#login").on("click", function() {
        $("#signup-page").addClass("disappear")
        $("#login-page").removeClass("disappear")
    })

    $("#signup").on("click", function() {
        $("#login-page").addClass("disappear")
        $("#signup-page").removeClass("disappear")
    })

    function myFunction() {
        $("#NewInputPassword").attr("type") === "password" ? $("#NewInputPassword").attr("type", "text") :  $("#NewInputPassword").attr("type", "password")
        $("#UserInputPassword").attr("type") === "password" ? $("#UserInputPassword").attr("type", "text") :  $("#UserInputPassword").attr("type", "password")
    }


    $(".name").tooltip()
    $(".name").on("click", function() {
        var name = $(this).text()
            if (name === "Evan Simon Ross") {$('#evan-Modal').modal('show')}
            if (name === "Jano Roze") {$('#jano-Modal').modal('show')}
            if (name === "Katherine He") {$('#kat-Modal').modal('show')}
    })

})