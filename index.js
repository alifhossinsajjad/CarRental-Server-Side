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
    await client.connect();
    
    const carRentalUsersDb = client.db("car_rentaldb");
    const usersCollection = carRentalUsersDb.collection("users"); 

    //users api 
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query); 

      if (existingUser) {
        res.status(409).send({ message: "User already exists. Please use another email." }); 
      } else {
        const result = await usersCollection.insertOne(newUser); 
        res.send(result);
      }
    });

  
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`car rental server is running on port : ${port}`);
});