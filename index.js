const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const uri =
  "mongodb+srv://smart_deals:RFuV4p6UXMHcmatX@cluster0.6l2dtxw.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    const database = client.db("habitTracker");
    const HabitCollection = database.collection("habits");

    //get Methode

    app.get("/habits/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const habit = await HabitCollection.findOne(query);
      res.send(habit);
    });

    app.get("/habits", async (req, res) => {
      const queryemail = req.query.email;
      const query = {};

      if (queryemail) {
        query.UserEmail = queryemail;
      }
      const cursor = HabitCollection.find(query).sort({ createAt: -1 });
      const habits = await cursor.toArray();
      res.send(habits);
    });

    //post mathode

    app.post("/habits", async (req, res) => {
      const habit = req.body;
      const result = await HabitCollection.insertOne(habit);
      res.send(result);
    });

    //delete mathode

    app.delete("/habits/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await HabitCollection.deleteOne(query);
      res.send(result);
    });

    //patch mathode

    app.patch("/habits/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await HabitCollection.updateOne(query, { $set: req.body });
      res.send(result);
    });

    app.patch("/habits/:id/complete", async (req, res) => {
      const id = req.params.id;
      const habit = await HabitCollection.findOne({ _id: new ObjectId(id) });
      if (!habit) return res.status(404).send({ message: "Habit not found" });

      const today = new Date().toISOString().split("T")[0];

      if (habit.completedDates && habit.completedDates.includes(today)) {
        return res
          .status(400)
          .send({ message: "Already marked complete today" });
      }

      const updated = await HabitCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { completedDates: today },
        }
      );

      res.send({ message: "Habit marked complete successfully", updated });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
