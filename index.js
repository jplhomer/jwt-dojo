process.env.db = "users.db";
const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./controllers/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.db);
var app = express();

app.use(bodyParser.urlencoded({extended: true}));

/*
You could use this as a middleware as done here,
or as an included function wrapping the routes or
controllers you want to secure
*/
app.use((req, res, next) => {
	if (req.path !== "/signup" && req.path !== "/login") {
		if (!req.headers.authorization) {
			return res.send("Missing authorization");
		}

		jwt.verify(req.headers.authorization, "SuperSecretPassword", (err, decoded) => {
			if (err) {
				return res.send("Error: " + err);
			} else {
				/* You could use the username to look up
				the user and make sure the user exists.
				This makes it more secure if people can delete
				accounts, but removes some of the aspect of statelessness */
				req.jwtData = decoded;
				return next();
			}
		});
	} else {
		return next();
	}
});

// Initialize the database.
// It'll create the file if it doesn't exist as well
db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS users(username TEXT, pass TEXT)");
});

// Routes
app.post("/signup", (req, res) => {
	auth.register(req.body, (err, jwt) => {
		if (err) {
			return res.send(err);
		}

		return res.send(jwt);
	});
});

app.post("/login", (req, res) => {
	auth.login(req.body, (err, jwt) => {
		if (err) {
			return res.send(err);
		}

		return res.send(jwt);
	});
});

app.get("/secure", (req, res) => {
	// Decode JWT here
	return res.send("Hello " + req.jwtData.usr);
});


// Start Server
app.listen(3000, () => {
	console.log("Listening on port 3000");
});
