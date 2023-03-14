import {useForm} from "react-hook-form";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";
import axios from "axios";
import ContextApi from "../context/ContextApi";
import {useContext, useState} from "react";
import {useNavigate} from "react-router-dom";

function LoginForm() {
	const {setUserData} = useContext(ContextApi);
	const [invalidCredentials, setInvalidCredentials] = useState(false);

	const validationSchema = yup.object({
		email: yup.string().required("Required").email("Must be an email address"),
		password: yup.string().required("Required"),
	});
	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm({resolver: yupResolver(validationSchema)});

	const navigate = useNavigate();

	const loginURL = `${process.env.REACT_APP_LOGIN}`;
	const onSubmit = async (values) => {
		const body = {
			email: values.email,
			password: values.password,
		};
		await axios
			.post(loginURL, body, {
				withCredentials: true,
			})
			.then((res) => {
				const UserDataResponse = {
					name: res.data.name,
					email: res.data.email,
					profilePhoto: res.data.profilePhoto,
					isLogged: res.data.isLogged,
				};
				if (UserDataResponse.isLogged === true) {
					setUserData(UserDataResponse);
					navigate("/home");
				}
			})
			.catch((error) => {
				console.log(error.response.data.message);
				if (error.response.data.message === "Invalid email or password") {
					setInvalidCredentials(true);
				} else {
					console.log("Error", error.message);
				}
			});
	};

	return (
		<form className="flex flex-col gap-3 text-medium" onSubmit={handleSubmit(onSubmit)}>
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
			<button type="submit" className="submitButton">
				Submit
			</button>
			{invalidCredentials && <p>Invalid email or password</p>}
		</form>
	);
}

export default LoginForm;
