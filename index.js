const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
app.use(express.json())
app.use(cors())

// mongodb data 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://bossUser:NMFCCAKtFF8LsSGY@cluster0.oy4gwmh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const userCollection = client.db('bistroDB').collection('users')
        const menuCollection = client.db('bistroDB').collection('menu')
        const reviewCollection = client.db('bistroDB').collection('reviews')
        const cartCollection = client.db('bistroDB').collection('cart')

        // jwt token api making
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            // console.log("the token is ",token);
            res.send({ token })
        })
        // middleware
        const verifyToken = (req, res, next) => {
            console.log("inserted token", req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'forbidden access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Forbidden access' })
                }
                req.decoded = decoded;
                next()
            })
        }

        // user all api is here
        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email){
                return res.status(403).send({message: "unauthorized"})
            }

            const query = {email: email}
            const user = await userCollection.findOne(query)
            let admin = false
            if(user){
                admin = user.role === 'admin'
            }
            res.send({admin})
        })

        app.post('/users', async (req, res) => {
            const user = req.body;

            const query = { email: user?.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        // menu api is here
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        // cart data is here
        app.get('/carts', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/carts', async (req, res) => {
            const carts = req.body;
            const result = await cartCollection.insertOne(carts)
            res.send(result)
        })
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// server
app.get('/', (req, res) => {
    res.send('the bistro data server is running........')
})
app.listen(port, () => {
    console.log(`the server: ${port}`);
})
