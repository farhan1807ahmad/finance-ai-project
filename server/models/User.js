const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require("bcrypt");

// Connect to database
const dbPath = path.join(__dirname, '../expenses.db');
const db = new Database(dbPath);

class User {
  static createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      db.exec(query);
      console.log("✅ Users table created/verified");
    } catch (error) {
      console.error("Error creating users table:", error.message);
    }
  }

  static async register(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Check if email already exists
      const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const result = db.prepare(
        "INSERT INTO users (email, password) VALUES (?, ?)"
      ).run(email, hashedPassword);

      return {
        id: result.lastInsertRowid,
        email,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Find user
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) {
        throw new Error("User not found");
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      return {
        id: user.id,
        email: user.email,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static getUserById(id) {
    try {
      const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(id);
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = User;
