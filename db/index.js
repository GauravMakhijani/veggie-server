const pg = require("pg");

const client = new pg.Client({
  user: "gaurav",
  host: "localhost",
  database: "menus",
  password: "4444",
  port: 5432, //default port for postgres
});

exports.connect = () => {
  return new Promise((resolve, reject) => {
    client.connect((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.query = (text, params) => {
  return new Promise((resolve, reject) => {
    client.query(text, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
