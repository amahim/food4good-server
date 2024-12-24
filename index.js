const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kreq4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const foodsCollection = client.db("food4good").collection("foods");
    const requestedFoodsCollection = client.db("food4good").collection("reqFoods");

    // CODE WRITING ARENA START -------------------------

    // adding foods to database
    app.post("/foods", async (req, res) => {
      const newFood = req.body;
      const result = await foodsCollection.insertOne(newFood);
      res.send(result);
    });

    // getting all foods/serch/email filter
    app.get("/foods", async (req, res) => {
      const { searchParams, email } = req.query;
      let query = {};

      // Add search filter if searchParams exist
      if (searchParams) {
        query = { foodName: { $regex: searchParams, $options: "i" } };
      }

      // Add email filter
      if (email) {
        query = { "donor.email": email };
      }

      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    
    // Delete food from both 'foods' and 'requested-foods' databases
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const requestedFoodsQuery = { foodId: id }; // Match the foodId in requested-foods

      // Delete food from 'foods' collection
      const deleteFoodResult = await foodsCollection.deleteOne(query);

      // Delete  food from 'requested-foods' collection toooo
      const deleteRequestedFoodResult =
        await requestedFoodsCollection.deleteMany(requestedFoodsQuery);

      res.send({
        foodDeleted: deleteFoodResult,
        requestedFoodsDeleted: deleteRequestedFoodResult,
      });
    });


    // Update a food item
app.patch("/foods/:id", async (req, res) => {
  const id = req.params.id; 
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true }; 
  const updatedFood = req.body; 

  const food = {
    $set: {
      foodName: updatedFood.foodName,
      foodImage: updatedFood.foodImage,
      foodQuantity: updatedFood.foodQuantity,
      pickupLocation: updatedFood.pickupLocation,
      expireDate: updatedFood.expireDate,
      additionalNotes: updatedFood.additionalNotes,
      status: updatedFood.status,
    },
  };

    const result = await foodsCollection.updateOne(filter, food, options);
    res.send(result);
  
});


    //and for dtls
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // adding requested foods to database
    app.post("/requested-foods", async (req, res) => {
      const newReqFood = req.body;
      const result = await requestedFoodsCollection.insertOne(newReqFood);
      res.send(result);
    });

    // getting req  foods or filtering email......
    app.get("/requested-foods", async (req, res) => {
      const { email } = req.query;
      let query = {};
      if (email) {
        query = { requestedBy: email };
      }
      const foods = await requestedFoodsCollection.find(query).toArray();
      res.send(foods);
    });

    // requested food making the available status => requested
    app.patch("/update-status/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      // Update the food's status in the "foods" collection
      const result = await foodsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "Requested" } }
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
  res.send("FoodSharing server is running");
});

app.listen(port, () => {
  console.log(`FoodSharing server is running on port ${port}`);
});
