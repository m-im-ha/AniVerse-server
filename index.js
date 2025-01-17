const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mimha007.i7mwd.mongodb.net/?retryWrites=true&w=majority&appName=mimha007`;

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
    const database = client.db("movieDB");
    const movieCollection = database.collection("movies");
    const userCollection = database.collection("users");

    app.get("/movies", async (req, res) => {
      const cursor = movieCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.findOne(query);
      res.send(result);
    });

    app.get("/features", async (req, res) => {
      const cursor = movieCollection
        .find()
        .sort({ movieRating: -1 })
        .limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/favorites/:userId", async (req, res) => {
      const { userId } = req.params;
      try {
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        if (user && user.favorites) {
          const movieIds = user.favorites.map((id) => new ObjectId(String(id)));
          const movies = await movieCollection.find({ _id: { $in: movieIds } }).toArray();
          res.send(movies);
        } else {
          res.send({ message: "User or favorites not found" });
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
        res.send({ message: "Internal Server Error" });
      }
    });
    
    

    app.post("/movies", async (req, res) => {
      const newMovie = req.body;
      // console.log(newMovie);
      const result = await movieCollection.insertOne(newMovie);
      res.send(result);
    });

    app.patch("/movies/:id", async (req, res) => {
      const { id } = req.params;
      const updatedMovie = req.body;
    
      try {
        const result = await movieCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedMovie }
        );
    
        if (result.modifiedCount > 0) {
          const updatedData = await movieCollection.findOne({ _id: new ObjectId(id) });
          res.send(updatedData);
        } else {
          res.send({ message: "Movie not found or not updated" });
        }
      } catch (error) {
        console.error("Error updating movie:", error);
        res.send({ message: "Internal Server Error" });
      }
    });
    
    

    app.get("/users", async (req, res) => {
      const { email } = req.query;
      if (!email) {
        return res.send({ message: "Email query parameter is required" });
      }
    
      try {
        const user = await userCollection.findOne({ email }); // Search for user by email
        if (user) {
          res.send(user); // Return the user object
        } else {
          res.send({ message: "User not found" });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        res.send({ message: "Internal Server Error" });
      }
    });
    

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      // console.log(`newuser : `, newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.post("/favorites/:userId", async (req, res) => {
      const { userId } = req.params; // Extract userId from URL params
      const { movieId } = req.body; // Extract movieId from request body
    
      // console.log("Received userId:", userId);
    
      // Validate userId
      if (!ObjectId.isValid(userId)) {
        return res.send({ message: "Invalid user ID format" });
      }
    
      try {
        const result = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $addToSet: { favorites: movieId } } // $addToSet avoids duplicate entries
        );
        if (result.modifiedCount > 0) {
          res.send({ message: "Movie added to favorites" });
        } else {
          res.send({ message: "User not found or movie already in favorites" });
        }
      } catch (error) {
        console.error("Error adding to favorites:", error);
        res.send({ message: "Internal Server Error" });
      }
    });

    app.delete("/favorites/:userId/:movieId", async (req, res) => {
      const { userId, movieId } = req.params;
    
      // Validate userId
      if (!ObjectId.isValid(userId) || !ObjectId.isValid(movieId)) {
        return res.status(400).send({ message: "Invalid ID format" });
      }
    
      try {
        const result = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $pull: { favorites: movieId } } // Remove the movieId from favorites array
        );
    
        if (result.modifiedCount > 0) {
          res.send({ message: "Movie removed from favorites" });
        } else {
          res.send({ message: "User or movie not found in favorites" });
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
        res.send({ message: "Internal Server Error" });
      }
    });

    app.delete("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`server is running`);
});

app.listen(PORT, () => {
  // console.log(`server is running on the ${PORT}`);
});
