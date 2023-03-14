const express = require("express");
const router = express.Router();
const {
	registerUser,
	loginUser,
	getMe,
	logoutUser,
	updateUserProfile,
	deleteMe,
	deleteProfilePhoto,
} = require("../controllers/userController");
const {protect} = require("../middleware/authMiddleware");
const {generateUploadURL} = require("../utils/s3");

router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.put("/updateMe", protect, updateUserProfile);
router.delete("/deleteMe", protect, deleteMe);
router.delete("/deleteProfilePhoto", protect, deleteProfilePhoto);

//get a photo upload url
router.get("/s3Url", async (req, res) => {
	const url = await generateUploadURL();
	res.json({url});
});

module.exports = router;
