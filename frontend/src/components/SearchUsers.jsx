import React from "react";
import {useEffect, useState, useRef} from "react";
import axios from "axios";
import {FaUserPlus, FaUsers, FaChild} from "react-icons/fa";
import {RiMailSendLine} from "react-icons/ri";
import {debounce} from "lodash";
import {useNavigate} from "react-router-dom";

function SearchUsers() {
	const navigate = useNavigate();
	const searchInput = useRef(null);
	useEffect(() => {
		searchInput.current.focus();
	}, []);

	const searchHandler = (e) => {
		setUsersName(e.target.value);
	};
	const [usersName, setUsersName] = useState("");
	const [users, setUsers] = useState([]);

	const appURL = `${process.env.REACT_APP_BACK}`;
	const axiosUsers = async () => {
		await axios
			.post(
				appURL + "/api/otherusers",
				{name: usersName},
				{
					withCredentials: true,
				}
			)
			.then((res) => {
				setUsers(res.data);
			})
			.catch((error) => {
				console.log("Error", error);
				if (error.response.status === 404) {
					setUsers([]);
				}
			});
	};
	const debouncedAxiosUsers = debounce(axiosUsers, 500);
	const handleRequest = async (e) => {
		const id = e.currentTarget.id;
		await axios
			.post(
				appURL + "/api/otherusers/sendrequest",
				{otherId: id},
				{
					withCredentials: true,
				}
			)
			.then((res) => {
				const changedUsers = users.map((user) => {
					if (user.id === id) {
						user.isRequested = true;
					}
					return user;
				});
				setUsers(changedUsers);
			})
			.catch((error) => {
				console.log("Error", error);
			});
	};

	const acceptHandler = async (e) => {
		const id = e.currentTarget.id;
		await axios
			.post(
				appURL + "/api/otherusers/acceptrequest",
				{otherId: id},
				{
					withCredentials: true,
				}
			)
			.then((res) => {
				const changedUsers = users.map((user) => {
					if (user.id === id) {
						user.isFriend = true;
						user.isRequested = false;
					}
					return user;
				});
				setUsers(changedUsers);
			})
			.catch((error) => {
				console.log("Error", error);
			});
	};

	useEffect(() => {
		if (usersName.length > 0) {
			debouncedAxiosUsers();
		} else if (usersName.length === 0) {
			setUsers([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usersName]);

	return (
		<div className="flex flex-col gap-2 text-light justify-center w-96">
			<form className="flex gap-2 text-dark items-center ">
				<input
					type="text"
					placeholder="Search User"
					value={usersName}
					onChange={searchHandler}
					className="w-full"
					ref={searchInput}
				/>
			</form>
			<ul className="flex flex-col gap-1 overflow-y-auto max-h-36 ">
				{users.map((user) => {
					return (
						<li key={user.name} className="flex justify-between bg-medium rounded p-3">
							<button
								onClick={() => navigate("/User/" + user.id)}
								className="text-xl flex items-center"
							>
								{user.name}
							</button>
							<div className="flex items-center gap-3">
								{!user.isFriend && !user.isRequested && !user.youRequested && (
									<button id={user.id} onClick={handleRequest} className="text-l">
										<FaUserPlus />
									</button>
								)}
								{user.isRequested && (
									<div className="text-l flex flex-col items-center">
										<RiMailSendLine />
										<h1>sent</h1>
									</div>
								)}
								{user.isFriend && (
									<div className="text-xl">
										<FaUsers />
									</div>
								)}
								{user.youRequested && !user.isFriend && (
									<button
										id={user.id}
										onClick={acceptHandler}
										className="text-l flex flex-col items-center"
									>
										<FaChild />
										<h1>accept me</h1>
									</button>
								)}
								<img className="profilePhotoSearch" src={user.profilePhoto} alt="" />
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export default SearchUsers;
