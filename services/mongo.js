const mongoose = require("mongoose")

mongoose.set('strictQuery', true);

async function mongoConnect(uri) {
  try {
    await mongoose.connect(uri)
    console.log(`MongoDB connected to SERVER`)
  } catch (error) {
    console.log("MongodbError=>", error.message)
  }
}

mongoose.connection.on("error", function (err) {
  console.log("mongooseError=>",err.message);
})

mongoose.connection.on('close',function () {
  console.log("Mongo is closed");
})

module.exports = mongoConnect