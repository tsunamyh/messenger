const bcrypt = require('bcryptjs')
const User = require("./1userSchema")

function genPasSaltId(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return { password: hash };
}

async function saveUser(user) {
  Object.assign(user, genPasSaltId(user.password))

  return await User.create(user) //return user with _id
  // console.log("saveUser|>", user);
}

async function findUserById(id) {
  return await User.findById(id, { username: 1, _id: 0 })
  //In the above syntax "username":1, _id:0 means get all data from username field without _id.
}

async function findUserByUsername(username) {
  return await User.findOne({ username });
}

async function getAllUsers() {
  return await User.find({},{password:0,date:0,__v:0})
}

module.exports = {
  saveUser,
  findUserById,
  findUserByUsername,
  getAllUsers,
}