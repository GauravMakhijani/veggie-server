const express = require("express");
const router = express.Router();
const { query } = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM users where deleted = '0'");
    res.statusCode = 200;
    res.send(result.rows);
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { fname, lname, dob, address } = req.body;
    const result = await query(
      "INSERT INTO users (fname, lname, dob, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [fname, lname, dob, address]
    );
    res.statusCode = 201;
    res.send(result.rows[0]);
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fname, lname, dob, address } = req.body;
    const modified_at = new Date().toISOString();
    let queryString = "UPDATE users SET ";
    let values = [];
    // console.log(req.body.hasOwnProperty("dob"));
    let c = 1;

    if (req.body.hasOwnProperty("fname")) {
      queryString += "fname = $" + c + ", ";
      c++;
      values.push(fname);
    }
    if (req.body.hasOwnProperty("lname")) {
      queryString += "lname = $" + c + ", ";
      c++;
      values.push(lname);
    }
    if (req.body.hasOwnProperty("dob")) {
      console.log("here");
      queryString += "dob = $" + c + ", ";
      c++;
      values.push(dob);
    }
    if (req.body.hasOwnProperty("address")) {
      queryString += "address = $" + c + ", ";
      c++;
      values.push(address);
    }
    queryString += "modified = $" + c + ", ";
    c++;
    values.push(modified_at);
    queryString = queryString.slice(0, -2);
    queryString += " WHERE id = $" + c + " RETURNING *";
    values.push(id);
    const result = await query(queryString, values);
    if (result.rowCount === 0) {
      res.statusCode = 404;
      res.send({ error: "user not found" });
    } else {
      res.statusCode = 200;
      res.send(result.rows[0]);
    }
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let queryString = "UPDATE users SET deleted = '1',";
    let values = [];
    const modified_at = new Date().toISOString();
    queryString += "modified = $1";
    values.push(modified_at);
    queryString += " where id = $2 RETURNING *";
    values.push(id);
    const result = await query(queryString, values);
    if (result.rowCount === 0) {
      res.statusCode = 404;
      res.send({ error: "user not found" });
    } else {
      res.statusCode = 200;
      res.send(result.rows[0]);
    }
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});

module.exports = router;
