const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.json());

const catalogServerOptions = {
  hostname: "catalog-server",
  port: 8001,
};

app.post("/purchase/:subject", (req, res) => {
  const { subject } = req.params;

  const catalogRequest = http.request(
    `${catalogServerOptions.hostname}:${catalogServerOptions.port}/purchase/${subject}`,
    (catalogResponse) => {
      let data = "";

      catalogResponse.on("data", (chunk) => {
        data += chunk;
      });

      catalogResponse.on("end", () => {
        const catalogData = JSON.parse(data);

        // Check if the item is in stock
        if (!catalogData || catalogData.quantity <= 0) {
          return res.status(400).json({ error: "Item out of stock" });
        }

        const decrementRequest = http.request(
          {
            ...catalogServerOptions,
            path: `/update/${subject}`,
            method: "PUT",
          },
          (decrementResponse) => {
            if (decrementResponse.statusCode === 200) {
              res.json({
                message: `Item ${subject} purchased successfully`,
              });
            } else {
              res.status(500).json({ error: "Error updating stock" });
            }
          }
        );
      });
    }
  );

  catalogRequest.on("error", (error) => {
    console.error("Error querying catalog server:", error);
    res.status(500).json({ error: "Error querying catalog server" });
  });

  catalogRequest.end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
