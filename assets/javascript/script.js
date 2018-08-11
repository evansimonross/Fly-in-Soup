// User data
var loggedIn = false
var latitude
var longitude
var userLocation
var favorites = JSON.parse(localStorage.getItem("favorites")) || []

// Map data
var markers = []
var boundsN
var boundsS
var boundsE
var boundsW

// Search functionality
var allData = []
var filter = ""
var hasResult = false
var searchSource = "none"

$(function () {

    // populates the restaurant-cards area with instructions on first load.
    noResult()

    // fetches the user's geolocation from the browser
    let getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                userLocation = position
                longitude = parseFloat(userLocation.coords.longitude).toFixed(4)
                latitude = parseFloat(userLocation.coords.latitude).toFixed(4)
                centerAt(longitude, latitude, 14.5)
            })
        } else {
            console.log("Could not access user's location")
        }
    }

    // Returns true if the user is on the front page. Used to check whether to run map-related functionality
    let frontPage = () => {
        if (window.location.pathname.indexOf("about") === -1 && window.location.pathname.indexOf("login") === -1) {
            return true
        }
    }

    // only fetches user's location if on the 'index' page
    if (frontPage()) {
        getLocation()
    }

    // Create the restaurant cards in HTML
    let createCard = (obj, num) => {
        $("#restaurant-cards").append($('<div class="card col-xxxl-3 col-xxl-4 col-xl-6 col-lg-6 col-md-4 animated fadeInUp">').append($("<div>").addClass("card-body mini-card").attr("id", num)))
        hasResult = true

        // grade (color matches the icon)
        $(`#${num}`).append($(`<img class="mini-grade" src="assets/images/grade-${obj.grade}.png">`))
        var gradeColor = "#a6a6a6"
        if (obj.grade === "A") {
            gradeColor = "#2e56a4"
        }
        else if (obj.grade === "B") {
            gradeColor = "#5e9f43"
        }
        else if (obj.grade === "C") {
            gradeColor = "#f5883f"
        }

        // restaurant name
        $(`#${num}`).append($(`<h5 class="card-title">${obj.dba.toUpperCase()}</h5>`))

        // heart icon (already solid + visible if it's already a favorite)
        let isFavorite = (indexOfFavorite(obj.dba.toUpperCase(), obj.building) != -1)
        if (isFavorite) {
            $(`#${num}`).append($(`<i class="fas fa-heart"></i>`))
        }
        else {
            $(`#${num}`).append($(`<i class="hidden far fa-heart"></i>`))
        }

        // address
        $(`#${num}`).append($(`<h6 class="add1 card-subtitle mb-2 text-muted">${obj.address1}</h6>`))
        $(`#${num}`).append($(`<h6 class="add2 card-subtitle mb-2 text-muted">${obj.address2}</h6>`))

        // additional data from the database
        $(`#${num}`).attr('data-record-date', obj["record_date"])
        $(`#${num}`).attr('data-inspection-date', obj["inspection_date"].substring(0, 10))
        $(`#${num}`).attr('data-violation-code', obj["violation_code"] || "None")

        // handling encoding errors prevalent in the DOH data
        let vio = obj["violation_description"] || "None"
        while (vio.indexOf("'''") != -1) {
            vio = vio.substring(0, vio.indexOf("''''")) + "\'" + vio.substring(vio.indexOf("''''") + 4, vio.length)
        }
        while (vio.indexOf("") != -1) {
            vio = vio.substring(0, vio.indexOf("")) + "\'" + vio.substring(vio.indexOf("") + 1, vio.length)
        }
        while (vio.indexOf("Âº") != -1) {
            vio = vio.substring(0, vio.indexOf("Âº")) + "°" + vio.substring(vio.indexOf("Âº") + 2, vio.length)
        }
        $(`#${num}`).attr('data-violation-description', vio)
        let cui = obj["cuisine_description"]
        while (cui.indexOf("Ã©") != -1) {
            cui = cui.substring(0, cui.indexOf("Ã©")) + "é" + cui.substring(cui.indexOf("Ã©") + 2, cui.length)
        }
        $(`#${num}`).attr('data-cuisine', cui)

        // add markers to the map for each restaurant card displayed
        toGeocode(obj.address1 + " " + obj.address2).then(function (response) {
            let result = response.features
            let restaurant = {}

            // check which result from the geocode list is in the correct zipcode
            for (var i = 0; i < result.length; i++) {
                if (result[i].properties.postalcode === obj.zipcode) {
                    restaurant = result[i]
                    break
                }
            }

            let long = restaurant.geometry.coordinates[0]
            let lat = restaurant.geometry.coordinates[1]

            // create a popup that is identical to the restaurant card. 
            // its id is the same except with "p" afterword for "popup"
            let popupHTML = $(`#${num}`).parent().html()
            popupHTML = popupHTML.substring(0, popupHTML.indexOf("id=")) +
                `id="${num}p" ` +
                popupHTML.substring(popupHTML.indexOf("data-"), popupHTML.length)
            var popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(popupHTML)

            // Create a marker for the restaurant. Its color indicates its grade
            var marker = new mapboxgl.Marker()
                .setLngLat([long, lat])
                .setPopup(popup)
                .addTo(map)
            $($($($($($(marker)[0]._element)).children()[0]).children()[0]).children()[1]).attr('fill', gradeColor)

            // set the marker in the array for easy access later
            if (markers[num]) {
                markers[num].remove() // to prevent repeated markers
                if (num === 1) { // to prevent bounding issues
                    markers[num] = marker
                    return
                }
            }
            markers[num] = marker

            // The map is resized according to the N/S/E/W most restaurants

            var relativeWidth = 0
            var relativeHeight = 0

            // Set the minimum bounds around the first restaurant in the list. 
            // This will be the total bounds if there's only one restuarant.
            if (num === 1) {
                boundsN = lat
                boundsS = lat
                boundsE = long
                boundsW = long
                relativeWidth = 0.01
                relativeHeight = 0.02
            }

            // Increase the bounds if a restaurant is outside the current bounds in any direction
            else {
                if (lat > boundsN) { boundsN = lat }
                if (lat < boundsS) { boundsS = lat }
                if (long < boundsW) { boundsW = long }
                if (long > boundsE) { boundsE = long }
                relativeWidth = boundsE - boundsW
                relativeHeight = boundsN - boundsS
            }

            // Set the bounds a bit further out than the most extreme locations
            map.fitBounds([
                [(boundsW - ((relativeWidth) * 0.05)), (boundsS - ((relativeHeight) * 0.05))],
                [(boundsE + ((relativeWidth) * 0.05)), (boundsN + ((relativeHeight) * 0.05))]
            ]);

        })
    }

    // build query
    let buildQueryURL = (i) => {
        allData = []
        var queryURL = "https://data.cityofnewyork.us/resource/9w7m-hzhe.json"

        if (/\d{5}/.test(i)) {
            // zipcode
            searchSource = "zip"
            i = `?zipcode=${i}`

        } else if (/[a-zA-Z]/.test(i)) {
            i = i.toUpperCase()

            if (i === "MANHATTAN" || i === "BROOKLYN" || i === "QUEENS" || i === "BRONX" || i === "STATEN ISLAND") {
                // boro
                searchSource = "boro"
                i = `?boro=${i}`

            } else {
                // restaurant name
                searchSource = "restaurant"
                let restaurantName = i
                i = `?dba=${restaurantName}`
                getAllData(queryURL + i)
                i = `?dba=${toMixedCase(restaurantName)}`
            }
        }
        getAllData(queryURL + i)
    }

    // get data from health inspection api based on query url
    let getAllData = (queryURL) => {
        $.ajax({
            url: queryURL,
            method: "GET",
            data: {
                "$where": "grade IS NOT NULL", // Prevents results with undefined grades from showing up in results.
                "$order": "inspection_date DESC", // Shows more recent inspection results first
                "$limit": "5000", // Maximum number of results
                "$$app_token": "jOHHqdrBMVMNGmFWFLpWE22PP" // API token speeds up API retreval speed
            }
        }).then(function (response) {

            // Clear the searchbar
            $("#nav-input").val("")

            if (!(response)) {
                noResponse()
                return
            }

            // creates the data array
            for (let i = 0; i < response.length; i++) {
                var thisRestaurant = response[i]
                thisRestaurant.address1 = `${response[i].building} ${response[i].street}`
                thisRestaurant.address2 = `${response[i].boro}, NY, ${response[i].zipcode}`
                allData.push(thisRestaurant)
            }

            // Prevent repeats. Only the most recent result is kept
            trimData()

            // Populate restaurant cards and map
            createCards()
        })

    }

    // create all cards from allData array
    let createCards = () => {
        $("#restaurant-cards").empty()
        removeMarkers()
        let cardId = 1;

        // if the search is small the cards size will be made to fit 
        //else restruant cards section only will be made scrollable
        if (allData.length >= 10) {
            $("#restaurant-cards").addClass("large-search")
        } else if ($("#restaurant-cards").hasClass("large-search")) {
            $("#restaurant-cards").removeClass("large-search")
        }

        // Filter the results by grade
        allData.forEach(element => {

            // Data in the dataset for "pending" can be saved as four different grade values.
            // "P", "N" and "Z" have subtly different meanings that are not relevent for this application.
            // The unabbreviated "Not Yet Graded" should not appear in the data, but does. Frequently.
            if (filter === "P") {
                if (element.grade === "P" || element.grade === "N" || element.grade === "Z" || element.grade === "Not Yet Graded") {
                    createCard(element, cardId)
                    cardId += 1
                }
            }

            // A, B and C filters are self-explanatory 
            else if (filter) {
                if (element.grade === filter) {
                    createCard(element, cardId)
                    cardId += 1
                }
            }

            // No filter means all data should be represented
            else {
                createCard(element, cardId)
                cardId += 1
            }
        })

        // Check whether there are any results to the search
        noResult()

    }

    // display all restaurants from either the user's favorites array or zomato's array
    let getRestaurantsFromArray = (array) => {
        if (array.length === 0 && searchSource === "favs") {
            noResult()
            return
        }
        array.forEach(element => {

            name = element.name.toUpperCase()
            building = element.location.address.substring(0, element.location.address.indexOf(" ")) || ""

            // search the database for uppercase restaurant name
            var queryURLUpper = `https://data.cityofnewyork.us/resource/9w7m-hzhe.json?dba=${name}&building=${building}`
            getAllData(queryURLUpper)

            // search the database for mixed case restaurant name
            var queryURLMixed = `https://data.cityofnewyork.us/resource/9w7m-hzhe.json?dba=${toMixedCase(name)}&building=${building}`
            getAllData(queryURLMixed)

        })
    }

    // get list of nearby restaurants from zomato api
    let getRestaurantList = (lat, long) => {
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

            getRestaurantsFromArray(currentRestList)
        })
    }

    // if open search will close nav
    $(".search-btn").on("click", function() {
        if ($("#navbarResponsive").hasClass("show")) {
            $("#navbarResponsive").removeClass("show")
        }
    })

    // if open nav will close search
    $(".menu-btn").on("click", function() {
        if ($("#searchbarResponsive").hasClass("show")) {
            $("#searchbarResponsive").removeClass("show")
        }
    })

    // API search btn
    $("#nav-search").on("click", function (event) {
        hasResult = false

        event.preventDefault()
        var input = $("#nav-input").val().trim()

        // Handles restaurants with "&" in the name in order to prevent the AJAX call from believing a new parameter follows
        while (input.indexOf("&") != -1) {
            input = input.substring(0, input.indexOf("&")) + "\%26" + input.substring(input.indexOf("&") + 1, input.length)
        }
        if (input === "Current Location" || input === "") {
            searchSource = "loc"
            centerAt(longitude, latitude, 14.5)
            getRestaurantList(latitude, longitude)
        }
        else if (input === "Favorites") {
            searchSource = "favs"
            allData = []
            getRestaurantsFromArray(favorites)
        }
        else {
            buildQueryURL(input)
        }
    })

    // Filter by grade
    $('.filterImg').on("click", function () {
        hasResult = false
        if ($(this).attr('data-filter') === filter) {
            filter = ""
            $(this).removeClass("filtered")
            createCards()
        }
        else {
            filter = $(this).attr('data-filter')
            $('.filterImg').removeClass("filtered")
            $(this).addClass("filtered")
            createCards()
        }
    })

    // close modal button
    $(".close-button").on("click", function () {
        $('.modal').modal('hide')
    })

    // display modal when a card is clicked
    $(document).on("click", ".mini-card", function (event) {

        // behavior if part of the card other than the favorite icon is clicked
        if ($(event.target)[0].className.indexOf("fa-heart") === -1) {

            if ($(this).attr("id") === "here") { return }

            let restaurantName = $(this).find(".card-title").text()
            let fullAddress = $(this).find(".add1").text() + " " + $(this).find(".add2").text()
            let grade = $(this).find(".mini-grade").attr('src')

            let index = allData.findIndex(x => x.name === restaurantName)


            $("#modal-name").text(restaurantName)

            $(".modal-body").html($(`<div class="text-center"><img id="modal-grade" src="${grade}" alt="Grade: ${grade}"></div>`))
            $(".modal-body").append($(`<h6 class="text-center text-muted">${fullAddress}</h6>`))

            // more info part
            var card = $(this)
            $(".modal-body").append($("<ul>").addClass("more-info"))
            $(".more-info").append($(`<li><b>Cuisine</b>: ${card.attr("data-cuisine")}</li>`))
            $(".more-info").append($(`<li><b>Violation Code</b>: ${card.attr("data-violation-code")}</li>`))
            $(".more-info").append($(`<li><b>Violation Description</b>: ${card.attr("data-violation-description")}</li>`))
            $(".more-info").append($(`<li><b>Inspection Date</b>: ${card.attr("data-inspection-date")}</li>`))

            $('#myModal').modal('show')
        }

        // behavior if the favorite icon is clicked
        else {
            let restaurant = {}
            restaurant.name = $(this).find(".card-title").text()
            restaurant.location = { address: $(this).find(".add1").text() }
            let index = indexOfFavorite(restaurant.name, restaurant.location.address.substring(0, restaurant.location.address.indexOf(" ")))

            // locate the matching card or popup
            let thisId = $(this).attr("id")
            let otherId = ""
            if (thisId.indexOf("p") === -1) {
                otherId = thisId + "p"
            }
            else {
                otherId = thisId.substring(0, thisId.length - 1)
            }
            let otherHeart = null
            try {
                otherHeart = $($($('#' + otherId)[0].children)[2])
            }
            catch { }

            // restaurant is not yet on favorites list, add to favorites
            let favIcon;
            if (index === -1) {
                favorites.push(restaurant)

                // make its card + popup heart icons solid
                favIcon = (element) => {
                    element.removeClass('far')
                    element.addClass('fas')
                    element.removeClass('hidden')
                }
            }

            // restaurant is already on favorites list, remove from favorites
            else {
                favorites.splice(index, 1)

                // make its card + popup heart icons hidden + outlined
                favIcon = (element) => {
                    element.removeClass('fas')
                    element.addClass('far')
                    element.addClass('hidden')
                }
            }

            // change the icons
            favIcon($(event.target))
            if (otherHeart) {
                favIcon(otherHeart)
            }
            else {
                let popupHTML = $(`#${thisId}`).parent().html()
                popupHTML = popupHTML.substring(0, popupHTML.indexOf("id=")) +
                    `id="${thisId}p" ` +
                    popupHTML.substring(popupHTML.indexOf("data-"), popupHTML.length)
                var popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(popupHTML)
                markers[parseInt(thisId)].setPopup(popup)
            }

            // save locally or to the database if the user is logged in
            localStorage.setItem("favorites", JSON.stringify(favorites))
            if (uid) {
                faveRef.child(uid).set(favorites)
            }
        }
    })

    if (frontPage()) {
        // Resizing the map on load
        var mapWidth = $(".map").width()
        var mapHeight = $(".map").height()
        $("#map").attr("style", `width: ${mapWidth}px; height: ${mapHeight}px;`)
        map.resize();

        // change map size on window size change
        $(window).resize(function () {
            var winWidth = $(window).width()
            var winHeight = $(window).height()

            if (winWidth >= 940) {
                $("#map").attr("style", `width: ${mapWidth}px; height: ${winHeight}px;`)
                map.resize();
            } else {
                $("#map").attr("style", `width: ${winWidth}px; height: ${winHeight * .4}px;`)
                map.resize();
            }
        })

    }
})



