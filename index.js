require("./utils.js");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const MongoClient = require('mongodb').MongoClient;
const formidable = require('formidable');
const multer = require('multer');
const path = require("path");
const mime = require('mime');
var { database } = require("./databaseConnection");
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;


const upload = multer({ dest: 'public/uploads/' });

const bcrypt = require("bcrypt");
const saltRounds = 12;
var gamesJSONData;


const app = express();

const Joi = require("joi");

// Configuring the view engine for an Express.js application to be EJS
app.set('view engine', 'ejs');
app.use(express.static("public"));
var { database } = include("databaseConnection");
const expireTime = 24 * 60 * 60 * 1000;

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */


const userCollection = database.db(mongodb_database).collection("users");
const postCollection = database.db(mongodb_database).collection("posts");


const port = process.env.PORT || 3200;

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({

  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`,
  crypto: {
    secret: mongodb_session_secret
  }
})

app.use(session({
  secret: node_session_secret,
  store: mongoStore, //default is memory store 
  saveUninitialized: false,
  resave: true
}
));

app.get('/nosql-injection', async (req, res) => {
  var name = req.query.user;

  if (!name) {
    res.send(`<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`);
    return;
  }
  //console.log("user: "+name);

  try {
    gamesJSONData = JSON.parse(data);
    console.log("All games:\n" + gamesJSONData);
  } catch (error) {
    console.error("Error parsing JSON: ", error);
  }
});


  const schema = Joi.string().max(100).required();
  const validationResult = schema.validate(name);

  var invalid = false;
  //If we didn't use Joi to validate and check for a valid URL parameter below
  // we could run our userCollection.find and it would be possible to attack.
  // A URL parameter of user[$ne]=name would get executed as a MongoDB command
  // and may result in revealing information about all users or a successful
  // login without knowing the correct password.
  // if (validationResult.error != null) {
  //   invalid = true;
  //   console.log(validationResult.error);
    //    res.send("<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>");
    //    return;
  // }
//   var numRows = -1;
//   //var numRows2 = -1;
//   try {
//     const result = await userCollection.find({ name: name }).project({ username: 1, password: 1, _id: 1 }).toArray();
//     //const result2 = await userCollection.find("{name: "+name).project({username: 1, password: 1, _id: 1}).toArray(); //mongoDB already prevents using catenated strings like this
//     //console.log(result);
//     numRows = result.length;
//     //numRows2 = result2.length;
//   }
//   catch (err) {
//     console.log(err);
//     res.send(`<h1>Error querying db</h1>`);
//     return;
//   }

//   console.log(`invalid: ${invalid} - numRows: ${numRows} - user: `, name);

//   // var query = {
//   //     $where: "this.name === '" + req.body.username + "'"
//   // }

//   // const result2 = await userCollection.find(query).toArray(); //$where queries are not allowed.

//   // console.log(result2);

//   res.send(`<h1>Hello</h1> <h3> num rows: ${numRows}</h3>`);
//   //res.send(`<h1>Hello</h1>`);




// const communityRouter = require('./routes/community');
// app.use('/community', communityRouter);


app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signupSubmit", async (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var phone = req.body.phone;

  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    password: Joi.string().max(20).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/).required(),
  });

  const validationResult = schema.validate({ username, email, password, phone });
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/signup");
    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    username: username,
    password: hashedPassword,
    email: email,
    phone: phone,
  });
  console.log("User has been inserted");

  req.session.authenticated = true;
  req.session.username = username;
  req.session.remainingQuantity = 10
  res.redirect("/index");
});

function requireLogin(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/redeem", (req, res) => {
  // if (!req.session.authenticated) {
  //   res.redirect("/");
  //   return;
  // }
  res.render("redeem");
});


app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    console.log(errorMsg)
    res.redirect("/login");
  } else {
    res.render("index", { title: "Home Page" });
  }
});

app.get("/login", (req, res) => {
  if (!req.session.authenticated) {
    const errorMsg = req.query.errorMsg;
    res.render("login", { errorMsg });
  } else {
    res.redirect("/");
  }
});

app.post("/loginSubmit", async (req, res) => {

  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, password });
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/login");
    return;
  }

  const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1, username: 1 }).toArray();

  console.log(result);
  if (result.length != 1) {
    console.log("User is not found...");
    res.redirect("/login");
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {
    console.log("right password");

    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.cookie.maxAge = expireTime;

    const expireTime = 3600000; // 1시간 (밀리초)


    res.redirect("/");
    return;
  } else {
    console.log("wrong password");
    res.redirect("/login?errorMsg=Invalid email/password combination.");
    return;
  }
//   res.render("pricecompare");
});

app.get('/nosql-injection', async (req, res) => {
  var name = req.query.user;

  if (!name) {
    res.send(`<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`);
    return;
  }
  //console.log("user: "+name);

  const schema = Joi.string().max(100).required();
  const validationResult = schema.validate(name);

  var invalid = false;
  //If we didn't use Joi to validate and check for a valid URL parameter below
  // we could run our userCollection.find and it would be possible to attack.
  // A URL parameter of user[$ne]=name would get executed as a MongoDB command
  // and may result in revealing information about all users or a successful
  // login without knowing the correct password.
  if (validationResult.error != null) {
    invalid = true;
    console.log(validationResult.error);
    //    res.send("<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>");
    //    return;
  }
  var numRows = -1;
  //var numRows2 = -1;
  try {
    const result = await userCollection.find({ name: name }).project({ username: 1, password: 1, _id: 1 }).toArray();
    //const result2 = await userCollection.find("{name: "+name).project({username: 1, password: 1, _id: 1}).toArray(); //mongoDB already prevents using catenated strings like this
    //console.log(result);
    numRows = result.length;
    //numRows2 = result2.length;
  }
  catch (err) {
    console.log(err);
    res.send(`<h1>Error querying db</h1>`);
    return;
  }

  console.log(`invalid: ${invalid} - numRows: ${numRows} - user: `, name);

  // var query = {
  //     $where: "this.name === '" + req.body.username + "'"
  // }

  // const result2 = await userCollection.find(query).toArray(); //$where queries are not allowed.

  // console.log(result2);

  res.send(`<h1>Hello</h1> <h3> num rows: ${numRows}</h3>`);
  //res.send(`<h1>Hello</h1>`);

});

app.get("/signup", (req, res) => {
  res.render("signup");
});

let remainingQuantity = 10;


app.post("/signupSubmit", async (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var phone = req.body.phone;

  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    password: Joi.string().max(20).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/).required(),
  });

  const validationResult = schema.validate({ username, email, password, phone });
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/signup");
    req.session.cdKeys = cdKeys;
    return;
  }


  var hashedPassword = await bcrypt.hash(password, saltRounds);


  await userCollection.insertOne({
    username: username,
    password: password,
    email: email,
    phone: phone,
  });
  console.log("User has been inserted");

  req.session.authenticated = true;
  req.session.username = username;
  req.session.remainingQuantity = 10
  req.session.remainingQuantity = remainingQuantity;
  res.redirect("/event");
});

app.post("/getCDKey", async (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
});

function requireLogin(req, res, next) {
  if (!req.session.authenticated) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/community", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const skip = (page - 1) * pageSize;

  try {
    const posts = await postCollection.find({}).sort({ date: -1 }).skip(skip).limit(pageSize).toArray();
    const totalPosts = await postCollection.countDocuments();
    const totalPages = Math.ceil(totalPosts / pageSize);

    res.render("community", { posts: posts, totalPages: totalPages, currentPage: page, title: "Community" });
  } catch (err) {
    console.log(err);
    console.error(err);
    res.send("Error while fetching posts");
  }
});

app.get("/community/:postId/details", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);

  try {
    const post = await postCollection.findOne({ _id: postId });
    const likes = post && Array.isArray(post.likes) ? post.likes.length : 0;
    res.render("post", { post: post, likes: likes, title: "Community" });
  } catch (err) {
    console.error(err);
    res.send("Error while fetching post details");
  }
});


app.post("/community", async (req, res) => {
  const newPost = {
    author: req.body.author,
    title: req.body.title,
    content: req.body.content,
    date: new Date(),
    preview: req.body.content.split('\n').slice(0, 4).join('\n') + '...',
    likes: [] 
  };

  try {
    await postCollection.insertOne(newPost);
    res.redirect("/community");
  } catch (err) {
    console.log(err);
    res.send("Error while inserting post");
  }
});

app.post("/community/write", async (req, res) => {
  const { title, author, content, password } = req.body;

  console.log(`Stored password: ${password}`); 

  const newPost = {
    title: title,
    author: author,
    content: content,
    password: password,
    date: new Date(),
    preview: content.split('\n').slice(0, 4).join('\n') + '...'
  };

  postCollection.insertOne(newPost)
    .then(result => {
      console.log('Post added successfully');
      res.redirect('/community');
    })
    .catch(error => console.error(error));
});


app.get("/community/write", requireLogin, (req, res) => {
  res.render("communitywrite",{title: "Community"});
});

const PostSchema = mongoose.Schema({
  author: String,
  title: String,
  content: String,
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
});

const Post = mongoose.model("Post", PostSchema);
  
  app.get("/community/:postId/like", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);
  
    try {
    const post = await postCollection.findOne({ _id: postId });
    const likes = post && Array.isArray(post.likes) ? post.likes.length : 0;
    res.json({ success: true, likes: likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error while fetching like count" });
  }
});
  
  
app.post("/community/:postId/like", requireLogin, async (req, res) => {
  const postId = new ObjectID(req.params.postId);
  const userId = req.session.userId;
  
  try {
    const post = await postCollection.findOne({ _id: postId });

    let index = -1;

    if (post && Array.isArray(post.likes)) {
      index = post.likes.indexOf(userId);
    } else {
      post.likes = [];
    }
    
        if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
    }
    
        await postCollection.updateOne({ _id: postId }, { $set: { likes: post.likes } });

    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error while processing like" });
  }
});
    


//Warehouse page
// app.get("/warehouse", (req, res) => {
//   if (!req.session.authenticated) {
//     res.redirect("/");
//     return;
//   }
//   res.render("warehouse");
// });

app.get("/warehouse", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  const user = await userCollection.findOne({ username: req.session.username });
  res.render("warehouse" ,{ title: "Warehouse", redeemedKey: user.redeemedKey || "No key redeemed yet" });
});


//Redeem Page and Functionality
app.get("/redeem", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("redeem", {title: "Redeem"})
});

app.get("/getRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ remainingQuantity: remainingQuantity });
});

app.post("/updateRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  req.session.remainingQuantity -= 1;
  res.json({ remainingQuantity: req.session.remainingQuantity });
});

app.post("/resetRemainingQuantity", (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }
  remainingQuantity = 10;
  res.json({ remainingQuantity: remainingQuantity });
});


app.get("/redeemKey", async (req, res) => {
  if (!req.session.authenticated) {
    res.status(401).send("Unauthorized");
    return;
  }

  

  // Get the user from the database
  const user = await userCollection.findOne({ username: req.session.username });
  
  // If the user has already redeemed a key, return an error
  if (user.redeemedKey) {
    res.status(400).json({ message: "You have already redeemed a key.", cdKey: user.redeemedKey });
    return;
  }

  // If no keys are left, return an error
  if (cdkKeys.length === 0 || remainingQuantity === 0) {
    res.status(400).json({ message: "No keys left to redeem." });
    return;
  }

  // Pick a random key
  const randomIndex = Math.floor(Math.random() * cdkKeys.length);
  const redeemedKey = cdkKeys[randomIndex];
  cdkKeys = cdkKeys.filter((_, index) => index !== randomIndex);

  // Update the user document in the database
  await userCollection.updateOne({ username: req.session.username }, { $set: { redeemedKey } });

  // Write the updated keys from cdk.txt
  fs.writeFileSync(path.join(__dirname, 'cdk.txt'), cdkKeys.join('\n'));

  remainingQuantity -= 1;

  // Respond with the redeemed key
  res.json({ cdKey: redeemedKey, remainingQuantity: remainingQuantity });
});


//Event Page
app.get("/event", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("event", {title: "Event"})
});


//Setting Page
app.get("/setting", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("setting", {title: "Setting"})
});

app.get("/index", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
    return;
  }

  res.render("index", { username: req.session.username, title: "Home Page" });
});

app.get("/event", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("event", { title: "Event" });
});

app.post("/loginSubmit", async (req, res) => {

  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, password });
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/login");
    return;
  }

  const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1, username: 1 }).toArray();

  console.log(result);
  if (result.length != 1) {
    console.log("User is not found...");
    res.redirect("/login");
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {
    console.log("right password");

    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.cookie.maxAge = expireTime;

    res.redirect("/event");
    return;
  } else {
    console.log("wrong password");
    res.redirect("/login?errorMsg=Invalid email/password combination.");
    return;
  }
  res.render("pricecompare");
});


app.get('/gamedetail', (req, res) => {
  const gameName = 'Game Name'; 
  const gameRating = 'Game Rating'; 
  const gameDescription = 'Game Description';
  const gameImage = 'path/to/game/image.jpg'; 
  const similarGames = ['Similar Game 1', 'Similar Game 2'];

  res.render('gamedetail', { gameName: 'Example Game', gameRating: 8.5, gameDescription: 'This is an example game.', gameImage: '/images/example.jpg', similarGames: ['Game A', 'Game B', 'Game C'], title: 'Game Detail' });


});

app.get('/profile', async (req, res) => {
  try {
    const user = await database.db('COMP2800-BBY-12').collection('users').findOne({ username: req.session.username });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { username, email, phone, image } = user; 

    res.render('profile', { username, email, phone, image, title: 'Profile' });

  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회에 실패했습니다' });
  }
});

const dbName = 'COMP2800-BBY-12';

app.get('/changePasswordForm', (req, res) => {
  res.render('changePassword'); 
});


app.post('/changePassword', async (req, res) => {

  try {
    const post = await postCollection.findOne({ _id: postId });
    res.render("post", { post: post, likes: post.likes.length, title: "Community" });
  } catch (err) {
    console.error(err);
    res.send("Error while fetching post details");
  }
});


const url = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`;


const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};


const client = new MongoClient(url, options);

app.post('/upload', upload.single('file'), (req, res, next) => {

const image = "/path/to/image.jpg";
const timestamp = Date.now(); 

const imageUrl = `${image}?t=${timestamp}`;

const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];



  } catch (error) {
    console.error('Error handling profile image upload:', error);
    res.status(500).send('Error handling profile image upload');
  }
});

