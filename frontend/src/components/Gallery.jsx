import PhotoPost from "./PhotoPost";
import StatusPost from "./StatusPost";
import AddPhoto from "./AddPhoto";
import AddStatus from "./AddStatus";
import {useState} from "react";
import {FaPlus, FaAngleUp} from "react-icons/fa";
import {useEffect} from "react";
import axios from "axios";
import {useContext} from "react";
import ContextApi from "../context/ContextApi";

function Gallery() {
	const {added} = useContext(ContextApi);
	const [addStatusClicked, setAddStatusClicked] = useState(false);
	const [addPhotoClicked, setAddPhotoClicked] = useState(false);

	const [photos, setPhotos] = useState([]);
	const [statuses, setStatuses] = useState([]);
	const hadleAddStatusClicking = () => {
		setAddStatusClicked(true);
	};
	const hadleAddPhotoClicking = () => {
		setAddPhotoClicked(true);
	};
	const handleAddPhotoUnclicking = () => {
		setAddPhotoClicked(false);
	};
	const handleAddStatusUnclicking = () => {
		setAddStatusClicked(false);
	};

	const getStatusesFromFriendsURL = `${process.env.REACT_APP_GET_STATUSES_FROM_FRIENDS}`;
	const getStatuses = async () => {
		await axios
			.get(getStatusesFromFriendsURL, {
				withCredentials: true,
			})
			.then((res) => {
				setStatuses(res.data);
			})
			.catch((error) => {
				console.log("Error", error.message);
			});
	};
	const getPhotosFromFriendsURL = `${process.env.REACT_APP_GET_PHOTOS_FROM_FRIENDS}`;
	const getPhotos = async () => {
		await axios
			.get(getPhotosFromFriendsURL, {
				withCredentials: true,
			})
			.then((res) => {
				setPhotos(res.data);
			})
			.catch((error) => {
				console.log("Error", error.message);
			});
	};

	useEffect(() => {
		getStatuses();
		getPhotos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [added]);

	return (
		<div className="flex gap-5">
			<div className="flex flex-col gap-5 text-dark">
				{!addPhotoClicked ? (
					<button onClick={hadleAddPhotoClicking} className="flex flex-col items-center">
						<FaPlus />
					</button>
				) : (
					<div className="flex flex-col gap-3">
						{" "}
						<button onClick={handleAddPhotoUnclicking} className="self-center">
							<FaAngleUp />
						</button>{" "}
						<AddPhoto />{" "}
					</div>
				)}
				<ul className="flex flex-col gap-5">
					{photos.map((photo, id) => (
						<PhotoPost key={id} image={photo} />
					))}
				</ul>
			</div>
			<div className="flex flex-col gap-5 text-dark">
				{!addStatusClicked ? (
					<button onClick={hadleAddStatusClicking} className="self-center">
						<FaPlus />
					</button>
				) : (
					<div className="flex flex-col gap-3">
						{" "}
						<button onClick={handleAddStatusUnclicking} className="self-center">
							<FaAngleUp />
						</button>{" "}
						<AddStatus />{" "}
					</div>
				)}
				<ul className="flex flex-col gap-5">
					{statuses.map((status, id) => (
						<StatusPost key={id} status={status} />
					))}
				</ul>
			</div>
		</div>
	);
}

export default Gallery;
