// global variable to hold user's geolocation
var latitude
var longitude
var userLocation
var allData = []
var mainApp = {}

$(function () {
    // check if user is logged in
    var uid = null
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          uid = user.id
          console.log("hello");
          
          $(".signin").addClass("disappear")
          $(".signout").removeClass("disappear")
        } else {
            uid = null
        }
    });

    $(".signout a").on("click", function() {
        firebase.auth().signOut()
        $(".signin").removeClass("disappear")
        $(".signout").addClass("disappear")
    })

    // holds all the data from the API search
    let i = 0

    // fetches the user's geolocation from the browser
    let getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                userLocation = position
                longitude = parseFloat(userLocation.coords.longitude).toFixed(4)
                latitude = parseFloat(userLocation.coords.latitude).toFixed(4)
            })
        } else {
            console.log("Could not access user's location")
        }
    }
    getLocation();

    marker = new mapboxgl.Marker()
        .setLngLat([-73.9840, 40.7549])
        .addTo(map);

    marker1 = new mapboxgl.Marker()
        .setLngLat([-73.9841, 40.7549])
        .addTo(map);

    marker2 = new mapboxgl.Marker()
        .setLngLat([-73.9842, 40.7549])
        .addTo(map);


    // delete then creates the cards in HTML
    let createCard = (obj, num) => {
        $("#resturant-cards").append($('<div class="card col-xl-4 col-lg-6 col-md-4">').append($("<div>").addClass("card-body mini-card").attr("id",num)))

        $(`#${num}`).append($(`<img class="mini-grade" src="assets/images/grade-${obj.grade}.png">`))
        $(`#${num}`).append($(`<h5 class="card-title">${obj.dba}</h5>`))
        $(`#${num}`).append($(`<h6 class="add1 card-subtitle mb-2 text-muted"> ${obj.address1}</h6>`))
        $(`#${num}`).append($(`<h6 class="add2 card-subtitle mb-2 text-muted"> ${obj.address2}</h6>`))
        $(`#${num}`).attr('data-record-date', obj["record_date"])
        $(`#${num}`).attr('data-inspection-date', obj["inspection_date"].substring(0, 10))
        $(`#${num}`).attr('data-violation-code', obj["violation_code"])
        $(`#${num}`).attr('data-violation-description', obj["violation_description"])
        $(`#${num}`).attr('data-cuisine', obj["cuisine_description"])
        toGeocode(obj.address1 + " " + obj.address2).then(function (response) {
            $(`#${num}`).attr('data-longitude', response.bbox[0]);
            $(`#${num}`).attr('data-latitude', response.bbox[1]);
        })
    }

    // build query
    let buildQueryURL = (i) => {
        var queryURL = "https://data.cityofnewyork.us/resource/9w7m-hzhe.json"

        if (/\d{5}/.test(i)) {
            // zipcode
            i = `?zipcode=${i}`
        } else if (/[a-zA-Z]/.test(i)) {
            i = i.toUpperCase()

            if (i === "MANHATTAN" || i === "BROOKLYN" || i === "QUEENS" || i === "BRONX" || i === "STATEN ISLAND") {
                // boro
                i = `?boro=${i}`
            } else {
                // resturant name
                i = `?dba=${i}`
            }
        }
        return queryURL + i
    }

    // get data from health inspection api based on query url
    let getAllData = (queryURL) => {
        $.ajax({
            url: queryURL,
            method: "GET",
            data: {
                "$where": "grade IS NOT NULL", // Prevents results with undefined grades from showing up in results.
                "$$app_token": "jOHHqdrBMVMNGmFWFLpWE22PP" // API token speeds up API retreval speed
            }
        }).then(function (response) {

            // creates the data array
            for (let i = 0; i < response.length; i++) {
                var thisRestaurant = response[i];
                thisRestaurant.address1 = `${response[i].building} ${response[i].street}`
                thisRestaurant.address2 = `${response[i].boro}, NY, ${response[i].zipcode}`
                allData.push(thisRestaurant)
            }

            $("#resturant-cards").empty()
            trimData()

            allData.forEach(element => {
                createCard(element, i)
                i += 1
            });

            $("#nav-input").val("")
        })

    }

    // get list of nearby restaurants from zomato api
    let getResturantList = (lat, long) => {
        var queryURL = `https://developers.zomato.com/api/v2.1/geocode?apikey=625bdeced0acd6c03b8a61c2593a9093&lat=${lat}&lon=${long}`
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function (response) {
            var data = response.nearby_restaurants
            var currentRestList = []

            for (let i = 0; i < data.length; i++) {
                currentRestList.push(data[i].restaurant)
            }

            allData = []

            currentRestList.forEach(element => {

                name = element.name.toUpperCase()
                building = element.location.address.substring(0, element.location.address.indexOf(" "))
                var queryURL = `https://data.cityofnewyork.us/resource/9w7m-hzhe.json?dba=${name}&building=${building}`

                getAllData(queryURL)
            })
        })
    }

    // API search btn
    $("#nav-search").on("click", function (event) {
        event.preventDefault()
        var input = $("#nav-input").val().trim()
        if (input === "Current Location") {
            getLocation()

            getResturantList(latitude, longitude)

        } else {
            let queryURL = buildQueryURL(input)
            allData = []
            getAllData(queryURL)
        }
    })

    // display modal when a card is clicked
    $(document).on("click", ".card", function () {
        let resturantName = $(this).find(".card-title").text()
        let fullAddress = $(this).find(".add1").text() + " " + $(this).find(".add2").text()
        let grade = $(this).find(".mini-grade").attr('src');

        let index = allData.findIndex(x => x.name === resturantName)


        $("#modal-name").text(resturantName)

        $(".modal-body").html($(`<div class="text-center"><img id="modal-grade" src="${grade}" alt="map"></div>`))
        $(".modal-body").append($(`<h6 class="text-center text-muted">${fullAddress}</h6>`))

        // more info part
        var card = $(this).find(".card-body")
        $(".modal-body").append($("<ul>").addClass("more-info"))
        $(".more-info").append($(`<li><b>Cuisine</b>: ${card.attr("data-cuisine")}</li>`))
        $(".more-info").append($(`<li><b>Violation Code</b>: ${card.attr("data-violation-code")}</li>`))
        $(".more-info").append($(`<li><b>Violation Description</b>: ${card.attr("data-violation-description")}</li>`))
        $(".more-info").append($(`<li><b>Inspection Date</b>: ${card.attr("data-inspection-date")}</li>`))

        $('#myModal').modal('show')

    })

    // Resizing the map
    var mapWidth = $(".map").width()
    var mapHeight = $(".map").height() 
    $("#map").attr("style", `width: ${mapWidth}px; height: ${mapHeight}px;`)

    $(window).resize(function(){ 
        var winWidth = $(window).width()
        var winHeight = $(window).height()
        console.log(winWidth);
        

        if (winWidth >= 940) {
            $("#map").attr("style", `width: ${mapWidth}px; height: ${mapHeight}px;`)
        } else {
            $("#map").attr("style", `width: ${winWidth}px; height: ${winHeight* .4}px;`)
        }
    });
})

