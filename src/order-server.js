const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 8002;

app.use(bodyParser.json());

const catalogServerOptions = {
  hostname: "localhost",
  port: 8001,
};

app.post("/purchase/:subject", (req, res) => {
  const { subject } = req.params;
  console.log(subject);
  const catalogRequest = http.get(
    `http://${catalogServerOptions.hostname}:${catalogServerOptions.port}/purchase/${subject}`,
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

        const decrementRequestOptions = {
          hostname: catalogServerOptions.hostname,
          port: catalogServerOptions.port,
          path: `/update/${subject}`,
          method: "PUT",
        };
        const decrementRequest = http.request(
          decrementRequestOptions,
          (decrementResponse) => {
            const responseData = [];

            decrementResponse.on("data", (chunk) => {
              responseData.push(chunk);
            });

            decrementResponse.on("end", () => {
              const responseText = responseData.join("");
              if (decrementResponse.statusCode === 200) {
                const responseObject = JSON.parse(responseText);
                res.json({
                  message: `Item ${responseObject.title} purchased successfully`,
                });
              } else {
                res.status(500).json({
                  error: "Error updating stock",
                  response: responseData,
                });
              }
            });
          }
        );
        decrementRequest.end();
      });
    }
  );

  catalogRequest.on("error", (error) => {
    res
      .status(500)
      .json({ error: "Error querying catalog server: " + error.message });
  });

  catalogRequest.end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
