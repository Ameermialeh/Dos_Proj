const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 8002; // port server order http://172.18.0.8:8002

app.use(bodyParser.json());

// catalog server http://172.18.0.7:8001
const catalogServerOptions = {
  hostname: "172.18.0.7",
  port: 8001,
};

//in order server just purchase api
// the api called by frontend server and then send response to frontend
// http://172.18.0.8:8002/purchase/subject
app.post("/purchase/:subject", (req, res) => {
  const { subject } = req.params; //get item id obj or item name

  //call catalog server to chick if the item is in stock
  const catalogRequest = http.get(
    `http://${catalogServerOptions.hostname}:${catalogServerOptions.port}/purchase/${subject}`,
    //response from server catalog
    (catalogResponse) => {
      let data = "";

      //save response in 'data' as String
      catalogResponse.on("data", (chunk) => {
        data += chunk;
      });

      catalogResponse.on("end", () => {
        const catalogData = JSON.parse(data); //convert from String to json

        // Check if the item is in stock
        if (!catalogData || catalogData.quantity <= 0) {
          return res.status(400).json({ error: "Item out of stock" });
        }
        // if found in stock send PUT query to catalog server to update on item quantity decrement by one
        //call catalog service http://172.18.0.8:8002/update/subject
        const decrementRequestOptions = {
          hostname: catalogServerOptions.hostname,
          port: catalogServerOptions.port,
          path: `/update/${subject}`,
          method: "PUT",
        };
        const decrementRequest = http.request(
          decrementRequestOptions,
          // catalog server response
          (decrementResponse) => {
            const responseData = [];

            // save response data in array
            decrementResponse.on("data", (chunk) => {
              responseData.push(chunk);
            });

            decrementResponse.on("end", () => {
              const responseText = responseData.join("");
              if (decrementResponse.statusCode === 200) {
                const responseObject = JSON.parse(responseText); //convert response to json
                res.json({
                  message: `Item ${responseObject.title} purchased successfully`, // title here is item name
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
    //error in catalog server
    res
      .status(500)
      .json({ error: "Error querying catalog server: " + error.message });
  });

  catalogRequest.end();
});

app.listen(port, () => {
  //here the server running on port 8002
  console.log(`Server is running on port ${port}`);
});
