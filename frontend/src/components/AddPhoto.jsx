import {useForm} from "react-hook-form";
import {useState} from "react";
import axios from "axios";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";

function AddPhoto() {
	const {added, setAdded} = useContext(ContextApi);
	const [disable, setDisable] = useState(true);
	const [imageUrl, setImageUrl] = useState(null);
	const [isPrivate, setIsPrivate] = useState(false);

	const validationSchema = yup.object({
		file: yup.mixed().required("Required file"),
	});

	const {
		register,
		handleSubmit,
		formState: {errors},
		reset,
	} = useForm({resolver: yupResolver(validationSchema)});

	const appURL = `${process.env.REACT_APP_BACK}`;

	const onSubmit = async (values) => {
		const file = values.file[0];
		const {url} = await fetch(appURL + "/api/users/s3Url").then((res) => res.json());
		await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "multipart/form-data",
			},
			body: file,
		});
		setImageUrl(url.split("?")[0]);
		//setIsPrivate(values.isPrivate);
		setDisable(false);
	};

	const checkbox = () => {
		setIsPrivate(!isPrivate);
	};

	const postPhoto = async () => {
		await axios
			.post(
				appURL + "/api/posts/addPhotoPost",
				{
					photo: imageUrl,
					private: isPrivate,
				},
				{
					withCredentials: true,
				}
			)
			.then((res) => {
				reset();
				setDisable(true);
				setImageUrl(null);
				setAdded(added + 1);
				setIsPrivate(false);
			})
			.catch((error) => {
				console.log("Error", error.message);
			});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 add">
			<div className="flex gap-2">
				<input className="text-dark" type="file" {...register("file", {required: true})} />
				{errors.file && <p>{errors.file.message}</p>}
				<button className="addingButton" type="submit">
					Upload
				</button>
			</div>
			<label className="checkbox">
				<input onClick={checkbox} type="checkbox" {...register("isPrivate")} /> Private
			</label>
			<button onClick={postPhoto} className="addingButton" disabled={disable}>
				Add photo
			</button>
		</form>
	);
}

export default AddPhoto;
