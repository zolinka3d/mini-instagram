import React from "react";
import {useForm} from "react-hook-form";
import axios from "axios";
import {useNavigate} from "react-router-dom";

function DeleteUserForm() {
	const {register, handleSubmit, unregister} = useForm();
	const navigate = useNavigate();

	const deleteAccountURL = `${process.env.REACT_APP_DELETE_ACCOUNT}`;
	const onSubmit = (data) => {
		if (data.confirmDelete) {
			axios
				.delete(deleteAccountURL, {
					withCredentials: true,
				})
				.then((res) => {
					navigate("/");
				})
				.catch((error) => {
					console.log("Error", error.message);
				});
		}
		unregister("confirmDelete");
	};
	return (
		<form onSubmit={handleSubmit(onSubmit)} className="pr-10 pl-10 flex flex-col">
			<button type="submit" className="bg-dark p-2 rounded text-whity">
				Delete Account
			</button>
			<div className=" p-1">
				<input type="checkbox" name="confirmDelete" {...register("confirmDelete")} />
				<label className="p-1">Are you sure you want to delete an account?</label>
			</div>
		</form>
	);
}

export default DeleteUserForm;
