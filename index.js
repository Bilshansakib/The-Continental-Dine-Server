const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// jwt
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 9000;
const app = express();

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
console.log(process.env.DB_USER);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7hlvjai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // get all foods
    const foodsCollection = client.db("myRestaurant").collection("foodItems");
    const orderCollection = client.db("myRestaurant").collection("orders");

    // all foods
    app.get("/foods", async (req, res) => {
      const result = await foodsCollection.find().toArray();

      res.send(result);
    });
    // single food data
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });
    app.get("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });
    // save order
    app.post("/order", async (req, res) => {
      const orderPlaced = req.body;
      console.log(orderPlaced);
      const result = await orderCollection.insertOne(orderPlaced);
      res.send(result);
    });

    // save food item
    app.post("/food", async (req, res) => {
      const foodData = req.body;

      const result = await foodsCollection.insertOne(foodData);
      res.send(result);
      console.log(result);
    });

    // auth related api jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          // secure: process.env.NODE_ENV === "production" ,
          secure: false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from saaqib server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
