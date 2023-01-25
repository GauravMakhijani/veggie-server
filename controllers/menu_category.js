const express = require("express");
const router = express.Router();
const { query } = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM menu_category WHERE deleted = '0'"
    );
    res.statusCode = 200;
    res.send(result.rows);
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});
// router.post("/", async (req, res) => {
//   try {
//     const { category_name, slug } = req.body;
//     const created_at = new Date().toISOString();
//     if (!category_name || !slug) {
//       res.statusCode = 400;
//       res.send({ error: "category_name and slug are required fields" });
//       return;
//     }
//     const queryString =
//       "INSERT INTO menu_category (category_name,slug,created) VALUES ($1, $2, $3) RETURNING *";
//     const values = [category_name, slug, created_at];
//     const result = await query(queryString, values);
//     res.statusCode = 201;
//     res.send(result.rows[0]);
//   } catch (err) {
//     res.statusCode = 500;
//     res.send({ error: err.message });
//   }
// });
router.post("/", async (req, res) => {
  try {
    const { category_name, slug } = req.body;
    const modified_at = new Date().toISOString();
    const created_at = new Date().toISOString();

    const queryString =
      "SELECT * FROM menu_category WHERE slug = $1 and deleted = '1'";
    const result = await query(queryString, [slug]);
    if (result.rowCount > 0) {
      const queryString =
        "UPDATE menu_category SET deleted = '0',category_name = $1,modified = $2 WHERE slug = $3 RETURNING *";
      const result = await query(queryString, [
        category_name,
        modified_at,
        slug,
      ]);
      const queryString2 =
        "UPDATE menu SET deleted = 0,modified = $1 WHERE menu_category_id = $2 RETURNING *";
      await query(queryString2, [modified_at, result.rows[0].id]);
      res.statusCode = 200;
      res.send({
        message: "category updated successfully",
        data: result.rows[0],
      });
    } else {
      const queryString =
        "INSERT INTO menu_category (category_name,slug,created,modified) VALUES ($1,$2,$3,$4) RETURNING *";
      const result = await query(queryString, [
        category_name,
        slug,
        created_at,
        modified_at,
      ]);
      res.statusCode = 201;
      res.send({
        message: "category added successfully",
        data: result.rows[0],
      });
    }
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, category_name } = req.body;
    const modified_at = new Date().toISOString();
    let queryString = "UPDATE menu_category SET ";
    let values = [];
    // console.log(req.body.hasOwnProperty("dob"));
    let c = 1;

    if (req.body.hasOwnProperty("slug")) {
      queryString += "slug = $" + c + ", ";
      c++;
      values.push(slug);
    }
    if (req.body.hasOwnProperty("category_name")) {
      queryString += "category_name = $" + c + ", ";
      c++;
      values.push(category_name);
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
      res.send({ error: "category not found" });
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
    const modified_at = new Date().toISOString();
    const queryString =
      "UPDATE menu_category SET deleted = 1,modified = $2 WHERE id = $1 RETURNING *";
    const result = await query(queryString, [id, modified_at]);
    if (result.rowCount === 0) {
      res.statusCode = 404;
      res.send({ error: "category not found" });
    } else {
      const queryString2 =
        "UPDATE menu SET deleted = 1,modified = $2 WHERE menu_category_id = $1 RETURNING *";
      await query(queryString2, [id, modified_at]);
      res.statusCode = 200;
      res.send({ message: "category and its items deleted successfully" });
    }
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});

//// FOLLOWING IS THE CODE FOR FETCHING MENU ITEMS W.R.T. THE MENU CATEGORY

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const queryString =
      "SELECT m.id,m.slug,m.name,c.category_name,m.ingredients,m.delivered_from, m.delivered_to FROM menu m INNER JOIN menu_category c ON m.menu_category_id = c.id WHERE c.slug = $1 and m.deleted = '0'";
    const result = await query(queryString, [slug]);
    if (result.rowCount > 0) {
      res.statusCode = 200;
      res.send(result.rows);
    } else {
      res.statusCode = 404;
      res.send({ error: "No menu items found for the category" });
    }
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});

router.post("/:slug_category", async (req, res) => {
  try {
    const { slug_category } = req.params;
    const { name, slug, ingredients, delivery_from, delivery_to } = req.body;
    const created_at = new Date().toISOString();
    const modified_at = new Date().toISOString();
    const queryString =
      "INSERT INTO menu (slug, menu_category_id, name, ingredients, delivered_from, delivered_to, created, modified) SELECT $1, id, $2, $3, $4, $5, $6, $7 FROM menu_category WHERE slug = $8 RETURNING *";
    const result = await query(queryString, [
      slug,
      name,
      ingredients,
      delivery_from,
      delivery_to,
      created_at,
      modified_at,
      slug_category,
    ]);
    if (result.rowCount > 0) {
      res.statusCode = 201;
      res.send({
        message: "Menu item added successfully",
        data: result.rows[0],
      });
    } else {
      res.statusCode = 404;
      res.send({ error: "No menu category found" });
    }
  } catch (err) {
    res.statusCode = 500;
    res.send({ error: err.message });
  }
});

router.patch("/:slug_category/:slug", async (req, res) => {
  try {
    const { slug_category, slug } = req.params;
    const { name, ingredients, delivery_from, delivery_to } = req.body;
    const modified_at = new Date().toISOString();
    let queryString = "UPDATE menu SET ";
    let values = [];
    let c = 1;
    if (name) {
      queryString += "name = $" + c + ", ";
      c++;
      values.push(name);
    }
    if (ingredients) {
      queryString += "ingredients = $" + c + ", ";
      c++;
      values.push(ingredients);
    }
    if (delivery_from) {
      queryString += "delivered_from = $" + c + ", ";
      c++;
      values.push(delivery_from);
    }
    if (delivery_to) {
      queryString += "delivered_to = $" + c + ", ";
      c++;
      values.push(delivery_to);
    }
    queryString += "modified = $" + c + " ";
    c++;
    values.push(modified_at);
    let y = c + 1;
    queryString +=
      "WHERE slug = $" +
      c +
      " and menu_category_id = (SELECT id FROM menu_category WHERE slug = $" +
      y +
      ") RETURNING *";
    // console.log(queryString);
    values.push(slug, slug_category);
    const result = await query(queryString, values);
    if (result.rowCount === 0) {
      res.status(404).send({ error: "menu item not found" });
    } else {
      res.status(200).send(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.delete("/:slug_category/:slug", async (req, res) => {
  try {
    const { slug_category, slug } = req.params;
    const modified_at = new Date().toISOString();
    const queryString =
      "UPDATE menu SET deleted = '1', modified = $1 WHERE slug = $2 and menu_category_id = (SELECT id FROM menu_category WHERE slug = $3) RETURNING *";
    const result = await query(queryString, [modified_at, slug, slug_category]);
    if (result.rowCount === 0) {
      res.status(404).send({ error: "menu item not found" });
    } else {
      res.status(200).send(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
