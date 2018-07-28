$(function() {
    // holds all the data from the API search
    let allData = []
    let i = 0

    // creates the objects from the data
    function RestObject(name, address1, address2, grade, vIcon) {
        this.name = name
        this.address1 = address1
        this.address2 = address2
        this.grade = grade
        this.vIcon = vIcon
    }

    // delete then creates the cards in HTML
    let createCard = (obj, num) => {
        $("#resturant-cards").append($('<div class="card col-xl-4 col-lg-6 col-md-4">').append($("<div>").addClass("card-body").attr("id",num)))
        $(`#${num}`).append($(`<h5 class="card-title">${obj.name}</h5>`))
        $(`#${num}`).append($(`<h6 class="add1 card-subtitle mb-2 text-muted"> ${obj.address1}</h6>`))
        $(`#${num}`).append($(`<h6 class="add2 card-subtitle mb-2 text-muted"> ${obj.address2}</h6>`))
        $(`#${num}`).append($(`<p class="grade card-text"> Grade: ${obj.grade}</p>`))
        $(`#${num}`).append($(`<p class="v-icon card-text"> Violation Code: ${obj.vIcon}</p>`))
    }

    // build query
    let buildQueryURL = () => {
        var queryURL = "https://data.cityofnewyork.us/resource/9w7m-hzhe.json"

        var queryParam = $("#nav-input").val().trim()
    
        if(/\d{5}/.test(queryParam)) {
            // zipcode
            queryParam = `?zipcode=${queryParam}`
        } else if (/^[a-zA-Z]$/.test(queryParam)) {
            queryParam.toUpperCase()

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
    


    // API search btn
    $("#nav-search").on("click", function(event) {
        event.preventDefault()
        var queryURL = buildQueryURL()  

        $.ajax({
            url: queryURL,
            method: "GET",
            data: {
                "$limit" : 20,
                "$$app_token" : "jOHHqdrBMVMNGmFWFLpWE22PP" // API token speeds up API retreval speed
              }
          }).then(function(responce) {
            // clears the data array
            allData = []

            // creates the data array
            for(let i = 0; i < responce.length; i++) {
                var thisResturant = new RestObject(responce[i].dba, `${responce[i].building} ${responce[i].street}`, `${responce[i].boro}, NY, ${responce[i].zipcode}`, responce[i].grade ,responce[i].violation_code)
                allData.push(thisResturant)
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

    $(document).on("click", ".card", function() {
        let resturantName = $(this).find(".card-title").text()
        let fullAddress = $(this).find(".add1").text() + " " + $(this).find(".add2").text()
        let grade = $(this).find(".grade").text()
        let vcode = $(this).find(".v-icon").text()

        let index = allData.findIndex(x => x.name === resturantName);
        

        $("#modal-name").text(resturantName)
        
        ///////////////////////// need to replace with real map ////////////////////////////
        $(".modal-body").html($('<div class="text-center"><img id="modal-map" src="assets/images/modal-map.png" alt="map"></div>'))
        $(".modal-body").append($(`<h6 class="text-center text-muted">${fullAddress}</h6>`))
        $(".modal-body").append($(`<div class="row modal-row"><div class="col-md-6"><p><strong>Grade:</strong> ${grade}</p></div><div class="col-md-6"><p><strong>Viloation Code:</strong> ${vcode}</p></div></div>`))
        
        // more info part
        $(".modal-body").append($("<h5>").text("Additional Information"))
        $(".modal-body").append($("<ul>").addClass("more-info"))

        ////////////////////////////////////////////////////////////////////////////////////////////
        // when we have more info to add un commetn this out
        // for (let i = 0; i < allData[index].more-info.length; i++) {
        //     $(".more-info").append($("<li>").text(allData[index].more-info[i]))
        // }



        ///////////////////////// Function for opening id="dialog-confirm" modal on the page//////////
        // $( function() {
        //     $( "#dialog-confirm" ).dialog("open");
        //     } );
    })
})