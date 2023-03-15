import {useForm} from "react-hook-form";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";
import axios from "axios";
import {useState, useContext} from "react";
import {useNavigate} from "react-router-dom";
import ContextApi from "../context/ContextApi";

function RegisterForm() {
	const {setUserData} = useContext(ContextApi);

	const [userNameAlreadyExists, setUserNameAlreadyExists] = useState(false);
	const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

	const validationSchema = yup.object({
		userName: yup.string().required("Required").min(5, "Must be 5 characters or more"),
		email: yup.string().required("Required").email("Must be an email address"),
		password: yup
			.string()
			.required("Required")
			.min(8, "Password must be 8 characters long")
			.matches(/[0-9]/, "Password requires a number")
			.matches(/[a-z]/, "Password requires a lowercase letter")
			.matches(/[A-Z]/, "Password requires an uppercase letter")
			.matches(/[^\w]/, "Password requires a symbol"),
		password2: yup
			.string()
			.required("Required")
			.oneOf([yup.ref("password"), null], "Passwords must match"),
	});
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm({resolver: yupResolver(validationSchema)});

	const appURL = `${process.env.REACT_APP_BACK}`;
	const onSubmit = async (values) => {
		const body = {
			name: values.userName,
			email: values.email,
			password: values.password,
		};

		await axios
			.post(appURL + "/api/users", body, {
				withCredentials: true,
			})
			.then((res) => {
				setEmailAlreadyExists(false);
				setUserNameAlreadyExists(false);
				const UserDataResponse = {
					name: res.data.name,
					email: res.data.email,
					profilePhoto: res.data.profilePhoto,
					isLogged: true,
				};
				setUserData(UserDataResponse);
				navigate("/profileUpdate");
			})
			.catch((error) => {
				if (error.response.data.message === "User with email already exists") {
					setEmailAlreadyExists(true);
				} else if (error.response.data.message === "User with name already exists") {
					setUserNameAlreadyExists(true);
					setEmailAlreadyExists(false);
				} else {
					console.log("Error", error.response.data.message);
				}
			});
	};

	return (
		<form className="flex flex-col gap-2 text-medium" onSubmit={handleSubmit(onSubmit)}>
			<label className="label">
				{" "}
				Username
				<input name="userName" {...register("userName", {required: true})} />
			</label>
			{errors.userName && <p>{errors.userName.message}</p>}
			<label className="label">
				{" "}
				Email
				<input {...register("email", {required: true})} />
			</label>
			{errors.email && <p>{errors.email.message}</p>}
			<label className="label">
				{" "}
				Password
				<input type="password" {...register("password", {required: true})} />
			</label>
			{errors.password && <p>{errors.password.message}</p>}
			<label className="label">
				{" "}
				Confirm your password
				<input type="password" {...register("password2", {required: true})} />
			</label>
			{errors.password2 && <p>{errors.password2.message}</p>}
			<button type="submit" className="submitButton">
				Submit
			</button>
			{userNameAlreadyExists && <p>User with this name already exists</p>}
			{emailAlreadyExists && <p>User with this email already exists</p>}
		</form>
	);
}

export default RegisterForm;
