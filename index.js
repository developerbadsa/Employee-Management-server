const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000; 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URL;

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

  app.get('/', (req, res) => {
        res.send('Hello, World!');
      });

// Send a ping to confirm a successful connection
await client.db("admin").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");


} finally {

}
}
run().catch(console.dir);

// Start the server
app.listen(port, () => {
console.log(`Server is running on${port}`);
});