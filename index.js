const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const cors = require('cors');
const jwt = require('jsonwebtoken');






// middleware
app.use(cors());
app.use(express.json());



const {MongoClient, ServerApiVersion} = require('mongodb');
const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {

      const usersDb = client.db("usersDB").collection("usersCollection")


        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });
          })



      // post requiests
      app.post('/users', async(req, res)=>{
            const user = req.body;
            user.isVerify = false
            
            const result = await usersDb.insertOne(user)
            
            console.log(user)

            res.send(result)



      })




    app.get('/', (req, res) => {
      res.send('Hello, World!');
    })


    await client.db('admin').command({ping: 1});
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
  }
}
run().catch(console.dir);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on${port}`);
});
