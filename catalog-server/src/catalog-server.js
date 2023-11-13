const http = require("http");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 8001;

const db = new sqlite3.Database("catalog.db");

db.run(`DROP TABLE IF EXISTS catalog`, (err) => {
  if (err) {
    console.error("Error dropping table:", err.message);
  } else {
    console.log("Table dropped successfully");

    // Create a new catalog table with reset id
    db.run(
      `CREATE TABLE IF NOT EXISTS catalog (
      id INTEGER PRIMARY KEY,
      title TEXT,
      quantity INTEGER,
      price DOUBLE,
      type TEXT
    )`,
      (createErr) => {
        if (createErr) {
          console.error("Error creating table:", createErr.message);
        } else {
          console.log("Table created successfully");

          const catalogData = [
            {
              title: "How to get a good grade in DOS in 40 minutes a day",
              quantity: 10,
              price: 50,
              type: "distributed systems",
            },
            {
              title: "RPCs for Noobs",
              quantity: 23,
              price: 30,
              type: "distributed systems",
            },
            {
              title: "Xen and the Art of Surviving Undergraduate School",
              quantity: 55,
              price: 20,
              type: "undergraduate school",
            },
            {
              title: "Cooking for the Impatient Undergrad",
              quantity: 59,
              price: 50,
              type: "undergraduate school",
            },
          ];

          let lastId = 0;
          const insertData = () => {
            catalogData.forEach((item) => {
              const { title, quantity, type, price } = item;
              lastId++;
              db.run(
                "INSERT INTO catalog (id, title, quantity, type, price) VALUES (?, ?, ?, ?, ?)",
                [lastId, title, quantity, type, price],
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
        }
      }
    );
  }
});

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
  let query;
  let params;
  if (
    searchTerm == "distributed systems" ||
    searchTerm == "undergraduate school"
  ) {
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
      res.status(404).json({ error: "Items not founds" });
    }
  });
});

app.get("/info/:itemId", (req, res) => {
  const { itemId } = req.params;
  let query = "SELECT * FROM catalog WHERE id LIKE ?";

  db.all(query, [itemId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (rows && rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).json({ error: "Items not founds" });
    }
  });
});

app.put("/update/:itemId", (req, res) => {
  try {
    const { itemId } = req.params;
    const isNumeric = !isNaN(itemId);

    const key = isNumeric ? "id" : "title";
    const value = isNumeric ? parseInt(itemId) : itemId;
    if (value <= 4 || !isNumeric) {
      // Query the catalog table in the SQLite database by item ID
      db.all(`SELECT * FROM catalog WHERE ${key} = ?`, [value], (err, rows) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Internal server error" });
        }

        const q = rows[rows.length - 1].quantity;
        const title = rows[0].title;

        if (rows && q > 0) {
          // Decrease the quantity by one
          const updatedQuantity = q - 1;

          // Update the quantity in the database
          db.run(
            `UPDATE catalog SET quantity = ? WHERE ${key} = ?`,
            [updatedQuantity, value],
            (updateErr) => {
              if (updateErr) {
                console.error(updateErr.message);
                return res.status(500).json({ error: "Internal server error" });
              }

              res.status(200).json({
                title: title,
                message: "Quantity updated successfully",
              });
            }
          );
        } else {
          res.status(404).json({ error: "Item not found or out of stock" });
        }
      });
    } else {
      res.status(404).json({ error: "Item not found or out of stock" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});