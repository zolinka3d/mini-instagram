import ContextApi from "../context/ContextApi";
import {useContext} from "react";
import axios from "axios";
import {useForm} from "react-hook-form";

function DeleteProfilePhoto() {
	const {userData, setUserData} = useContext(ContextApi);
	const {register, handleSubmit, unregister} = useForm();

	const appURL = `${process.env.REACT_APP_BACK}`;
	const onSubmit = async (data) => {
		if (data.confirmDelete) {
			await axios
				.delete(appURL + "/api/users/deleteProfilePhoto", {
					withCredentials: true,
				})
				.then((res) => {
					setUserData({
						...userData,
						profilePhoto: res.data.data.profilePhoto,
					});
				});
		}
		unregister("confirmDelete");
	};

	return (
		<form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
			<button type="submit" className="bg-dark p-2  mr-40 ml-10 rounded text-whity">
				Delete a Profile Photo
			</button>
			<div className="mr-40 ml-10 p-1">
				<input type="checkbox" name="confirmDelete" {...register("confirmDelete")} />
				<label className="p-1">Are you sure you want to delete a profile photo?</label>
			</div>
		</form>
	);
}

export default DeleteProfilePhoto;
