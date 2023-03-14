const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const driver = require("../config/db");

const protect = asyncHandler(async (req, res, next) => {
	let token;

	const session = driver.session();

	try {
		// todo: zamienić na ciasteczko
		// if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
		if (req.cookies.token) {
			try {
				// get token from header
				token = req.cookies.token;

				// verify token
				const decoded = jwt.verify(token, process.env.JWT_SECRET); // comparing and verifying (token, secret)

				//get user from the token
				const user = (
					await session.run("MATCH (u:User {id: $id}) RETURN u", {
						id: decoded.id,
					})
				).records[0].get("u").properties;
				if (!user) {
					throw new Error("No user found for this token");
				}
				//console.log(user)
				req.user = user;
				next();
			} catch (error) {
				console.log(error);
				res.status(401); // means not authorized
				throw new Error("Not authorized, token failed");
			}
		}
		if (!token) {
			res.status(401);
			throw new Error("Not authorized, no token");
		}
	} finally {
		await session.close();
	}
});

module.exports = {protect};
