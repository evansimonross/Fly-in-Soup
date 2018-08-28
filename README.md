# Fly-in-Soup

Fly-in-Soup is a tool for New Yorkers to easily access the health inspection data on restaurants in their area.

## How to Use
[Click here to try the app for yourself](https://evansimonross.github.io/Fly-in-Soup/).

To use this app, simply input a search and hit enter! Valid search parameters include the following: 

- **Current Location**: If the user allows the browser to access their location, the restaurant list is populated with nearby restaurants recommended on Zomato
- **Restaurant Name**: If the user enters a restaurant name, the restaurant list is populated with any restaurants by that name from the health department database
- **Zip Code**: If the user enters a zip code, all restaurants in the database from that zip code are loaded.
- **Borough**: If the user enters the name of one of New York's five boroughs, restaurants in the database from that borough are loaded. This may take some time.
- **Favorites**: If the user has a list of favorites already saved locally to their browser, or to their logged-in account, the restaurant list is populated with those favorites.

The restaurant list appears as a list of cards on the left side of the screen. The card includes the restaurant name, address and most recent health inspection grade. Clicking a card displays a modal with more information about that restaurant's most recent inspection.

Meanwhile, each of the restaurants also appears on the map to the right. The color of the marker matches the color of the health inspection grade (down to the RGB value!). Clicking on a marker displays the restaurant card right in the map. That card can also be clicked to display more info. 

Each card also has a favorite icon that can be clicked to add that restaurant to your favorites list. This list is saved on local storage if the user isn't logged in, and on our database if not. Currently, our database is only being used to store favorites, but it may be expanded in the future. We will never use your email address or data for anything unrelated to the functionality of our app. 


## Project History

This web application was designed with love by [Katherine He](https://github.com/kitkat0202), [Evan Simon Ross](https://github.com/evansimonross), & [Jano Roze](https://github.com/Jroze88). It is the first project for the first cohort of the Columbia Full Stack Web Development Coding Bootcamp.

## Credits

We used the following free APIs to build this application:
- [Department of Health and Mental Health New York City Restaurant Inspection Results](https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j)
- [NYC Planning Labs GeoSearch Beta](https://geosearch.planninglabs.nyc/)
- [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/)
- [Zomato](https://developers.zomato.com/api)

We used the following additional technologies:
- [Firebase Database & Firebase Authentication](https://firebase.google.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Bootstrap-xxl](https://bootstrap-xxl.com/)
- [Font Awesome](https://fontawesome.com/)

Our Fly-in-Soup logo is adapted from [squeakypics](http://www.squeakypics.co.uk/blog/2011/06/fly-soup/fly_soup/)