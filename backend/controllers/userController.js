const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const driver = require("../config/db");

// Description: Register user
//route POST /api/users
// access Public
const registerUser = asyncHandler(async (req, res) => {
	const {name, email, password} = req.body;

	if (!name || !email || !password) {
		res.status(400);
		throw new Error("Please fill in all fields");
	}

	const session = driver.session();
	try {
		//check if user exists
		const userWitchEmailExists =
			(
				await session.run(
					`MATCH (u:User {email: $email})
            RETURN u`,
					{email: email}
				)
			).records.length > 0;

		const userWitchNameExists =
			(
				await session.run(
					`MATCH (u:User {name: $name})
            RETURN u`,
					{name: name}
				)
			).records.length > 0;

		if (userWitchEmailExists) {
			res.status(400);
			throw new Error("User with email already exists");
		} else if (userWitchNameExists) {
			res.status(400);
			throw new Error("User with name already exists");
		}

		//hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		//create user
		const user = (
			await session.run(
				`
                CREATE (u:User {id: apoc.create.uuid(), name: $name, email: $email,
                     password: $password, isLogged: $isLogged,
                     profilePhoto: $profilePhoto})
                RETURN u
            `,
				{
					name: name,
					email: email,
					password: hashedPassword,
					isLogged: true,
					profilePhoto: "https://zolinka3d-project-uni.s3.eu-central-1.amazonaws.com/incognito.jpg",
				}
			)
		).records[0].get("u").properties;
		// if(user){
		const token = generateToken(user.id);
		res.cookie("token", token, {
			// httpOnly: true,
			// sameSite: "Lax",
			// path: "/",
			// domain: "uni-project.pl",
			// expiresIn: 3600000,
		});
		res.status(201).json({
			id: user.id,
			name: user.name,
			email: user.email,
			isLogged: user.isLogged,
			profilePhoto: user.profilePhoto,
		});
	} finally {
		await session.close();
	}
});

// Description: Authenticate a user
// route POST /api/users/login
// access Public
const loginUser = asyncHandler(async (req, res) => {
	const {email, password} = req.body;

	const session = driver.session();
	try {
		const user = (
			await session.run(
				`MATCH (u:User {email: $email})
            SET u.isLogged = $isLogged
            RETURN u`,
				{email: email, isLogged: true}
			)
		).records[0]?.get("u").properties;

		//check for user email
		if (user && (await bcrypt.compare(password, user.password))) {
			const token = generateToken(user.id);
			res.cookie("token", token, {
				// httpOnly: true,
			});
			res.json({
				id: user.id,
				name: user.name,
				email: user.email,
				isLogged: user.isLogged,
				profilePhoto: user.profilePhoto,
				// token: generateToken(user.id)
			});
		} else {
			res.status(401);
			throw new Error("Invalid email or password");
		}
	} finally {
		await session.close();
	}
});

const logoutUser = asyncHandler(async (req, res) => {
	const session = driver.session();
	const {id} = req.user;
	try {
		await session.run(
			`MATCH (u:User {id: $id})
            SET u.isLogged = $isLogged
            RETURN u`,
			{id: id, isLogged: false}
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
	res.cookie("token", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	res.status(200).json({message: "Logged out"});
});

// Description: Update user profile
// route PUT /api/users/profile
// access private
const updateUserProfile = asyncHandler(async (req, res) => {
	const session = driver.session();

	try {
		if (req.body.name) {
			await session.run(
				`MATCH (u:User {id: $id})
				SET u.name = $name
				RETURN u`,
				{id: req.user.id, name: req.body.name}
			);
		}
		if (req.body.email) {
			await session.run(
				`MATCH (u:User {id: $id})
				SET u.email = $email
				RETURN u`,
				{id: req.user.id, email: req.body.email}
			);
		}
		if (req.body.profilePhoto) {
			await session.run(
				`MATCH (u:User {id: $id})
				SET u.profilePhoto = $profilePhoto
				RETURN u`,
				{id: req.user.id, profilePhoto: req.body.profilePhoto}
			);
		}
		res.status(200).json({message: "Profile updated"});
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

// Description: Get user data
// route GET /api/users/me
// access private
const getMe = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const {id, name, email, profilePhoto} = (
			await session.run("MATCH (u:User {id: $id}) RETURN u", {
				id: req.user.id,
			})
		).records[0].get("u").properties;
		res.status(200).json({
			id: id,
			name,
			email,
			profilePhoto,
		});
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const deleteMe = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		await session.run(
			`MATCH (u:User {id: $id})
			OPTIONAL MATCH (u)-[:POSTED]-(s)
			DETACH DELETE s`,
			{
				id: req.user.id,
			}
		);

		await session.run(
			`MATCH (u:User {id: $id})
			OPTIONAL MATCH (u)-[:ADDED_COMMENT]->(c)
			DETACH DELETE u, c`,
			{
				id: req.user.id,
			}
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
	res.cookie("token", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	res.status(200).json({message: "Logged out"});
});

const deleteProfilePhoto = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		await session.run(
			`MATCH (u:User {id: $id})
			SET u.profilePhoto = $profilePhoto
			RETURN u`,
			{
				id: req.user.id,
				profilePhoto: "https://zolinka3d-project-uni.s3.eu-central-1.amazonaws.com/incognito.jpg",
			}
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
	res.status(200).json({
		data: {
			profilePhoto: "https://zolinka3d-project-uni.s3.eu-central-1.amazonaws.com/incognito.jpg",
		},
		message: "Profile photo deleted",
	});
});

// Generate JWT token
const generateToken = (id) => {
	return jwt.sign({id}, process.env.JWT_SECRET, {
		expiresIn: "30d",
	});
};

module.exports = {
	registerUser,
	loginUser,
	getMe,
	logoutUser,
	updateUserProfile,
	deleteMe,
	deleteProfilePhoto,
};
