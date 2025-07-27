//Initialize express app
const express = require('express')
const app = express()
require('dotenv').config()

//Allow frontend to talk to backend
const cors = require('cors');
app.use(cors());


//To make express use json
app.use(express.json())

app.listen(process.env.PORT,()=>{
    console.log(`Server running on http://localhost:${process.env.PORT}`)
})  

//connect to db
const { connect } = require('./config/database')
connect()


// setting up routes
const BASE_ROUTE_V1 = '/api/v1/'
const authRoutes = require('./routes/authRoutes')
app.use(BASE_ROUTE_V1,authRoutes)

const adminRoutes = require("./routes/adminRoutes")
app.use(BASE_ROUTE_V1,adminRoutes)

const userRoutes = require('./routes/userRoutes')
app.use(BASE_ROUTE_V1,userRoutes)

const staffRoutes = require("./routes/staffRoutes")
app.use(BASE_ROUTE_V1,staffRoutes)

app.get('/test', (req, res) => {
  res.json({ message: "Server is alive!" });
});


// 404 not found
app.use((req, res, next) => {
    return res
    .status(404)
    .json({
        success: false,
        message: 'Route not found',
    })
})

// error handler
app.use((err, req, res, next) => {
    console.log(`Error at: ${err.message}`)
})
