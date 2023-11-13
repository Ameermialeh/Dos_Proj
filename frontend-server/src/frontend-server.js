const http = require("http");
const express = require("express");
const app = express();
const port = 8000; // port server frontend http://172.18.0.6:8000

//info end point http://172.18.0.6:8000/info/itemID
app.get("/info/:itemId", (req, res) => {
  const { itemId } = req.params; //get item id obj

  try {
    const catalogRequest = http.get(
      `http://172.18.0.7:8001/info/${itemId}`, //call catalog service http://172.18.0.7:8001/info/itemID
      //response from server catalog
      (catalogRes) => {
        let data = "";

        //save response in data as String
        catalogRes.on("data", (chunk) => {
          data += chunk;
        });
        //send response server frontend to user
        catalogRes.on("end", () => {
          //chick if status of res catalog is 200 (ok)
          if (catalogRes.statusCode === 200) {
            const responseObject = JSON.parse(data); //convert data from String to json format
            res.json(responseObject); //send res to user
          } else {
            //if status code from catalog server is 404 then Item not found in data base
            res.status(404).json({
              error: "Item not found",
            });
          }
        });
      }
    );
    // if there an error in catalog server then send status 500 to user
    catalogRequest.on("error", (error) => {
      res.status(500).json({
        error: "Error: catalog server dose not running: " + error.message,
      });
    });

    catalogRequest.end();
  } catch (e) {
    console.log(e);
  }
});

// the Api can search by item ID or topic name
//Search end point http://172.18.0.6:8000/search/itemID
//Search end point http://172.18.0.6:8000/search/topic
app.get("/search/:query", (req, res) => {
  const { query } = req.params; //get item id or item topic obj

  try {
    const catalogRequest = http.get(
      `http://172.18.0.7:8001/search/${query}`, //call catalog service http://172.18.0.7:8001/search/itemID or topic
      (catalogRes) => {
        let data = "";
        //Same as info api
        catalogRes.on("data", (chunk) => {
          data += chunk;
        });
        catalogRes.on("end", () => {
          if (catalogRes.statusCode === 200) {
            const responseObject = JSON.parse(data);
            res.json(responseObject);
          } else {
            res.status(404).json({
              error: "item not found",
            });
          }
        });
      }
    );
    catalogRequest.on("error", (error) => {
      res.status(500).json({
        error: "Error: catalog server dose not running: " + error.message,
      });
    });

    catalogRequest.end();
  } catch (e) {
    console.log(e);
  }
});

// the Api can purchase by item ID or item name
//purchase end point http://172.18.0.6:8000/purchase/subject
app.post("/purchase/:subject", (req, res) => {
  const { subject } = req.params;

  const orderOptions = {
    //call order service http://172.18.0.8:8002/purchase/subject
    hostname: "172.18.0.8",
    port: 8002,
    path: `/purchase/${subject}`,
    method: "POST",
  };

  //When we use this format to call api use http.request the method 'POST' declared in orderOptions
  const orderRequest = http.request(orderOptions, (orderRes) => {
    let data = "";
    //save response of order server in 'data' as String
    orderRes.on("data", (chunk) => {
      data += chunk;
    });
    //same as above
    orderRes.on("end", () => {
      if (orderRes.statusCode === 200) {
        const responseObject = JSON.parse(data);

        res.json({
          message: ` ${responseObject.message} `,
        });
      } else {
        res.status(500).json({
          error: "Error updating stock from frontend",
        });
      }
    });
  });
  orderRequest.on("error", (error) => {
    res
      .status(500)
      .json({ error: "Error: order server dose not running " + error.message });
  });

  orderRequest.end();
});

app.listen(port, () => {
  //here the server running on port 8000
  console.log(`Server is running on port ${port}`);
});
