import {useForm} from "react-hook-form";
import axios from "axios";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";

function AddStatus() {
	const {added, setAdded} = useContext(ContextApi);
	const validationSchema = yup.object({
		status: yup.string().required("Required text").min(8, "Status can't be less than 8 characters"),
	});
	const {
		register,
		handleSubmit,
		reset,
		formState: {errors},
	} = useForm({resolver: yupResolver(validationSchema)});

	const appURL = `${process.env.REACT_APP_BACK}`;
	const onSubmit = async (values) => {
		const body = {
			text: values.status,
			private: values.isPrivate,
		};
		await axios
			.post(appURL + "/api/posts/addStatus", body, {
				withCredentials: true,
			})
			.then(() => {
				setAdded(added + 1);
				reset();
			})
			.catch((error) => {
				console.log("Error", error.message);
			});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 add">
			<textarea type="text" placeholder="Write something" {...register("status")} />
			<div>
				<label className="checkbox">
					<input type="checkbox" {...register("isPrivate")} /> Private
				</label>
				{errors.status && <p className="error">{errors.status.message}</p>}
			</div>
			<button type="submit" className="addingButton">
				Add status
			</button>
		</form>
	);
}

export default AddStatus;
