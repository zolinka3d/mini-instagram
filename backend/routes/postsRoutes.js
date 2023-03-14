const express = require("express");
const router = express.Router();
const {generateUploadURL} = require("../utils/s3");

const {
	createStatus,
	getStatusesFromMe,
	getStatusesFromFriends,
	getStatusesFromOtherUser,
	likesStatus,
	unlikeStatus,
	getStatusComments,
	getStatus,
	addStatusComment,
	deleteStatus,
	updateStatus,
} = require("../controllers/postController");
const {protect} = require("../middleware/authMiddleware");
const {
	addPhotoPost,
	getPhotoPostsFromFriends,
	getPhotoPostsFromOtherUser,
	likesPhotoPost,
	ulikePhotoPost,
	getPhotoPost,
	getPhotoComments,
	addPhotoComment,
	detelePhotoPost,
	updatePhotoPost,
} = require("../controllers/postController");

//router.post('/', createPost);
router.post("/addStatus", protect, createStatus);
router.get("/getStatusesFromMe", protect, getStatusesFromMe);
router.get("/getStatusesFromFriends", protect, getStatusesFromFriends);
router.get("/getStatusesFromOtherUser/:id", protect, getStatusesFromOtherUser);
router.post("/addPhotoPost", protect, addPhotoPost);
router.get("/getPhotoPostsFromFriends", protect, getPhotoPostsFromFriends);
router.get("/getPhotoPostsFromOtherUser/:id", protect, getPhotoPostsFromOtherUser);
router.post("/likesStatus/:id", protect, likesStatus);
router.delete("/unlikeStatus/:id", protect, unlikeStatus);
router.post("/likesPhotoPost/:id", protect, likesPhotoPost);
router.delete("/unlikePhotoPost/:id", protect, ulikePhotoPost);
router.get("/getPhotoPost/:id", protect, getPhotoPost);
router.get("/getPhotoPost/:id/comments", protect, getPhotoComments);
router.post("/getPhotoPost/:id/comments", protect, addPhotoComment);
router.get("/getStatus/:id", protect, getStatus);
router.get("/getStatus/:id/comments", protect, getStatusComments);
router.post("/getStatus/:id/comments", protect, addStatusComment);
router.delete("/deleteStatus/:id", protect, deleteStatus);
router.delete("/deletePhotoPost/:id", protect, detelePhotoPost);
router.put("/updateStatus/:id", protect, updateStatus);
router.put("/updatePhotoPost/:id", protect, updatePhotoPost);

module.exports = router;
