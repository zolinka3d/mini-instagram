const express = require("express");
const router = express.Router();
// const {getGoals, setGoals, updateGoals, deleteGoals} = require('../controllers/goalController');
const {getGoalsOfUser, addGoal, updateGoal, deleteGoals} = require("../controllers/goalController");
const {protect} = require("../middleware/authMiddleware");

router.route("/").get(protect, getGoalsOfUser).post(protect, addGoal);
router.route("/:goalId").put(protect, updateGoal).delete(protect, deleteGoals);

module.exports = router;

// Docelowo, "po restowemu" lepiej zrobić tak:
// /api/my-goals
// albo
// /api/users/my-id/goals
