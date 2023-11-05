const http = require("http");
const express = require("express");
const app = express();
const port = 8000;

//info end point
app.get("/books", (req, res) => res.json({ book: "no books here" }));
app.get("/info/:itemId", (req, res) => {
  const { itemId } = req.params; //get item id obj

  try {
    const catalogRequest = http.get(
      `http://172.18.0.7:8001/info/${itemId}`, //call catalog service
      (catalogRes) => {
        let data = "";

        catalogRes.on("data", (chunk) => {
          data += chunk;
        });
        catalogRes.on("end", () => {
          if (catalogRes.statusCode === 200) {
            const responseObject = JSON.parse(data);
            res.json(responseObject);
          } else {
            res.status(404).json({
              error: "Item not found",
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

//search end point
app.get("/search/:query", (req, res) => {
  const { query } = req.params; //get item id or item topic obj

  try {
    const catalogRequest = http.get(
      `http://172.18.0.7:8001/search/${query}`, //call catalog service
      (catalogRes) => {
        let data = "";

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

//purchase end point
app.post("/purchase/:subject", (req, res) => {
  const { subject } = req.params;

  const orderOptions = {
    hostname: "172.18.0.8",
    port: 8002,
    path: `/purchase/${subject}`,
    method: "POST",
  };

  const orderRequest = http.request(
    orderOptions, //call order service
    (orderRes) => {
      let data = "";

      orderRes.on("data", (chunk) => {
        data += chunk;
      });

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
    }
  );
  orderRequest.on("error", (error) => {
    res
      .status(500)
      .json({ error: "Error: order server dose not running " + error.message });
  });

  orderRequest.end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});