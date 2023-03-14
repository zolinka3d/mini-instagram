import {FaHome, FaUserEdit, FaDoorOpen} from "react-icons/fa";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";

function Header() {
	const navigate = useNavigate();
	const {userData} = useContext(ContextApi);
	const [userPhoto, setUserPhoto] = useState(
		"https://zolinka3d-project-uni.s3.eu-central-1.amazonaws.com/incognito.jpg"
	);
	const [userId, setUserId] = useState("");

	const homeNavigate = () => {
		navigate("/home");
	};
	const logoutURL = `${process.env.REACT_APP_LOGOUT}`;
	const logout = async () => {
		navigate("/");
		await axios
			.post(
				logoutURL,
				{},
				{
					withCredentials: true,
				}
			)
			.then((res) => {})
			.catch((error) => {
				console.log("Error", error);
			});
	};
	const getMeURL = `${process.env.REACT_APP_ME}`;
	useEffect(() => {
		const getUserPhoto = async () => {
			await axios
				.get(getMeURL, {
					withCredentials: true,
				})
				.then((res) => {
					setUserPhoto(res.data.profilePhoto);
					setUserId(res.data.id);
				})
				.catch((error) => {
					console.log("Error", error);
				});
		};
		getUserPhoto();
	}, [userId, userData]);

	return (
		<header className="bg-medium text-light p-3 pr-10 pl-10 flex justify-between text-2xl w-full">
			<button onClick={homeNavigate} className="flex justify-center items-center gap-2">
				<h1 className="">Zosik</h1>
				<FaHome className=" " />
			</button>
			<div className="flex gap-10 justify-center align-middle">
				<Link to={"/User/" + userId}>
					{" "}
					<img src={userPhoto} className="profilePhotoHeader " alt="profilePhoto" />
				</Link>
				<Link to="/profileUpdate" className="flex p-2 justify-center align-middle">
					{" "}
					<FaUserEdit />
				</Link>
				<button onClick={logout} className="flex p-2 justify-center align-middle">
					<FaDoorOpen />
				</button>
			</div>
		</header>
	);
}

export default Header;
