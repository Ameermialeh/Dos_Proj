const http = require("http");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 8001; // port server catalog http://172.18.0.7:8001

// declare data base and open it as READWRITE
const db = new sqlite3.Database("catalog.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the database.");
  }
});

// Search end point request come from order
// http://172.18.0.7:8001/purchase/queryParam
app.get("/purchase/:queryParam", (req, res) => {
  const { queryParam } = req.params;

  // Check if the query parameter is a number (item ID) or a string (item name)
  const isItemId = /^\d+$/.test(queryParam);

  let query;
  let params;
  if (isItemId) {
    //if queryParam was id then select from db where id = queryParam
    query = "SELECT * FROM catalog WHERE id = ?";
    params = [queryParam];
  } else {
    //if queryParam was item name then select from db where title = queryParam
    query = "SELECT * FROM catalog WHERE title LIKE ?";
    params = [`%${queryParam}%`];
  }
  //send query to db
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    rows.forEach((row) => {
      // send the quantity for the item as res
      res.json({
        quantity: row.quantity,
      });
    });
  });
});
// Search end point request come from frontend
// http://172.18.0.7:8001/search/searchTerm
app.get("/search/:searchTerm", (req, res) => {
  const { searchTerm } = req.params; //search by item name or item type
  let query;
  let params;

  if (
    searchTerm == "distributed systems" ||
    searchTerm == "undergraduate school"
  ) {
    //if searchTerm was item type then select from db where type = searchTerm
    query = "SELECT id, title FROM catalog WHERE type LIKE ?";
    params = [`%${searchTerm}%`];
  } else {
    //if searchTerm was item name then select from db where title = searchTerm
    query = "SELECT id, title FROM catalog WHERE title LIKE ?";
    params = [`%${searchTerm}%`];
  }

  //send query to db
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    //if there is data from response send it to frontend
    if (rows && rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).json({ error: "Items not founds" });
    }
  });
});
// Info end point request come from frontend
// http://172.18.0.7:8001/info/itemId
app.get("/info/:itemId", (req, res) => {
  const { itemId } = req.params;
  let query = "SELECT * FROM catalog WHERE id LIKE ?"; //select everything from db when id = itemId

  db.all(query, [itemId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    //if there is data from response send it to frontend
    if (rows && rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).json({ error: "Items not founds" });
    }
  });
});

// Info end point request come from order
// http://172.18.0.7:8001/update/itemId
app.put("/update/:itemId", (req, res) => {
  try {
    const { itemId } = req.params;
    const isNumeric = !isNaN(itemId); //chick itemID if it is String or number

    const key = isNumeric ? "id" : "title";
    const value = isNumeric ? parseInt(itemId) : itemId;
    //chick if the item exist in db
    //if itemId <= 4 because we have for item
    if (value <= 4 || !isNumeric) {
      // Query the catalog table in the SQLite database by item ID or title
      db.all(`SELECT * FROM catalog WHERE ${key} = ?`, [value], (err, rows) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Internal server error" });
        }

        const q = rows[rows.length - 1].quantity; // save the quantity of item i 'q'
        const title = rows[0].title; // save the title of item i 'title'

        // chick if item found in stock
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
              //send name of item to order server
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
  //here the server running on port 8001
  console.log(`Server is running on port ${port}`);
});
