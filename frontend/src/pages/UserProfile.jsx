import Header from "../components/Header";
import StatusPost from "../components/StatusPost";
import PhotoPost from "../components/PhotoPost";
import {useState, useEffect, useLayoutEffect} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";
import UserInfo from "../components/UserInfo";
import {useSelector, useDispatch} from "react-redux";
import {getFriendship} from "../redux/userSlice";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";

function UserProfile() {
	const {id} = useParams();
	const [photos, setPhotos] = useState([]);
	const [statuses, setStatuses] = useState([]);
	const [otherUserInfo, setOtherUserInfo] = useState([]);
	const [isItMyProfile, setIsItMyProfile] = useState(false);
	const friendship = useSelector((state) => state.otheruser);
	const dispatch = useDispatch();
	const {added} = useContext(ContextApi);

	const appURL = `${process.env.REACT_APP_BACK}`;
	const getStatuses = async () => {
		await axios
			.get(appURL + "/api/posts/getStatusesFromOtherUser/" + id, {
				withCredentials: true,
			})
			.then((response) => {
				setStatuses(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const getPhotos = async () => {
		await axios
			.get(appURL + "/api/posts/getPhotoPostsFromOtherUser/" + id, {
				withCredentials: true,
			})
			.then((response) => {
				setPhotos(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const getOtherUserInfoForProfile = async () => {
		await axios
			.get(appURL + "/api/otherusers/getotheruserinfo/" + id, {
				withCredentials: true,
			})
			.then((response) => {
				setOtherUserInfo(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	};

	useEffect(() => {
		getStatuses();
		getPhotos();
		getOtherUserInfoForProfile();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, added]);

	useLayoutEffect(() => {
		dispatch(getFriendship(id));
		if (friendship.whatFriendship === "me") {
			setIsItMyProfile(true);
		} else {
			setIsItMyProfile(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, friendship.whatFriendship]);

	return (
		<div className="bg-light h-screen">
			<Header />

			<div className="bg-light flex flex-col gap-5 items-center p-5">
				<UserInfo user={otherUserInfo} />
				<div className="flex items-center justify-center gap-5">
					<div className="flex gap-5 ">
						<div className="text-dark flex-1">
							<ul className="flex flex-col gap-5">
								{photos.map((photo, id) => (
									<PhotoPost key={id} image={photo} IsItMyProfile={isItMyProfile} />
								))}
							</ul>
						</div>
						<div className="flex flex-col gap-5 text-dark flex-1">
							<ul className="flex flex-col gap-5">
								{statuses.map((status, id) => (
									<StatusPost key={id} status={status} IsItMyProfile={isItMyProfile} />
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default UserProfile;
