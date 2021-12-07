import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from "mongoose";
import UserModel from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const PORT = 3003;
const BCRYPT_SALT = 'tempsalt';

app.use(cookieParser());
app.use(cors(
	{
		origin: 'http://localhost:3001',
		credentials: true
	}
));

app.use(express.json());
app.use(
	session({
		resave: true,
		saveUninitialized: true,
		secret: process.env.SESSION_SECRET || "use-env-secret728272"
	})
);

app.post("/login", async (req, res) => {
	const login = req.body.login;
	// const password = req.body.password;
	let user = await UserModel.findOne({ login });
	if (!user) {
		user = await UserModel.findOne({ login: "anonymousUser" });
	}
	req.session.user = user;
	req.session.save();
	res.json(user);
});

app.post("/signup", async (req, res) => {
	const login = req.body.login;
	const password1 = req.body.password1;
	const password2 = req.body.password2;
	const firstName = req.body.firstName;
	const lastName = req.body.lastName;
	const email = req.body.email;
	bcrypt.genSalt().then(BCRYPT_SALT => {
		bcrypt.hash("password", BCRYPT_SALT).then(hash => {
			const user = await UserModel.create(
				{
					login,
					firstName,
					lastName,
					email,
					hash,
					accessGroups: 'nnn'
				}
			);
		});
	});
	req.session.user = user;
	req.session.save();
	res.json(user);
});

app.get("/currentuser", async (req, res) => {
	let user = req.session.user;
	if (!user) {
		user = await UserModel.findOne({ login: "anonymousUser" });
	}
	res.json({
		user
	});
});

app.get("/logout", async (req, res) => {
	req.session.destroy();
	const user = await UserModel.findOne({ login: "anonymousUser" });
	res.json(user);
});

app.listen(PORT, (req, res) => {
	console.log(`API listening on port http://localhost:${PORT}`);
});
