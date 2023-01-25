const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { connect } = require("./db");
const usersRouter = require("./controllers/users");
const menu_category_router = require("./controllers/menu_category");
app.use(bodyParser.json());

connect()
  .then(() => {
    console.log("connected");
    app.use("/users", usersRouter);
    app.use("/menus", menu_category_router);
  })
  .catch((err) => {
    console.log("connection error", err.stack);
  });

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
