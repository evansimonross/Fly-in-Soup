// Search a restaurant by name in the health inspection database. 
function searchRestaurant(restaurantName){
    var queryUrl = "https://data.cityofnewyork.us/resource/9w7m-hzhe.json?dba=" + restaurantName.toUpperCase().replace(" ", "+");
    $.ajax({
        url: queryUrl,
        method: "GET"
    }).then(function(response){
        console.log(response);
    });
}