// geocoding an address function. 
// when you use this, call it like so:
// toGeocode(address).then(function(response){ // STUFF HERE })
var toGeocode = (address) => {
    let queryUrl = "https://geosearch.planninglabs.nyc/v1/search?size=1&text=" + address
    return $.ajax({
        url: queryUrl,
        method: "GET",
    })
}

// check which date is newer (YYYY-MM-DD format)
let isNewerThan = (date1, date2) => {
    let date1Year = parseInt(date1.substring(0, 4))
    let date2Year = parseInt(date2.substring(0, 4))
    if (date1Year > date2Year) { return true }
    if (date2Year > date1Year) { return false }

    let date1Month = parseInt(date1.substring(5, 7))
    let date2Month = parseInt(date2.substring(5, 7))
    if (date1Month > date2Month) { return true }
    if (date2Month > date1Month) { return false }

    let date1Day = parseInt(date1.substring(8, 10))
    let date2Day = parseInt(date2.substring(8, 10))
    if (date1Day > date2Day) { return true }
    if (date2Day > date1Day) { return false }
}

// delete repeats in the data, preserving only the most recent inspection result
let trimData = () => {
    for (let i = 0; i < allData.length;) {
        let thisRestaurant = allData[i]
        let sameIndices = [i]
        for (let j = i + 1; j < allData.length; j++) {
            if (thisRestaurant.dba === allData[j].dba && thisRestaurant.building === allData[j].building) {
                sameIndices.push(j)
            }
        }
        newestIndex = i
        sameIndices.forEach(function (element) {
            if (isNewerThan(allData[element].inspection_date, allData[newestIndex].inspection_date)) {
                newestIndex = element;
            }
        })
        sameIndices.splice(sameIndices.indexOf(newestIndex), 1)
        if (sameIndices.indexOf(0) === -1) {
            i++
        }
        while (sameIndices.length > 0) {
            allData.splice(sameIndices.pop(), 1)
        }
    }
}