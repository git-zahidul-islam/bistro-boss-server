const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
app.use(express.json())
app.use(cors())

// server
app.get('/',(req,res) =>{
    res.send('the bistro data server is running........')
})
app.listen(port,()=>{
    console.log(`the server: ${port}`);
})