app.get('/profile', async (req, res) => {
  const username = req.session.username;

  try {
    const user = await userCollection.findOne({ username: username });
    if (!user) {
      res.status(404).send('User not found');
      return;
    }


    res.render('profile', { image: user.image, title: 'Profile' })

  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching user profile");
  }
});

app.get('/recommend', (req, res) => {
  try {
    const imageUrl1 = '/img/reco1.png'; 
    const imageUrl2 = '/img/reco2.png'; 

    res.render('recommend', { imageUrl1, imageUrl2, title: 'Recommend' });
  } catch (error) {
    console.error('Error rendering recommend page:', error);
    res.status(500).send('Error rendering recommend page');
  }
});

app.get("/recommended", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("recommend", {imageUrl1: "/img/steam_logo.png", imageUrl2: "/img/search_icon.png", title: "Recommended Games"});
});

app.get("/settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("settings", { title: settings });
});

app.get("/notif-settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("notif-settings");
});

app.get("/sec-settings", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("sec-settings");
});

app.get('/gamedetails', (req, res) => {
  let gameID = req.query.game_ID;
  let resultIndex = 0;e
  if (!req.query.game_ID) {
    gameID = 0;
  }
  for (let i = 0; i < gamesJSONData.length; i++) {
    if (gamesJSONData[i].appid == gameID) {
      resultIndex = i;
    }
  }
  let game = gamesJSONData[resultIndex];
  let exampleID = 1;
  if (resultIndex == 1) {
    exampleID = 3;
  }
  let gameName = game.name; 
  let gameRating = Math.round((game.positive / (game.positive + game.negative)) * 10000) / 100; 
  let gameDescription = game.short_description; 
  let gameImage = game.header_image;
  let appid = gamesJSONData[exampleID].appid;
  let similarGames = `<a href='/gamedetails?game_ID=${appid}'><img id='${appid}' class='moregame' onmouseleave='closeHoverMenu(${appid})' onmouseenter='openHoverMenu(${appid})' src='${gamesJSONData[exampleID].header_image}'></a>`; // 실제 유사한 게임 목록으로 대체해야 합니다.

  res.render('gamedetail', {
    gameName: gameName, gameRating: gameRating, gameDescription: gameDescription,
    gameImage: gameImage, similarGames: similarGames, title: `${gameName} Details`,
    truncatedDesc: `${gamesJSONData[exampleID].short_description.substring(0, 200)}...`,
    moreGameName: `${gamesJSONData[exampleID].name}`
  });

app.get("/logout", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  res.render("logout");
});


app.get('/game', (req, res) => {
  fs.readFile(path.join(__dirname, "public/datasets/steam_games-part1.json"), 'UTF-8', (err, data) => {
    if (err) {
      console.error("Error reading file: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      let testData = JSON.parse(data);
      res.render('game', { games: testData, title: 'Game Page' });
    } catch (error) {
      console.error("Error parsing JSON: ", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.get('/api/game', (req, res) => {
  fs.readFile(path.join(__dirname, "public/datasets/steam_games-part1.json"), 'UTF-8', (err, data) => {
    

    try {
      let testData = JSON.parse(data);
      let gamesArray = Object.values(testData);
      
      if (req.query.free === 'true') {
        gamesArray = gamesArray.filter(game => game.price === 0 || game.price === "0");
      }

      if (req.query.popular === 'true') {
        gamesArray = gamesArray.sort((a, b) => {
          const maxOwnersA = Math.max(...a.owners.match(/\d+/g).map(Number));
          const maxOwnersB = Math.max(...b.owners.match(/\d+/g).map(Number));
          return maxOwnersB - maxOwnersA;
        });
      }
      if (req.query.sortPrice === 'desc') {
        gamesArray = gamesArray.sort((a, b) => b.price - a.price);
      }
      else if (req.query.sortPrice === 'asc') {
        gamesArray = gamesArray.sort((a, b) => a.price - b.price);
      }
      
      
      let page = req.query.page ? parseInt(req.query.page) : 1;
      let pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      let offset = (page - 1) * pageSize;
      let paginatedItems = gamesArray.slice(offset, offset + pageSize);

      res.json({ 
        page: page,
        perPage: pageSize,
        total: gamesArray.length,
        totalPages: Math.ceil(gamesArray.length / pageSize),
        data: paginatedItems
      });
    } catch (error) {
      console.error("Error parsing JSON: ", error);
      res.status(500).send("Internal Server Error");
    }
  });

});

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});