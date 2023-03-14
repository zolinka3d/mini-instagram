const yup = require("yup");

const statusSchema = yup.object().shape({
	text: yup.string("text should be string").required("Please add text"),
	private: yup
		.boolean("private should be boolean")
		.required("please say if status is private or not"),
});

const photoPostSchema = yup.object().shape({
	photo: yup.string("photo should be string").required("Please add photo"),
	private: yup
		.boolean("private should be boolean")
		.required("please say if post is private or not"),
});

const commentSchema = yup.object().shape({
	text: yup.string("text should be string").min(2, "text is too short").required("Please add text"),
});

module.exports = {statusSchema, photoPostSchema, commentSchema};
