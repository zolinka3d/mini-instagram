const aws = require("aws-sdk");
const dotenv = require("dotenv");
const uuid = require("uuid");

dotenv.config();

const region = "eu-central-1";
const bucketName = "zolinka3d-project-uni";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new aws.S3({
	region,
	accessKeyId,
	secretAccessKey,
	signatureVersion: "v4",
});

async function generateUploadURL() {
	const imageName = uuid.v4();

	const params = {
		Bucket: bucketName,
		Key: imageName,
		Expires: 60,
	};

	const uploadURL = await s3.getSignedUrlPromise("putObject", params);
	return uploadURL;
}

module.exports = {generateUploadURL};
