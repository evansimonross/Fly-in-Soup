// change color of the sstyle box to equal the grade


// global variable to hold user's geolocation
let latitude
let longitude
let userLocation
let allData = []

$(function() {
    // holds all the data from the API search
    let i = 0

    // fetches the user's geolocation from the browser
    let getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position){ 
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
        $("#resturant-cards").append($('<div class="card col-xl-4 col-lg-6 col-md-4">').append($("<div>").addClass("card-body").attr("id",num)))
        $(`#${num}`).append($(`<img class="mini-grade" src="assets/images/grade-${obj.grade}.png">`))
        $(`#${num}`).append($(`<h5 class="card-title">${obj.dba}</h5>`))
        $(`#${num}`).append($(`<h6 class="add1 card-subtitle mb-2 text-muted"> ${obj.address1}</h6>`))
        $(`#${num}`).append($(`<h6 class="add2 card-subtitle mb-2 text-muted"> ${obj.address2}</h6>`))
        $(`#${num}`).attr('data-record-date', obj["record_date"])
        $(`#${num}`).attr('data-inspection-date', obj["inspection_date"].substring(0,10))
        $(`#${num}`).attr('data-violation-code', obj["violation_code"])
        $(`#${num}`).attr('data-violation-description', obj["violation_description"])
        $(`#${num}`).attr('data-cuisine', obj["cuisine_description"])
        toGeocode(obj.address1 + " " + obj.address2).then(function(response){ 
            $(`#${num}`).attr('data-longitude', response.bbox[0]);
            $(`#${num}`).attr('data-latitude', response.bbox[1]);
        })
    }

    // build query
    let buildQueryURL = () => {
        var queryURL = "https://data.cityofnewyork.us/resource/9w7m-hzhe.json"

        var queryParam = $("#nav-input").val().trim()
    
        if(/\d{5}/.test(queryParam)) {
            // zipcode
            queryParam = `?zipcode=${queryParam}`
        } else if (/[a-zA-Z]/.test(queryParam)) {
            queryParam = queryParam.toUpperCase()

            if (queryParam === "MANHATTAN" || queryParam === "BROOKLYN" || queryParam === "QUEENS" || queryParam === "BRONX" || queryParam === "STATEN ISLAND") {
                // boro
                queryParam = `?boro=${queryParam}`
            } else {
                // resturant name
                queryParam = `?dba=${queryParam}`
            } 
        }      
        return queryURL + queryParam
    }

    let getResturantList = (lat, long) => {
        
        var queryURL = `https://developers.zomato.com/api/v2.1/geocode?apikey=625bdeced0acd6c03b8a61c2593a9093&lat=${lat}&lon=${long}`
        $.ajax({
            url: queryURL,
            method: "GET"
          }).then(function(response) {
            var data = response.nearby_restaurants
            var currentRestList = []
                
            for(let i = 0; i < data.length; i++){
                currentRestList.push(data[i].restaurant.name)
            }
            allData = []

            currentRestList.forEach(element => {
                
                element = element.toUpperCase()
                var queryURL = `https://data.cityofnewyork.us/resource/9w7m-hzhe.json?dba=${element}`

                $.ajax({
                    url: queryURL,
                    method: "GET",
                    data: {
                        "$where": "grade IS NOT NULL", // Prevents results with undefined grades from showing up in results.
                        "$$app_token" : "jOHHqdrBMVMNGmFWFLpWE22PP" // API token speeds up API retreval speed
                }
                }).then(function(response) {
                    // creates the data array
                    for(let i = 0; i < response.length; i++) {
                        var thisRestaurant = response[i];
                        thisRestaurant.address1 = `${response[i].building} ${response[i].street}`
                        thisRestaurant.address2 = `${response[i].boro}, NY, ${response[i].zipcode}`
                        allData.push(thisRestaurant)
                    }

                    // clears the cards
                    $("#resturant-cards").empty()

                    //for the length of the array will use the createCard function to create the cards
                    allData.forEach(element => {
                        createCard(element, i)
                        i += 1
                    });

                    $("#nav-input").val("")
                })
            })
              
          })
    }
    
    // API search btn
    $("#nav-search").on("click", function(event) {
        event.preventDefault()
        if ($("#nav-input").val().trim() === "Current Location") {
            let restList
            getResturantList(latitude, longitude)

        } else {
            let queryURL = buildQueryURL()

            $.ajax({
                url: queryURL,
                method: "GET",
                data: {
                    "$limit" : 20,
                    "$where": "grade IS NOT NULL", // Prevents results with undefined grades from showing up in results.
                    "$$app_token" : "jOHHqdrBMVMNGmFWFLpWE22PP" // API token speeds up API retreval speed
              }
            }).then(function(response) {
                // clears the data array
                allData = []

                // creates the data array
                for(let i = 0; i < response.length; i++) {
                    var thisRestaurant = response[i];
                    thisRestaurant.address1 = `${response[i].building} ${response[i].street}`
                    thisRestaurant.address2 = `${response[i].boro}, NY, ${response[i].zipcode}`
                    allData.push(thisRestaurant)
                }

                // clears the cards
                $("#resturant-cards").empty()

                //for the length of the array will use the createCard function to create the cards
                allData.forEach(element => {
                    createCard(element, i)
                    i += 1
                });

                $("#nav-input").val("")
            })
        }
    })

    $(document).on("click", ".card", function() {
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