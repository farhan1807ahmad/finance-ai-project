# 💰 AI Personal Finance Tracker
A full-stack web application that allows users to manage, track, and analyze their expenses with real-time updates and data visualization.



## 🚀 Overview
This project is built using the MERN stack (MongoDB, Express, React, Node.js). It enables users to perform complete CRUD operations on expenses and visualize spending patterns using charts.


## ✨ Features
- Add new expenses
- View all expenses in real-time
- Edit/update existing expenses
- Delete expenses
- Category-based tracking
- Data visualization using charts
- Fully responsive frontend

## 🧠 Tech Stack
**Frontend**
- React.js
- Axios
- Recharts

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB (Atlas Cloud)


## 📁 Project Structure

finance-ai-project/
├── client/         # React frontend
├── server/         # Node backend
│   ├── models/
│   └── index.js
└── README.md


## ⚙️ Installation & Setup

### Clone the repository
git clone https://github.com/your-username/finance-ai-project.git



### Backend Setup
cd server
npm install

Create a `.env` file in the server directory and add:
MONGO_URI=your_mongodb_connection_string

Start backend server:
node index.js



### Frontend Setup
cd client
npm install
npm start


## 🔗 API Endpoints
POST    /add-expense        → Add a new expense  
GET     /get-expenses       → Retrieve all expenses  
PUT     /update-expense/:id → Update an expense  
DELETE  /delete-expense/:id → Delete an expense  



## 📊 Functionality Flow
User Input → React Frontend → API Call (Axios) → Node Backend → MongoDB Database → Response → UI Update

## 📌 Environment Variables
MONGO_URI=your_database_connection_string

## 🧪 Testing
API endpoints can be tested using Postman.

## 🚀 Future Enhancements
- User authentication (JWT)
- Expense filters (daily, weekly, monthly)
- Budget tracking system
- AI-based financial insights
- Mobile-first UI improvements





## 📄 License

This project is licensed under the MIT License.
