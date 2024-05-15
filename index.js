const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// jwt
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 9000;
const app = express();

// middleware
const corsOption = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://assign11-client.web.app",
    "https://assign11-client.firebaseapp.com",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());
console.log(process.env.DB_USER);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7hlvjai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// jwt middleware
// const logger = (req, res, next) => {
//   console.log("log : info", req.method, req.url);
//   next();
// };
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);

  if (!token)
    return res.status(401).send({ message: "You have unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "unauthorized access" });
      }
      console.log(decoded);

      req.user = decoded;
      next();
    });
  }
};
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
          secure: process.env.NODE_ENV === "production",
          // secure: false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Clear token (on logout)
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    // all foods
    app.get("/foods", async (req, res) => {
      // const search = req.query.search;
      // // let query = {
      // //   food_name: { $regex: search, $option: "i" },
      // // };
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
      console.log("order", req.cookies);
      const query = {
        email: orderPlaced.email,
        orderId: orderPlaced.orderId,
        quantityLeft: orderPlaced.quantityLeft,
      };
      const alreadyOrdered = await orderCollection.findOne(query);
      // if (alreadyOrdered) {
      //   return res.status(400).send("You have already purchased");
      // }
      console.log(orderPlaced.email);
      const result = await orderCollection.insertOne(orderPlaced);
      res.send(result);
      console.log(result);
    });

    // save food item
    app.post("/food", async (req, res) => {
      const foodData = req.body;

      const result = await foodsCollection.insertOne(foodData);
      res.send(result);
      console.log(result);
    });

    // get food table by email
    app.get("/foods/:email", async (req, res) => {
      const email = req.params.email;
      // const tokenEmail = req.user.email;
      // if (tokenEmail !== email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      const query = { "buyer.email": email };
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    // delete food item
    app.delete("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
    });
    // update food item

    app.put("/food/:id", async (req, res) => {
      const id = req.params.id;
      const foodData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...foodData,
        },
      };
      const result = await foodsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    // all purchase data
    app.get("/my-purchase/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    // purchase for food owner
    app.get("/purchase-requests/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
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
