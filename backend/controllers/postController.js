const asyncHandler = require("express-async-handler");
const driver = require("../config/db");
const moment = require("moment");
const {statusSchema, photoPostSchema} = require("../validation/validationSchemas");
const yup = require("yup");

const createStatus = asyncHandler(async (req, res) => {
	const session = driver.session();
	const d = new Date();
	try {
		await statusSchema.validate(req.body);
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                CREATE (u)-[:POSTED]->(s:Status {id: apoc.create.uuid(), text: $text, createdAt: $createdAt, private: $private })
                RETURN s
            `,
			{
				userId: req.user.id,
				text: req.body.text,
				createdAt:
					d.getDate() +
					"-" +
					(d.getMonth() + 1) +
					"-" +
					d.getFullYear() +
					" " +
					d.getHours() +
					":" +
					d.getMinutes() +
					":" +
					d.getSeconds(),
				private: req.body.private,
			}
		);
		const status = result.records[0].get("s").properties;
		res.status(201).json(status);
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			return res.status(400).json({message: error.message});
		}
	} finally {
		await session.close();
	}
});

const getStatusesFromMe = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})-[:POSTED]->(s:Status)
                RETURN s
            `,
			{userId: req.user.id}
		);
		const statuses = result.records.map((record) => record.get("s").properties);
		res.status(200).json(statuses);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const getStatusesFromFriends = asyncHandler(async (req, res) => {
	//console.log(req.user.id);
	const session = driver.session();
	try {
		// Get statuses from friends
		const statusFromFriend = await session.run(
			`
                MATCH (u:User {id: $userId})-[:FRIENDS]->(f:User)-[:POSTED]->(s:Status)
                RETURN s, f
            `,
			{userId: req.user.id}
		);

		// Get statuses posted by me
		const statusesFromMe = await session.run(
			`
                MATCH (f:User {id: $userId})-[:POSTED]->(s:Status)
                RETURN s, f
            `,
			{userId: req.user.id}
		);

		// Combine statuses from friends and statuses posted by me
		const statuses = statusFromFriend.records.concat(statusesFromMe.records);
		const statusesWithValues = statuses.map((record) => {
			return {
				id: record.get("s").properties.id,
				createdAt: record.get("s").properties.createdAt,
				owner: record.get("f").properties.name,
				text: record.get("s").properties.text,
			};
		});

		// Get likes for each status
		for (let status of statusesWithValues) {
			// check if status is liked by user
			const likedByMe = await session.run(
				`
                MATCH (u:User {id: $userId})-[:LIKES]->(s:Status {id: $statusId})
                RETURN u,s
                `,
				{userId: req.user.id, statusId: status.id}
			);
			status.likedByMe = likedByMe.records.length > 0;
			const likes = await session.run(
				`
                MATCH (s:Status {id: $statusId})<-[:LIKES]-(liker)
                RETURN collect(liker) as likes
                `,
				{statusId: status.id}
			);
			status.likes = likes.records[0].get("likes").length;
		}
		// Get comments for each status
		for (let status of statusesWithValues) {
			const comments = await session.run(
				`
                MATCH (s:Status {id: $statusId})<-[:COMMENT_FOR]-(c:Comment)
                RETURN collect(c) as comments
                `,
				{statusId: status.id}
			);
			status.comments = comments.records[0].get("comments").length;
		}

		// Sort statuses by creation date
		const sortedStatuses = statusesWithValues.sort((a, b) => {
			const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
			const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
			return bDate - aDate;
		});
		res.status(200).json(sortedStatuses);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const getStatusesFromOtherUser = asyncHandler(async (req, res) => {
	const session = driver.session();
	// id from params
	try {
		if (req.user.id === req.params.id) {
			const result = await session.run(
				`
                    MATCH (f:User {id: $userId})-[:POSTED]->(s:Status)
                    RETURN s, f
                `,
				{userId: req.user.id}
			);
			// with property likedByMe
			const statuses = result.records;
			const statusesWithValues = statuses.map((record) => {
				return {
					id: record.get("s").properties.id,
					createdAt: record.get("s").properties.createdAt,
					owner: record.get("f").properties.name,
					text: record.get("s").properties.text,
				};
			});

			// Get likes for each status
			for (let status of statusesWithValues) {
				// check if status is liked by user
				const likedByMe = await session.run(
					`
					MATCH (u:User {id: $userId})-[:LIKES]->(s:Status {id: $statusId})
					RETURN u, s
					`,
					{userId: req.user.id, statusId: status.id}
				);
				status.likedByMe = likedByMe.records.length > 0;
				const likes = await session.run(
					`
					MATCH (s:Status {id: $statusId})<-[:LIKES]-(liker)
					RETURN collect(liker) as likes
					`,
					{statusId: status.id}
				);
				status.likes = likes.records[0].get("likes").length;
			}
			// Get comments for each status
			for (let status of statusesWithValues) {
				const comments = await session.run(
					`
					MATCH (s:Status {id: $statusId})<-[:COMMENT_FOR]-(c:Comment)
					RETURN collect(c) as comments
					`,
					{statusId: status.id}
				);
				status.comments = comments.records[0].get("comments").length;
			}
			const sortedStatuses = statusesWithValues.sort((a, b) => {
				const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
				const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
				return bDate - aDate;
			});

			res.status(200).json(sortedStatuses);
		} else {
			const isFriend = await session.run(
				`
				MATCH (me {id: $myId})-[r:FRIENDS]->(f:User {id: $otherId})
				RETURN r
				`,
				{myId: req.user.id, otherId: req.params.id}
			);
			const result =
				isFriend.records.length > 0
					? await session.run(
							`
				MATCH (f:User {id: $userId})-[:POSTED]->(s:Status)
				RETURN s, f
				`,
							{userId: req.params.id}
					  )
					: await session.run(
							`
				MATCH (f:User {id: $userId})-[:POSTED]->(s:Status)
				WHERE s.private = false
				RETURN s, f
				`,
							{userId: req.params.id}
					  );

			// with property likedByMe
			const statuses = result.records;
			const statusesWithValues = statuses.map((record) => {
				if (record.get("s") !== null) {
					return {
						id: record.get("s").properties.id,
						createdAt: record.get("s").properties.createdAt,
						owner: record.get("f").properties.name,
						text: record.get("s").properties.text,
					};
				}
			});

			// Get likes for each status
			for (let status of statusesWithValues) {
				// check if status is liked by user
				const likedByMe = await session.run(
					`
					MATCH (u:User {id: $userId})-[:LIKES]->(s:Status {id: $statusId})
					RETURN u,s
					`,
					{userId: req.user.id, statusId: status.id}
				);
				status.likedByMe = likedByMe.records.length > 0;
				const likes = await session.run(
					`
					MATCH (s:Status {id: $statusId})<-[:LIKES]-(liker)
					RETURN collect(liker) as likes
					`,
					{statusId: status.id}
				);
				status.likes = likes.records[0].get("likes").length;
			}
			// Get comments for each status
			for (let status of statusesWithValues) {
				const comments = await session.run(
					`
					MATCH (s:Status {id: $statusId})<-[:COMMENT_FOR]-(c:Comment)
					RETURN collect(c) as comments
					`,
					{statusId: status.id}
				);
				status.comments = comments.records[0].get("comments").length;
			}

			const sortedStatuses = statusesWithValues.sort((a, b) => {
				const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
				const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
				return bDate - aDate;
			});
			if (statusesWithValues.length === 0) {
				res.status(200).json([]);
			} else {
				res.status(200).json(sortedStatuses);
			}
		}
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const addPhotoPost = asyncHandler(async (req, res) => {
	const session = driver.session();
	const d = new Date();
	try {
		await photoPostSchema.validate(req.body);
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                CREATE (u)-[:POSTED]->(s:PhotoPost {id: apoc.create.uuid(), createdAt: $createdAt, private: $private, photo: $photo })
                SET s.comments = 0, s.owner = u.name
                RETURN s
            `,
			{
				userId: req.user.id,
				createdAt:
					d.getDate() +
					"-" +
					(d.getMonth() + 1) +
					"-" +
					d.getFullYear() +
					" " +
					d.getHours() +
					":" +
					d.getMinutes() +
					":" +
					d.getSeconds(),
				private: req.body.private,
				photo: req.body.photo,
			}
		);
		const status = result.records[0].get("s").properties;
		res.status(201).json(status);
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			return res.status(400).json({message: error.message});
		}
	} finally {
		await session.close();
	}
});

const getPhotoPostsFromFriends = asyncHandler(async (req, res) => {
	//(req.user.id);
	const session = driver.session();
	try {
		// Get statuses from friends
		const statusFromFriend = await session.run(
			`
                MATCH (u:User {id: $userId})-[:FRIENDS]->(f:User)-[:POSTED]->(s:PhotoPost)
                RETURN s, f
            `,
			{userId: req.user.id}
		);

		// Get statuses posted by me
		const statusesFromMe = await session.run(
			`
                MATCH (f:User {id: $userId})-[:POSTED]->(s:PhotoPost)
                RETURN s, f
            `,
			{userId: req.user.id}
		);

		// Combine statuses from friends and statuses posted by me
		const statuses = statusFromFriend.records.concat(statusesFromMe.records);
		const statusesWithValues = statuses.map((record) => {
			return {
				id: record.get("s").properties.id,
				createdAt: record.get("s").properties.createdAt,
				owner: record.get("f").properties.name,
				photo: record.get("s").properties.photo,
			};
		});

		// Get likes for each status
		for (let status of statusesWithValues) {
			// check if status is liked by user
			const likedByMe = await session.run(
				`
                MATCH (u:User {id: $userId})-[:LIKES]->(s:PhotoPost {id: $statusId})
                RETURN u,s
                `,
				{userId: req.user.id, statusId: status.id}
			);
			status.likedByMe = likedByMe.records.length > 0;
			const likes = await session.run(
				`
                MATCH (s:PhotoPost {id: $statusId})<-[:LIKES]-(liker)
                RETURN collect(liker) as likes
                `,
				{statusId: status.id}
			);
			status.likes = likes.records[0].get("likes").length;
		}
		// Get comments for each status
		for (let status of statusesWithValues) {
			const comments = await session.run(
				`
                MATCH (s:PhotoPost {id: $statusId})<-[:COMMENT_FOR]-(c:Comment)
                RETURN collect(c) as comments
                `,
				{statusId: status.id}
			);
			status.comments = comments.records[0].get("comments").length;
		}

		// Sort statuses by creation date
		const sortedStatuses = statusesWithValues.sort((a, b) => {
			const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
			const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
			return bDate - aDate;
		});
		res.status(200).json(sortedStatuses);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

/////////////////fix it///////////////////////
const getPhotoPostsFromOtherUser = asyncHandler(async (req, res) => {
	const session = driver.session();
	// id from params
	try {
		if (req.user.id === req.params.id) {
			const result = await session.run(
				`
                    MATCH (f:User {id: $userId})-[:POSTED]->(s:PhotoPost)
                    RETURN s, f
                `,
				{userId: req.user.id}
			);
			const photosWithValues = result.records.map((record) => {
				return {
					id: record.get("s").properties.id,
					createdAt: record.get("s").properties.createdAt,
					owner: record.get("f").properties.name,
					photo: record.get("s").properties.photo,
				};
			});
			//get likes fro each photo
			for (let photo of photosWithValues) {
				//check if photo is liked by user
				const likedByMe = await session.run(
					`
					MATCH (u:User {id: $userId})-[:LIKES]->(s:PhotoPost {id: $photoId})
					RETURN u,s
					`,
					{userId: req.user.id, photoId: photo.id}
				);
				photo.likedByMe = likedByMe.records.length > 0;
				const likes = await session.run(
					`
					MATCH (s:PhotoPost {id: $photoId})<-[:LIKES]-(liker)
					RETURN collect(liker) as likes
					`,
					{photoId: photo.id}
				);
				photo.likes = likes.records[0].get("likes").length;
			}
			//get comments for each photo
			for (let photo of photosWithValues) {
				const comments = await session.run(
					`
					MATCH (s:PhotoPost {id: $photoId})<-[:COMMENT_FOR]-(c:Comment)
					RETURN collect(c) as comments
					`,
					{photoId: photo.id}
				);
				photo.comments = comments.records[0].get("comments").length;
			}
			//sort photos by creation date
			const sortedPhotos = photosWithValues.sort((a, b) => {
				const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
				const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
				return bDate - aDate;
			});

			res.status(200).json(sortedPhotos);
		} else {
			const isFriend = await session.run(
				`
				MATCH (me {id: $myId})-[r:FRIENDS]->(f:User {id: $otherId})
				RETURN r
				`,
				{myId: req.user.id, otherId: req.params.id}
			);
			const result =
				isFriend.records.length > 0
					? await session.run(
							`
				MATCH (f:User {id: $otherId})-[:POSTED]->(s:PhotoPost)
				RETURN s, f
				`,
							{otherId: req.params.id}
					  )
					: await session.run(
							`
				MATCH (f:User {id: $otherId})-[:POSTED]->(s:PhotoPost)
				WHERE s.private = false
				RETURN s, f
				`,
							{otherId: req.params.id}
					  );
			const photos = result.records;
			const photosWithValues = photos.map((record) => {
				return {
					id: record.get("s").properties.id,
					createdAt: record.get("s").properties.createdAt,
					owner: record.get("f").properties.name,
					photo: record.get("s").properties.photo,
				};
			});
			//get likes fro each photo
			for (let photo of photosWithValues) {
				//check if photo is liked by user
				const likedByMe = await session.run(
					`
					MATCH (u:User {id: $userId})-[:LIKES]->(s:PhotoPost {id: $photoId})
					RETURN u,s
					`,
					{userId: req.user.id, photoId: photo.id}
				);
				photo.likedByMe = likedByMe.records.length > 0;
				const likes = await session.run(
					`
					MATCH (s:PhotoPost {id: $photoId})<-[:LIKES]-(liker)
					RETURN collect(liker) as likes
					`,
					{photoId: photo.id}
				);
				photo.likes = likes.records[0].get("likes").length;
			}
			//get comments for each photo
			for (let photo of photosWithValues) {
				const comments = await session.run(
					`
					MATCH (s:PhotoPost {id: $photoId})<-[:COMMENT_FOR]-(c:Comment)
					RETURN collect(c) as comments
					`,
					{photoId: photo.id}
				);
				photo.comments = comments.records[0].get("comments").length;
			}
			//sort photos by creation date
			const sortedPhotos = photosWithValues.sort((a, b) => {
				const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
				const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
				return bDate - aDate;
			});
			//(sortedPhotos);
			if (photosWithValues.length === 0) {
				res.status(200).json([]);
			} else {
				res.status(200).json(sortedPhotos);
			}
		}
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const likesStatus = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                MATCH (s:Status {id: $statusId})
                MERGE (u)-[r:LIKES]->(s)
                RETURN s
            `,
			{userId: req.user.id, statusId: req.params.id}
		);
		const status = result.records[0].get("s").properties;
		res.status(200).json(status);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const unlikeStatus = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                MATCH (s:Status {id: $statusId})
                MATCH (u)-[r:LIKES]->(s)
                DELETE r
                RETURN s
            `,
			{userId: req.user.id, statusId: req.params.id}
		);
		const status = result.records[0].get("s").properties;
		res.status(200).json(status);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const likesPhotoPost = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                MATCH (s:PhotoPost {id: $photoId})
                MERGE (u)-[r:LIKES]->(s)
                RETURN s
            `,
			{userId: req.user.id, photoId: req.params.id}
		);
		const photo = result.records[0].get("s").properties;
		res.status(200).json(photo);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const ulikePhotoPost = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                MATCH (s:PhotoPost {id: $photoId})
                MATCH (u)-[r:LIKES]->(s)
                DELETE r
                RETURN s
            `,
			{userId: req.user.id, photoId: req.params.id}
		);
		const photo = result.records[0].get("s").properties;
		res.status(200).json(photo);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

//to naprawić
const getPhotoPost = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
				MATCH (s:PhotoPost {id: $statusId})
				MATCH (u:User)-[:POSTED]->(s)
				OPTIONAL MATCH (u2:User)-[r:LIKES]->(s)
				RETURN s, u, count(r) as likes
			`,
			{statusId: req.params.id, userId: req.user.id}
		);
		const photo = {
			id: result.records[0].get("s").properties.id,
			photo: result.records[0].get("s").properties.photo,
			createdAt: result.records[0].get("s").properties.createdAt,
			likes: result.records[0].get("likes"),
			owner: result.records[0].get("u").properties.name,
		};

		//get status with property likedByMe
		const likedByMe = await session.run(
			`
				MATCH (u:User {id: $userId})-[r:LIKES]->(s:PhotoPost {id: $statusId})
				RETURN u,s
			`,
			{userId: req.user.id, statusId: req.params.id}
		);
		photo.likedByMe = likedByMe.records.length > 0;

		//get status with property comments
		const comments = await session.run(
			`
				MATCH (s:PhotoPost {id: $statusId})<-[r:COMMENT_FOR]-(c:Comment)
				RETURN collect(c) as comments
			`,
			{statusId: req.params.id}
		);
		photo.comments = comments.records[0].get("comments").length;

		res.status(200).json(photo);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

//to naprawić
const getStatus = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
				MATCH (s:Status {id: $statusId})
				MATCH (u:User)-[:POSTED]->(s)
				OPTIONAL MATCH (u2:User)-[r:LIKES]->(s)
				RETURN s, u, count(r) as likes
			`,
			{statusId: req.params.id, userId: req.user.id}
		);
		const status = {
			id: result.records[0].get("s").properties.id,
			text: result.records[0].get("s").properties.text,
			createdAt: result.records[0].get("s").properties.createdAt,
			likes: result.records[0].get("likes"),
			owner: result.records[0].get("u").properties.name,
		};

		//get status with property likedByMe
		const likedByMe = await session.run(
			`
				MATCH (u:User {id: $userId})-[r:LIKES]->(s:Status {id: $statusId})
				RETURN u,s
			`,
			{userId: req.user.id, statusId: req.params.id}
		);
		status.likedByMe = likedByMe.records.length > 0;

		//get status with property comments
		const comments = await session.run(
			`
				MATCH (s:Status {id: $statusId})<-[r:COMMENT_FOR]-(c:Comment)
				RETURN collect(c) as comments
			`,
			{statusId: req.params.id}
		);
		status.comments = comments.records[0].get("comments").length;

		res.status(200).json(status);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const getPhotoComments = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (s:PhotoPost {id: $photoId})
                MATCH (u:User)-[:ADDED_COMMENT]->(c:Comment)-[:COMMENT_FOR]->(s)
                RETURN c, u
            `,
			{photoId: req.params.id}
		);
		const comments = result.records.map((record) => {
			const comment = record.get("c").properties;
			const user = record.get("u").properties;
			return {...comment, user: {name: user.name}};
		});
		const sortedComments = comments.sort((a, b) => {
			const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
			const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
			return bDate - aDate;
		});
		res.status(200).json(sortedComments);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const addPhotoComment = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const d = new Date();
		const result = await session.run(
			`
                MATCH (u:User {id: $userId})
                MATCH (s:PhotoPost {id: $photoId})
                CREATE (c:Comment {id: apoc.create.uuid(), text: $text, createdAt: $createdAt})
                MERGE (u)-[:ADDED_COMMENT]->(c)
                MERGE (c)-[:COMMENT_FOR]->(s)
                RETURN c, u
            `,
			{
				userId: req.user.id,
				photoId: req.params.id,
				text: req.body.text,
				createdAt:
					d.getDate() +
					"-" +
					(d.getMonth() + 1) +
					"-" +
					d.getFullYear() +
					" " +
					d.getHours() +
					":" +
					d.getMinutes() +
					":" +
					d.getSeconds(),
			}
		);
		const comment = result.records[0].get("c").properties;
		const user = result.records[0].get("u").properties;
		res.status(200).json({...comment, user: {name: user.name}});
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const getStatusComments = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const result = await session.run(
			`
                MATCH (s:Status {id: $statusId})
                MATCH (u:User)-[:ADDED_COMMENT]->(c:Comment)-[:COMMENT_FOR]->(s)
                RETURN c, u
            `,
			{statusId: req.params.id}
		);
		const comments = result.records.map((record) => {
			const comment = record.get("c").properties;
			const user = record.get("u").properties;
			return {...comment, user: {name: user.name}};
		});
		const sortedComments = comments.sort((a, b) => {
			const aDate = moment(a.createdAt, "DD-MM-YYYY HH:mm:ss");
			const bDate = moment(b.createdAt, "DD-MM-YYYY HH:mm:ss");
			return bDate - aDate;
		});

		res.status(200).json(sortedComments);
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const addStatusComment = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const d = new Date();
		const result = await session.run(
			`
				MATCH (u:User {id: $userId})
				MATCH (s:Status {id: $statusId})
				CREATE (c:Comment {id: apoc.create.uuid(), text: $text, createdAt: $createdAt})
				MERGE (u)-[:ADDED_COMMENT]->(c)
				MERGE (c)-[:COMMENT_FOR]->(s)
				RETURN c, u
			`,
			{
				userId: req.user.id,
				statusId: req.params.id,
				text: req.body.text,
				createdAt:
					d.getDate() +
					"-" +
					(d.getMonth() + 1) +
					"-" +
					d.getFullYear() +
					" " +
					d.getHours() +
					":" +
					d.getMinutes() +
					":" +
					d.getSeconds(),
			}
		);
		const comment = result.records[0].get("c").properties;
		const user = result.records[0].get("u").properties;
		res.status(200).json({...comment, user: {name: user.name}});
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const deleteStatus = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		await session.run(
			`
				MATCH (s:Status {id: $statusId})
				OPTIONAL MATCH (c)-[:COMMENT_FOR]->(s)
				DETACH DELETE s, c
			`,
			{statusId: req.params.id}
		);
		res.status(200).json({message: "Status deleted"});
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const detelePhotoPost = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		await session.run(
			`
				MATCH (p:PhotoPost {id: $photoPostId})
				OPTIONAL MATCH (c)-[:COMMENT_FOR]->(p)
				DETACH DELETE p, c
			`,
			{photoPostId: req.params.id}
		);

		res.status(200).json({message: "Photo post deleted"});
	} catch (error) {
		res.status(400);
		throw new Error(error);
	} finally {
		await session.close();
	}
});

const updateStatus = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		if (req.body.text) {
			const result = await session.run(
				`
					MATCH (s:Status {id: $statusId})
					SET s.text = $text
					RETURN s
				`,
				{statusId: req.params.id, text: req.body.text}
			);
			const status = result.records[0].get("s").properties;

			res.status(200).json(status);
		} else {
			res.status(400);
			throw new Error("No text provided");
		}
	} finally {
		await session.close();
	}
});

const updatePhotoPost = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		if (req.body.photo) {
			const result = await session.run(
				`
					MATCH (p:PhotoPost {id: $photoId})
					SET p.photo = $photo
					RETURN p
				`,
				{photoId: req.params.id, photo: req.body.photo}
			);
			const photoPost = result.records[0].get("p").properties;

			res.status(200).json(photoPost);
		} else {
			res.status(400);
			throw new Error("No photo provided");
		}
	} finally {
		await session.close();
	}
});

module.exports = {
	createStatus,
	getStatusesFromMe,
	getStatusesFromFriends,
	getStatusesFromOtherUser,
	addPhotoPost,
	getPhotoPostsFromFriends,
	getPhotoPostsFromOtherUser,
	likesStatus,
	unlikeStatus,
	likesPhotoPost,
	ulikePhotoPost,
	getPhotoPost,
	getPhotoComments,
	addPhotoComment,
	getStatusComments,
	getStatus,
	addStatusComment,
	deleteStatus,
	detelePhotoPost,
	updatePhotoPost,
	updateStatus,
};
