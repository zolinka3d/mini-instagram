import {useSelector, useDispatch} from "react-redux";
import {getFriendship} from "../redux/userSlice";
import {useLayoutEffect, useState, useMemo} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";
import gif from "../utils/loading-loading-forever.gif";

function UserInfo({user}) {
	const url_getFirendsBetween = `${process.env.REACT_APP_GET_FRIENDS_BETWEEN}`;
	const friendship = useSelector((state) => state.otheruser);
	const dispatch = useDispatch();
	const [friendsBetween, setFriendsBetween] = useState(0);

	const {id} = useParams();
	const getFriendsBetween = async () => {
		await axios
			.get(url_getFirendsBetween + id, {
				withCredentials: true,
			})
			.then((res) => {
				setFriendsBetween(res.data.howManyFriendsBetween);
			})
			.catch((err) => {
				console.log(err);
			});
	};
	useMemo(() => {
		getFriendsBetween();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useLayoutEffect(() => {
		dispatch(getFriendship(user.id));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, user.id]);

	return (
		<div className="flex flex align-center items-center justify-center gap-3 text-dark flex">
			<img className="profilePhotoProfile flex-1" src={user.profilePhoto} alt="profile" />
			<div className="flex flex-col gap-5 flex-1">
				<strong className="text-3xl  text-medium">{user.name}</strong>
				<div className="pl-3">Friends: {user.friends}</div>
				{friendship.loading === true ? <img src={gif} className="w-5" alt="loading" /> : null}
				{friendship.whatFriendship === "friends" ? <strong>You are friends</strong> : null}
				{friendship.whatFriendship === "none" && friendsBetween === 1 ? (
					<strong>
						You are not friends, but there is only {friendsBetween} friend between you!
					</strong>
				) : null}
				{friendship.whatFriendship === "none" && friendsBetween > 1 ? (
					<strong>
						You are not friends, but there are only {friendsBetween} friends between you!
					</strong>
				) : null}
				{friendship.whatFriendship === "none" && friendsBetween === 0 ? (
					<strong>You are not friends</strong>
				) : null}
				{friendship.whatFriendship === "requested" ? (
					<strong className="text-medium">Waiting friend request</strong>
				) : null}
				{friendship.whatFriendship === "youRequested" ? (
					<strong>You sent a friend request</strong>
				) : null}
				{friendship.whatFriendship === "me" ? <strong>It's me!</strong> : null}
			</div>
		</div>
	);
}

export default UserInfo;
