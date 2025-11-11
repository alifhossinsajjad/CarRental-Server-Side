const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.CARRENTAL_USER}:${process.env.CARRENTAL_PASS}@crud-project.eyn7az2.mongodb.net/?appName=CRUD-PROJECT`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("car rental Server is running fine!");
});

async function run() {
  try {
    // await client.connect();

    const carRentalUsersDb = client.db("car_rentaldb");
    const usersCollection = carRentalUsersDb.collection("users");
    const carsCollections = carRentalUsersDb.collection("cars");
    const bookingsCollections = carRentalUsersDb.collection("bookings");

    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    //users api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        res
          .status(409)
          .send({ message: "User already exists. Please use another email." });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    });

    //all cars api
    app.get("/cars", async (req, res) => {
      const result = await carsCollections.find().toArray();
      res.send(result);
    });

    //car post api
    app.post("/cars", async (req, res) => {
      try {
        const newCar = req.body;
        const carData = {
          ...newCar,
          status: "Available",
          rating: 4.5,
          created_at: new Date(),
          rentPricePerDay: Number(newCar.rentPricePerDay),
          Seats: Number(newCar.Seats),
        };

        const result = await carsCollections.insertOne(carData);

        res.status(201).json({
          success: true,
          message: "Car added successfully!",
          data: {
            _id: result.insertedId,
            ...carData,
          },
        });
      } catch (error) {
        console.error("Error adding car:", error);
        res.status(500).json({
          success: false,
          message: "Failed to add car",
          error: error.message,
        });
      }
    });

    //get the signle cars data with id
    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollections.findOne(query);
      res.send(result);
    });

    //get the newst cars
    app.get("/latest-cars", async (req, res) => {
      const cursor = carsCollections.find().sort({ created_at: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    //update car
    app.patch("/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const updateCar = req.body;

        const query = { _id: new ObjectId(id) };

        const result = await carsCollections.updateOne(query, {
          $set: {
            rentPricePerDay: Number(updateCar.rentPricePerDay),
            carName: updateCar.carName,
            carModel: updateCar.carModel,
            image: updateCar.image,
            category: updateCar.category,
          },
        });

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Error updating car", error: error.message });
      }
    });

    //my-listing api
    app.get("/my-listing", async (req, res) => {
      const email = req.query.email;
      const result = await carsCollections
        .find({
          created_by: email,
        })
        .toArray();

      res.send(result);
    });

    //delete car
    app.delete("/my-bookings/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { carId: id };
      const result = await bookingsCollections.deleteOne(query);
      res.send(result);
    });

    //my booking gei api
    app.get("/my-bookings", async (req, res) => {
      const email = req.query.email;
      const result = await bookingsCollections
        .find({
          booked_by: email,
        })
        .toArray();

      res.send(result);
    });

    //delete car
    app.delete("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollections.deleteOne(query);
      res.send(result);
    });

    //booked car api
    app.post("/my-bookings/:id", async (req, res) => {
      const data = req.body;
      // console.log('booking data',data);
      const id = req.params.id;
      const result = await bookingsCollections.insertOne(data);
      // console.log('booking result',result);
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: { status: "Booked" },
      };
      const bookedStatus = await carsCollections.updateOne(query, update);
      res.send(result, bookedStatus);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Database connection error:", error);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`car rental server is running on port : ${port}`);
});
