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

      if (habit.completedDates?.includes(today)) {
        return res
          .status(400)
          .send({ message: "Already marked complete today" });
      }

      const updatedDates = [...(habit.completedDates || []), today];
      const now = new Date();
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      const completedLast30 = updatedDates.filter(
        (d) => new Date(d) >= past30 && new Date(d) <= now
      );
      const progress = Math.min(
        100,
        Math.round((completedLast30.length / 30) * 100)
      );

      const sortedDays = updatedDates
        .map((d) => new Date(d))
        .sort((a, b) => b - a);
      let streak = 0;
      let todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedDays.length; i++) {
        const day = sortedDays[i];
        const diff = (todayDate - day) / (1000 * 60 * 60 * 24);
        if (diff === 0 || diff === 1) {
          streak++;
          todayDate = new Date(day);
          todayDate.setDate(todayDate.getDate() - 1);
        } else break;
      }

      if (streak === 0) streak = 1;

      await HabitCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { completedDates: updatedDates, progress, streak } }
      );

      const updatedHabit = await HabitCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(updatedHabit);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
