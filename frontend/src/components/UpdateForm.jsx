import React from "react";
import {useForm} from "react-hook-form";
import ContextApi from "../context/ContextApi";
import {useContext} from "react";
import axios from "axios";
import {useLayoutEffect} from "react";

function UpdateForm() {
	const {userData, setUserData} = useContext(ContextApi);
	const {register, handleSubmit} = useForm();
	const [isUpdated, setIsUpdated] = React.useState(false);

	const appURL = `${process.env.REACT_APP_BACK}`;

	const onSubmit = async (values) => {
		await axios
			.put(
				appURL + "/api/users/updateMe",
				{
					profilePhoto: userData.profilePhoto,
					name: values.name.length > 0 ? values.name : userData.name,
					email: values.email.length > 0 ? values.email : userData.email,
				},
				{
					withCredentials: true,
				}
			)
			.then(() => {
				setIsUpdated(true);
			})
			.catch((error) => {
				console.log("Error", error.message);
			});
	};

	const getMe = async () => {
		await axios
			.get(appURL + "/api/users/me", {withCredentials: true})
			.then((res) => {
				setUserData(res.data);
			})
			.catch((error) => {
				console.log("Error", error.message);
			});
	};

	useLayoutEffect(() => {
		getMe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<form className="p-10 flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
			<label className="label">
				{" "}
				Username
				<input placeholder={userData.name} defaultValue={userData.name} {...register("name")} />
			</label>
			<label className="label">
				{" "}
				Email
				<input placeholder={userData.email} defaultValue={userData.email} {...register("email")} />
			</label>
			<button className="bg-dark p-2 rounded text-whity" type="submit">
				Update Profile
			</button>
			{isUpdated && <p className="text-green-500">Profile Updated!</p>}
		</form>
	);
}

export default UpdateForm;
