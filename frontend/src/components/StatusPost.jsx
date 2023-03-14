import {FaHeart, FaRegHeart, FaTrashAlt} from "react-icons/fa";
import {useState, useLayoutEffect} from "react";
import axios from "axios";
import {Link} from "react-router-dom";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";

function StatusPost({status, IsItMyProfile}) {
	const [likedByMe, setLikedByMe] = useState(status.likedByMe);
	const [likes, setLikes] = useState(status.likes);
	const {added, setAdded} = useContext(ContextApi);

	const likesStatusURL = `${process.env.REACT_APP_LIKES_STATUS}`;
	const unlikeStatusURL = `${process.env.REACT_APP_UNLIKES_STATUS}`;
	const handleLike = async () => {
		setLikedByMe(!likedByMe);

		if (!likedByMe) {
			await axios
				.post(
					likesStatusURL + status.id,
					{},
					{
						withCredentials: true,
					}
				)
				.then((res) => {
					setLikes(likes + 1);
				})
				.catch((error) => {
					console.log("Error: ", error.message);
				});
		} else {
			await axios
				.delete(unlikeStatusURL + status.id, {
					withCredentials: true,
				})
				.then(() => {
					setLikes(likes - 1);
				})
				.catch((error) => {
					console.log("Error: ", error.message);
				});
		}
	};

	const deleteStatus = async () => {
		const deleteStatusURL = `${process.env.REACT_APP_DELETE_STATUS}`;
		await axios
			.delete(deleteStatusURL + status.id, {
				withCredentials: true,
			})
			.then((res) => {
				setAdded(added - 1);
			})
			.catch((error) => {
				console.log("Error: ", error.message);
			});
	};

	useLayoutEffect(() => {
		setLikes(status.likes);
		setLikedByMe(status.likedByMe);
	}, [status]);

	return (
		<li className="bg-whity text-dark max-w-sm rounded overflow-hidden shadow-lg px-6 py-4 post list-none">
			<div className="flex gap-2 font-bold text-gray-500 text-xl mb-2">
				<div className="flex justify-between w-full">
					<div className="flex gap-2">
						<div>Status by</div>
						<div>{status.owner}</div>
					</div>
					{likedByMe ? (
						<button onClick={handleLike}>
							<FaHeart className="text-medium" />
						</button>
					) : (
						<button onClick={handleLike}>
							<FaRegHeart className="text-medium" />{" "}
						</button>
					)}
				</div>
			</div>
			<div className="pt-4 pb-4">{status.text}</div>
			<ul>
				<li>
					<strong>Likes: </strong>
					{likes}
				</li>
				<li>
					<Link to={"/StatusWithComments/" + status.id} className="font-bold">
						Comments:{" "}
					</Link>
					{status.comments}
				</li>
				<li className="flex justify-between">
					<div className="flex gap-1 ">
						<div className="font-bold">Added: </div>
						<div>{status.createdAt ? status.createdAt.slice(0, 10) : ""}</div>
					</div>
					{IsItMyProfile ? (
						<button onClick={deleteStatus} className="text-medium text-xl">
							<FaTrashAlt />
						</button>
					) : null}
				</li>
			</ul>
		</li>
	);
}

export default StatusPost;