// geocoding an address function. 
// when you use this, call it like so:
// toGeocode(address).then(function(response){ // STUFF HERE })
var toGeocode = (address) => {
    let queryUrl = "https://geosearch.planninglabs.nyc/v1/search?&text=" + address
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

    // if the dates are the same, date1 is not newer
    return false
}

// delete repeats in the data, preserving only the most recent inspection result
let trimData = () => {
    for (let i = 0; i < allData.length;) {

        // Find indices of all repeat restaurants of index i
        let thisRestaurant = allData[i]
        let sameIndices = [i]
        for (let j = i + 1; j < allData.length; j++) {

            // If the name and building number are the same, we assume it's the same restaurant
            // Maybe add more comparisons later if issues arise
            if (thisRestaurant.dba === allData[j].dba && thisRestaurant.building === allData[j].building) {
                sameIndices.push(j)
            }
        }

        // Find which of the repeat restaurants is newest 
        newestIndex = i
        sameIndices.forEach(function (element) {
            if (isNewerThan(allData[element].inspection_date, allData[newestIndex].inspection_date)) {
                newestIndex = element
            }
        })

        // Remove the newest index from the sameIndices array. 
        // Increment i unless index 0 has been deleted in which case i should remain the same
        sameIndices.splice(sameIndices.indexOf(newestIndex), 1)
        if (sameIndices.indexOf(0) === -1) {
            i++
        }

        // Remove all repeat data from the allData array
        while (sameIndices.length > 0) {
            allData.splice(sameIndices.pop(), 1)
        }
    }
}

