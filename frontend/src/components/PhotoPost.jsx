import {FaHeart, FaRegHeart, FaTrashAlt} from "react-icons/fa";
import {useState, useLayoutEffect} from "react";
import axios from "axios";
import {Link} from "react-router-dom";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";

function PicturePost({image, IsItMyProfile}) {
	const [likedByMe, setLikedByMe] = useState(image.likedByMe);
	const [likes, setLikes] = useState(image.likes);
	const {added, setAdded} = useContext(ContextApi);

	const likesPhotoURL = `${process.env.REACT_APP_LIKES_PHOTO}`;
	const unlikesPhotoURL = `${process.env.REACT_APP_UNLIKES_PHOTO}`;
	const handleLike = async () => {
		setLikedByMe(!likedByMe);

		if (!likedByMe) {
			await axios
				.post(
					likesPhotoURL + image.id,
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
				.delete(unlikesPhotoURL + image.id, {
					withCredentials: true,
				})
				.then((res) => {
					setLikes(likes - 1);
				})
				.catch((error) => {
					console.log("Error: ", error.message);
				});
		}
	};

	const deletePhotoURL = `${process.env.REACT_APP_DELETE_PHOTO_POST}`;
	const deletePhoto = async () => {
		await axios
			.delete(deletePhotoURL + image.id, {withCredentials: true})
			.then((res) => {
				setAdded(added - 1);
			})
			.catch((error) => {
				console.log("Error: ", error.message);
			});
	};
	useLayoutEffect(() => {
		setLikes(image.likes);
		setLikedByMe(image.likedByMe);
	}, [image]);

	return (
		<li className="bg-whity text-dark max-w-sm rounded overflow-hidden shadow-lg post list-none">
			<div>
				<img src={image.photo} alt="" />
			</div>
			<div className="px-6 py-4">
				<div className="flex gap-2 font-bold text-gray-500 text-xl mb-2">
					<div className="flex justify-between w-full">
						<div className="flex gap-2">
							<div>Photo by</div>
							<div>{image.owner}</div>
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
				<ul>
					<li>
						<strong>Likes: </strong>
						{likes}
					</li>
					<li>
						<Link to={"/PhotoPostWithComments/" + image.id} className="font-bold">
							Comments:{" "}
						</Link>
						{" " + image.comments}
					</li>
					<li className="flex justify-between">
						<div className="flex gap-1 ">
							<div className="font-bold">Added: </div>
							<div>{image.createdAt ? image.createdAt.slice(0, 10) : ""}</div>
						</div>
						{IsItMyProfile ? (
							<button onClick={deletePhoto} className="text-medium text-xl">
								<FaTrashAlt />
							</button>
						) : null}
					</li>
				</ul>
			</div>
		</li>
	);
}

export default PicturePost;
