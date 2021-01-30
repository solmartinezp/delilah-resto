Delilah Restó
Delilah Restó is a food ordering app for restaurants.

Installation of dependencies
npm install

Preparing the DB
First you need to create a database in your mySQL Server named 'resto'.
After that you need to run the queries stored in the .mysql files (following that specific order),
which you can find in the database folder.
Finally you must setup an .env file at the root of the delilah-resto directory (similar to the example.env file)
with the configuration of your mySQL database.

To run locally
To run the service locally, you must run the following command:

npm run start

Swagger
There is a swagger file with the documentation of the API 

Postman collection
There is a postman collection to test the endpoints locally.