// checks the favorite list to see if the restaurant input is on it. 
// if it's not on the list, it returns -1
let indexOfFavorite = (name, building) => {
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].name === name && favorites[i].location.address.substring(0, favorites[i].location.address.indexOf(" ")) === building) {
            return i
        }
    }
    return -1
}

// The NYC health dept database doesn't reliably have restaurant names in uppercase or not, so this function converts from uppercase to mixed case
var toMixedCase = (string) => {
    let array = string.split(" ")
    let newArray = []
    array.forEach(function (element) {
        newArray.push(element.substring(0, 1).toUpperCase() + element.substring(1, element.length).toLowerCase())
    })
    let newString = ""
    for (var i = 0; i < newArray.length; i++) {
        newString += newArray[i]
        if (i < newArray.length - 1) {
            newString += " "
        }
    }
    return newString
}

// remove all markers from the map 
var removeMarkers = () => {
    for (var i = 1; i < markers.length; i++) { // start at 1 to avoid erasing the center marker
        if (markers[i]) {
            markers[i].remove();
        }
    }
    markers = [markers[0]]
}

// center map at a long/lat position and add a marker there
var centerAt = (long, lat, zoom) => {
    try {

        // remove a previous center marker
        if (markers[0]) {
            let oldCenter = markers[0]
            oldCenter.remove()
        }

        // create a popup for the YOU ARE HERE marker
        var popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML('<div class="card-body mini-card" id="here"><h5 class="card-title fancy">You are Here</h5></div>')

        // place a new center marker at the specified location
        marker = new mapboxgl.Marker()
            .setLngLat([long, lat])
            .setPopup(popup)
            .addTo(map)

        // give it a neutral color
        $($($($($($(marker)[0]._element)).children()[0]).children()[0]).children()[1]).attr('fill', '#dd3366')

        // put it in the array
        markers[0] = marker

        // fly to that location at the specified zoom
        map.flyTo({
            center: [long, lat],
            zoom: zoom
        })
    }
    catch (err) { }
}

