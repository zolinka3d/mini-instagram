const asyncHandler = require("express-async-handler");

const driver = require("../config/db");
const uuid = require("uuid");

// Description: get goals
// Route: GET /api/goals
// Access: Private
const getGoalsOfUser = asyncHandler(async (req, res) => {
	// const goals = await Goal.find({ user: req.user.id }); // req.user.id is the id of the user that is logged in by the token
	const session = driver.session();
	try {
		const goals = (
			await session.run("MATCH (u:User {id: $userId})-[:HAS_GOAL]->(g:Goal) RETURN g", {
				userId: req.user.id,
			})
		).records.map((record) => record.get("g").properties);
		res.status(200).json(goals);
	} finally {
		await session.close();
	}
});

// Description: set goals
// Route: POST /api/goals
// Access: Private
const addGoal = asyncHandler(async (req, res) => {
	if (!req.body.text) {
		res.status(400);
		throw new Error("Please add text");
	}
	const session = driver.session();
	try {
		const goal = (
			await session.run(
				`
                MATCH (u:User {id: $userId})
                CREATE (u)-[:HAS_GOAL]->(g:Goal {id: $goalId, text: $text})
                RETURN g
            `,
				{userId: req.user.id, text: req.body.text, goalId: uuid.v4()}
			)
		).records[0].get("g").properties;
		res.status(201).json(goal);
	} finally {
		await session.close();
	}
});

// Description: update goals
// Route: PUT /api/goals/:goalId
// Access: Private
const updateGoal = asyncHandler(async (req, res) => {
	// const goal = await Goal.findById(req.params.id);
	const session = driver.session();
	try {
		const goal = (
			await session.run(
				`
                MATCH (u:User {id: $userId})-[:HAS_GOAL]->(g:Goal {id: $goalId})
                SET g.text = $text
                RETURN g
            `,
				{userId: req.user.id, goalId: req.params.goalId, text: req.body.text}
			)
		).records[0]?.get("g").properties;

		if (!goal) {
			res.status(404);
			throw new Error("Goal not found or not yours");
		}

		res.status(200).json(goal);
	} finally {
		session.close();
	}
});

// Description: delete goals
// Route: DELETE /api/goals
// Access: Private
const deleteGoals = asyncHandler(async (req, res) => {
	const session = driver.session();
	try {
		const deletedGoal = (
			await session.run(
				`
                MATCH (u:User {id: $userId})-[:HAS_GOAL]->(g:Goal {id: $goalId})
                WITH g, properties(g) as deletedGoalProperties
                DETACH DELETE g
                RETURN deletedGoalProperties

            `,
				{userId: req.user.id, goalId: req.params.goalId}
			)
		).records[0]?.get("deletedGoalProperties");
		if (!deletedGoal) {
			res.status(404);
			throw new Error("Goal not found or not yours");
		}
		res.status(200).json(deletedGoal);
	} finally {
		session.close();
	}
});

module.exports = {
	getGoalsOfUser,
	addGoal,
	updateGoal,
	deleteGoals,
};
