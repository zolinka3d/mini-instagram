import {useForm} from "react-hook-form";
import ContextApi from "../context/ContextApi";
import {useContext} from "react";

function UploadWidget() {
	const {userData, setUserData} = useContext(ContextApi);

	const {register, handleSubmit} = useForm();

	const gets3Url = `${process.env.REACT_APP_GET_S3}`;
	const onSubmit = async (values) => {
		const file = values.file[0];
		const {url} = await fetch(gets3Url).then((res) => res.json());
		console.log(values.file[0]);

		// post the image direclty to the s3 bucket
		await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "multipart/form-data",
			},
			body: file,
		});
		const imageUrl = url.split("?")[0];
		setUserData({
			...userData,
			profilePhoto: imageUrl,
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex pr-10 pl-10">
			<div className="flex flex-col gap-5">
				<input className="text-dark" type="file" {...register("file", {required: true})} />
				<button className="bg-dark p-2 rounded text-whity" type="submit">
					Upload Photo
				</button>
			</div>
			<div>
				<img src={userData.profilePhoto} className="profilePhotoUpdate" alt="profilePhoto" />
			</div>
		</form>
	);
}

export default UploadWidget;