// check for a search that had no result
var noResult = () => {
    setTimeout(function () {
        if (hasResult) { return }
        $('#restaurant-cards').empty()
        $('#restaurant-cards').css("opacity","0")
        if (searchSource === "none") {
            $('#restaurant-cards').append('<h3>&nbsp;Welcome to Fly-in-Soup!</h3>')
            $('#restaurant-cards').append('<p>Please try making a search.</p>')
            $('#restaurant-cards').append('<p>You can search by borough, zip code, or restaurant name.</p>')
            $('#restaurant-cards').append("<p>You can also search by your 'Current Location' if you're in NYC.</p>")
            $('#restaurant-cards').append("<p>If you have favorite restaurants saved, you can search 'Favorites' too.</p>")
        }
        else if (filter) {
            $('#restaurant-cards').append('<h3>&nbsp;No Results Found</h3>')
            $('#restaurant-cards').append('<p>Try changing the grade filter or turning the filter off.</p>')
        }
        else if (searchSource === "loc") {
            $('#restaurant-cards').append('<h3>&nbsp;No Results Found</h3>')
            $('#restaurant-cards').append("<p>If you haven't done so, please accept location permissions to use this feature.</p>")
            $('#restaurant-cards').append("<p>Our data set only includes the five boroughs of New York. This feature will not work if you're outside NYC.</p>")
        }
        else if (searchSource === "favs") {
            $('#restaurant-cards').append('<h3>&nbsp;No Results Found</h3>')
            $('#restaurant-cards').append("<p>There may be no favorites saved to your computer or to your account.</p>")
            $('#restaurant-cards').append("<p>If you have favorites on your account, please make sure that you are logged in.</p>")
        }
        else if (searchSource === "zip") {
            $('#restaurant-cards').append('<h3>&nbsp;No Results Found</h3>')
            $('#restaurant-cards').append("<p>Our data set only includes the five boroughs of New York. We can only check zip codes that are inside NYC.</p>")
        }
        else if (searchSource === "boro") {
            $('#restaurant-cards').append('<h3>&nbsp;No Results Found</h3>')
            $('#restaurant-cards').append("<p>Something has gone wrong.</p>")
        }
        else if (searchSource === "restaurant") {
            $('#restaurant-cards').append('<h3>&nbsp;No Results Found</h3>')
            $('#restaurant-cards').append("<p>We could not find any restaurant by that name. Please make sure that you have inputted it correctly.</p>")
            $('#restaurant-cards').append("<p>Unfortuntely, due to the limitations of the DOHMH health inspection dataset, some restaurants may not be searchable at this time.")
        }
        $('#restaurant-cards').animate({
            "opacity": 1
        },500)
    }, 500)
}