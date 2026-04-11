const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

mongoose.connect("mongodb+srv://admin:Finance123@cluster0.hngsoga.mongodb.net/?appName=Cluster0")
.then(() => console.log("DB Connected ✅"))
.catch(err => console.log(err));



// EXPENSE MODEL
const Expense = require("./models/Expense");



// Add Expense API
app.post("/add-expense", async (req, res) => {
  try {
    const { title, amount, category } = req.body;

    const newExpense = new Expense({
      title,
      amount,
      category
    });

    await newExpense.save();

    res.status(201).json({
      message: "Expense added successfully",
      data: newExpense
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get All Expenses API
app.get("/get-expenses", async (req, res) => {
  try {
    const expenses = await Expense.find();

    res.status(200).json(expenses);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete Expense API
app.delete("/delete-expense/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      message: "Expense deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Expense API
app.put("/update-expense/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { title, amount, category },
      { new: true }
    );

    res.status(200).json({
      message: "Expense updated successfully",
      data: updatedExpense
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});