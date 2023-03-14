import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

function LoginRegister() {
	return (
		<div className="bg-light h-screen flex justify-center items-center">
			<div className="flex gap-10">
				<div className="bg-medium p-10  rounded">
					<h1 className="flex justify-center text-2xl text-light">Login</h1>
					<LoginForm />
				</div>
				<div className="bg-medium p-10  rounded">
					<h1 className="flex justify-center text-2xl text-light">Register</h1>
					<RegisterForm />
				</div>
			</div>
		</div>
	);
}

export default LoginRegister;
