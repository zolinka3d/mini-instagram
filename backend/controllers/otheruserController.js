const asyncHandler = require("express-async-handler");
const driver = require("../config/db");

// Description: Search for user
//route POST /api/otherusers
// access Private
const searchForUser = asyncHandler(async (req, res) => {
	const session = driver.session();
	const {name} = req.body;
	try {
		const users = await session.run(
			`
            MATCH (u:User)
            WHERE u.name CONTAINS $name AND NOT u.id = $id
            OPTIONAL MATCH (me:User {id: $id})-[f:FRIENDS]->(u)
            OPTIONAL MATCH (me2:User {id: $id})-[r:REQUESTED]->(u)
            OPTIONAL MATCH (me3:User {id: $id})<-[r2:REQUESTED]-(u)
            RETURN u, f, r, r2
        `,
			{id: req.user.id, name}
		);
		const response = res.status(200).json(
			users.records.map((record) => {
				return {
					id: record.get("u").properties.id,
					name: record.get("u").properties.name,
					profilePhoto: record.get("u").properties.profilePhoto,
					email: record.get("u").properties.email,
					isFriend: record.get("f") ? true : false,
					isRequested: record.get("r") ? true : false,
					youRequested: record.get("r2") ? true : false,
				};
			})
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

// Description: Send friend request
// route POST /api/otherusers/sendRrequest
// access Private
const sendRequest = asyncHandler(async (req, res) => {
	const session = driver.session();
	const {otherId} = req.body;
	try {
		// MERGE (me)-[r:REQUESTED]->(u)
		const result = await session.run(
			`
        MATCH (u:User)
        WHERE u.id = $otherId
        MATCH (me:User)
        WHERE me.id = $id
        CALL apoc.merge.relationship(me, "REQUESTED", {}, {}, u, {})
        YIELD rel
        RETURN u
      `,
			{id: req.user.id, otherId}
		);
		const user = result.records.map((record) => {
			return record.get("u").properties;
		});
		res.status(200).json(
			user.map((user) => {
				return {
					id: user.id,
					name: user.name,
					profilePhoto: user.profilePhoto,
					email: user.email,
				};
			})
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

// Description: Accept friend request
// route POST /api/otherusers/acceptrequest
// access Private
const acceptRequest = asyncHandler(async (req, res) => {
	const session = driver.session();
	const {otherId} = req.body;
	try {
		// MERGE (me)-[f:FRIENDS]->(u)
		// MERGE (u)-[f2:FRIENDS]->(me)
		const result = await session.run(
			`
            MATCH (u:User {id: $otherId})
            MATCH (me:User {id: $id})
            MATCH (u)-[r:REQUESTED]->(me)
            CALL apoc.merge.relationship(me, "FRIENDS", {}, {}, u, {}) 
            YIELD rel
            WITH u, r, me
            CALL apoc.merge.relationship(u, "FRIENDS", {}, {}, me, {})
            YIELD rel
            WITH u, r
            DELETE r
            RETURN u
        `,
			{id: req.user.id, otherId}
		);
		const user = result.records.map((record) => {
			return record.get("u").properties;
		});
		res.status(200).json(
			user.map((user) => {
				return {
					id: user.id,
					name: user.name,
					profilePhoto: user.profilePhoto,
					email: user.email,
					isFriend: true,
				};
			})
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

// Description: look for other users friends requests
// route GET /api/otherusers/requests
// access Private
const lookForRequests = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
            MATCH (me:User {id: $id})
            MATCH (u)-[r:REQUESTED]->(me)
            RETURN u
        `,
			{id: req.user.id}
		);
		const users = result.records.map((record) => {
			return record.get("u").properties;
		});
		res.status(200).json(
			users.map((user) => {
				return {
					id: user.id,
					name: user.name,
					profilePhoto: user.profilePhoto,
					email: user.email,
				};
			})
		);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const getOtherUserInfoForProfile = asyncHandler(async (req, res) => {
	const session = driver.session();
	const {id} = req.params;
	try {
		if (id === req.user.id) {
			const result = await session.run(
				`
          MATCH (me:User {id: $id})
          OPTIONAL MATCH (me2:User {id: $id})-[f:FRIENDS]->(u)
          RETURN me, f
        `,
				{id}
			);
			const friends = result.records.map((record) => {
				return record.get("f")?.properties;
			});
			const user = result.records.map((record) => {
				return {
					id: record.get("me").properties.id,
					name: record.get("me").properties.name,
					profilePhoto: record.get("me").properties.profilePhoto,
					friends: friends.filter((f) => f).length,
					friendship: "me",
				};
			});

			res.status(200).json(user[0]);
		} else {
			const result = await session.run(
				`
          MATCH (u1 {id: $otherId})
          OPTIONAL MATCH (u2 {id: $otherId})-[f:FRIENDS]->(u)
          RETURN u1, f
        `,
				{otherId: id}
			);
			const whatFriendship = await session.run(
				`
          MATCH (me:User {id: $id})
          MATCH (u:User {id: $otherId})
          OPTIONAL MATCH (me)-[r1:REQUESTED]->(u)
          OPTIONAL MATCH (u)-[r2:REQUESTED]->(me)
          OPTIONAL MATCH (me)-[r3:FRIENDS]->(u)
          RETURN r1, r2, r3
        `,
				{id: req.user.id, otherId: id}
			);
			const friendship = whatFriendship.records.map((record) => {
				return record.get("r1")
					? "requested"
					: record.get("r2")
					? "youRequested"
					: record.get("r3")
					? "friends"
					: "none";
			});
			const friends = result.records.map((record) => {
				return record.get("f")?.properties;
			});
			const user = result.records.map((record) => {
				return {
					id: record.get("u1").properties.id,
					name: record.get("u1").properties.name,
					profilePhoto: record.get("u1").properties.profilePhoto,
					friends: friends.filter((f) => f).length,
					friendship: friendship[0],
				};
			});

			res.status(200).json(user[0]);
		}
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const whatFriendship = asyncHandler(async (req, res) => {
	const session = driver.session();
	const {id} = req.params;
	try {
		if (id === req.user.id) {
			res.status(200).json("me");
		} else {
			const result = await session.run(
				`
		  MATCH (me:User {id: $id})
		  MATCH (u:User {id: $otherId})
		  OPTIONAL MATCH (me)-[r1:REQUESTED]->(u)
		  OPTIONAL MATCH (u)-[r2:REQUESTED]->(me)
		  OPTIONAL MATCH (me)-[r3:FRIENDS]->(u)
		  RETURN r1, r2, r3
		`,
				{id: req.user.id, otherId: id}
			);
			const friendship = result.records.map((record) => {
				return record.get("r1")
					? "youRequested"
					: record.get("r2")
					? "requested"
					: record.get("r3")
					? "friends"
					: "none";
			});
			res.status(200).json(friendship[0]);
		}
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const howManyFriendsBetween = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
			MATCH (userFrom:User {id: $userFromId})
			MATCH (userTo:User  {id: $userToId})
			CALL apoc.algo.dijkstra(userFrom, userTo, "FRIENDS", "")
			YIELD path, weight
			RETURN path
			`,
			{userFromId: req.user.id, userToId: req.params.id}
		);

		if (result.records.length === 0) {
			res.status(200).json({howManyFriendsBetween: 0, friendsBetween: []});
		} else {
			const path = result.records[0].get("path");
			const friendsBetween = path.segments
				.slice(0, -1)
				.map((segment) => segment.end.properties.name);

			res.status(200).json({
				howManyFriendsBetween: path.length - 1,
				friendsBetween: friendsBetween,
			});
		}
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

module.exports = {
	searchForUser,
	sendRequest,
	acceptRequest,
	lookForRequests,
	getOtherUserInfoForProfile,
	whatFriendship,
	howManyFriendsBetween,
};
