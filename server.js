import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from "mongoose";
import UserModel from "./models/User.js";
import bcrypt from 'bcrypt';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const PORT = 3003;

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
	if (login.trim() === '' || password1.trim() === '' || (password1 !== password2)) {
		res.sendStatus(403);
	} else {
		const salt = await bcrypt.genSalt();
		const hash = await bcrypt.hash(password1, salt);
		const user = await UserModel.create(
			{
				login,
				firstName,
				lastName,
				email,
				hash,
				accessGroups: 'loggedInUsers,notYetApprovedUsers'
			}
		);
		req.session.user = user;
		req.session.save();
		res.json(user);
	}
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

app.get("/notyetapprovedusers", async (req, res) => {
	const users = await UserModel.find({"accessGroups": { "$regex": "notYetApprovedUsers", "$options": "i" }});
	res.json({
		users
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
