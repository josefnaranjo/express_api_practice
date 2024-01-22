### This Express endpoint application queries a local database created on MySQL. The table contains car data, including the make, model, year, and whether or not the car is marked as deleted (deleted_flag).

Endpoints:
- The GET endpoint queries the database and fetches all the data in the `car` table where the `deleted_flag` value is 0, then returns the data to the front end.
- The PUT endpoint updates a column of a specific row in the `car` table with data sent from the front end.
- The POST endpoint adds a new record from the front end in the `car` table.
- The DELETE endpoint changes the `deleted_flag` value of a specific row in the `car` table from 0 to 1 to signify it as "deleted."
