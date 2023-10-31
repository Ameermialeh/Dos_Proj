const http = require("http");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 8001;

const db = new sqlite3.Database("catalog.db");
db.run(`CREATE TABLE IF NOT EXISTS catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  quantity INTEGER,
  price DOUBLE,
  type TEXT
)`);
const catalogData = [
  {
    title: "How to get a good grade in DOS in 40 minutes a day",
    quantity: 10,
    price: 50,
    type: "distributed systems",
  },
  {
    title: "RPCs for Noobs",
    quantity: 5,
    price: 30,
    type: "distributed systems",
  },
  {
    title: "Xen and the Art of Surviving Undergraduate School",
    quantity: 5,
    price: 20,
    type: "undergraduate school",
  },
  {
    title: "Cooking for the Impatient Undergrad",
    quantity: 5,
    price: 50,
    type: "undergraduate school",
  },
];
const insertData = () => {
  catalogData.forEach((item) => {
    const { title, quantity, type } = item;
    db.run(
      "INSERT INTO catalog (title, quantity, type) VALUES (?, ?, ?)",
      [title, quantity, type],
      (err) => {
        if (err) {
          console.error("Error inserting data:", err.message);
        } else {
          console.log("Data inserted successfully:", title);
        }
      }
    );
  });
};
insertData();

app.get("/purchase/:queryParam", (req, res) => {
  const { queryParam } = req.params;

  // Check if the query parameter is a number (item ID) or a string (item name)
  const isItemId = /^\d+$/.test(queryParam);

  let query;
  let params;
  if (isItemId) {
    query = "SELECT * FROM catalog WHERE id = ?";
    params = [queryParam];
  } else {
    query = "SELECT * FROM catalog WHERE title LIKE ?";
    params = [`%${queryParam}%`];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    rows.forEach((row) => {
      res.json({
        quantity: row.quantity,
      });
    });
  });
});

app.get("/search/:searchTerm", (req, res) => {
  const { searchTerm } = req.params;
  const isSearchByType = req.path.includes("type"); // Check if search is by type

  let query;
  let params;
  if (isSearchByType) {
    query = "SELECT id, title FROM catalog WHERE type LIKE ?";
    params = [`%${searchTerm}%`];
  } else {
    query = "SELECT id, title FROM catalog WHERE title LIKE ?";
    params = [`%${searchTerm}%`];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (rows && rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).json({ error: "Items not found" });
    }
  });
});

app.put("/update/:itemId", (req, res) => {
  const { param } = req.params;
  const isNumeric = !isNaN(param);

  const key = isNumeric ? "id" : "title";
  const value = param;
  console.log(key);
  console.log(value);
  // Query the catalog table in the SQLite database by item ID
  db.all(`SELECT * FROM catalog WHERE ${key} = ?`, [value], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    rows.forEach((row) => {
      if (row && row.quantity > 0) {
        // Decrease the quantity by one
        const updatedQuantity = row.quantity - 1;

        // Update the quantity in the database
        db.run(
          `UPDATE catalog SET quantity = ? WHERE ${key} = ?`,
          [updatedQuantity, value],
          (updateErr) => {
            if (updateErr) {
              console.error(updateErr.message);
              return res.status(500).json({ error: "Internal server error" });
            }

            res.status(200).json({ message: "Quantity updated successfully" });
          }
        );
      } else {
        res.status(404).json({ error: "Item not found or out of stock" });
      }
    });
  });
});

// db.close((err) => {
//   if (err) {
//     console.error("Error closing database:", err.message);
//   } else {
//     console.log("Database connection closed.");
//   }
// });
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
