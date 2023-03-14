const express = require("express");
const router = express.Router();
const {
	searchForUser,
	sendRequest,
	acceptRequest,
	lookForRequests,
	getOtherUserInfoForProfile,
	whatFriendship,
	howManyFriendsBetween,
} = require("../controllers/otheruserController");
const {protect} = require("../middleware/authMiddleware");

router.post("/", protect, searchForUser);
router.post("/sendrequest", protect, sendRequest);
router.post("/acceptrequest", protect, acceptRequest);
router.get("/requests", protect, lookForRequests);
router.get("/getotheruserinfo/:id", protect, getOtherUserInfoForProfile);
router.get("/whatFriendship/:id", protect, whatFriendship);
router.get("/howManyFriendsBetween/:id", protect, howManyFriendsBetween);

module.exports = router;
