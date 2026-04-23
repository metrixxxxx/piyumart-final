import mysql from "mysql2/promise";

// adjust these values to match your WAMP setup
const db = mysql.createPool({
  host: "localhost",        // WAMP default
  user: "root",             // phpMyAdmin default user
  password: "",             // blank unless you set one
  database: "db_marketplace",  // your DB name
});

export default db;
