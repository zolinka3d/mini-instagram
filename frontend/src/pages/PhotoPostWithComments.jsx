import {useParams} from "react-router-dom";
import {useState, useEffect} from "react";
import axios from "axios";
import {useForm} from "react-hook-form";
import Header from "../components/Header";
import PhotoPost from "../components/PhotoPost";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";

function PhotoPostWithComments() {
	const {id} = useParams();
	const [image, setImage] = useState({createdAt: "0"});

	const [comments, setComments] = useState([]);
	const [refresh, setRefresh] = useState(false);
	const validationSchema = yup.object({
		comment: yup
			.string()
			.required("Required text")
			.min(3, "Comment can't be less than 3 characters"),
	});

	const {register, handleSubmit, reset} = useForm({
		resolver: yupResolver(validationSchema),
		mode: "onSubmit",
	});

	const appURL = `${process.env.REACT_APP_BACK}`;
	const getPhotoPost = async () => {
		try {
			const response = await axios.get(appURL + "/api/posts/getPhotoPost/" + id, {
				withCredentials: true,
			});
			setImage(response.data);
		} catch (error) {
			console.log("Error: ", error.message);
		}
	};

	const getPhotoComments = async () => {
		try {
			const response = await axios.get(appURL + "/api/posts/getPhotoPost/" + id + `/comments`, {
				withCredentials: true,
			});
			setComments(response.data);
		} catch (error) {
			console.log("Error: ", error.message);
		}
	};

	const onSubmit = async (data) => {
		await axios
			.post(
				appURL + "/api/posts/getPhotoPost/" + id + `/comments`,
				{
					text: data.comment,
				},
				{
					withCredentials: true,
				}
			)
			.then(() => {
				reset();
			})
			.catch((error) => {
				console.log("Error: ", error.message);
			});
		setRefresh(!refresh);
	};

	useEffect(() => {
		getPhotoPost();
		getPhotoComments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refresh]);

	return (
		<div className="bg-light h-screen">
			<Header />
			<div className="flex bg-light p-10 gap-5">
				<PhotoPost image={image} />
				<div className="bg-medium p-10 rounded max-w-sm max-h-96">
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="flex gap-2">
							<input type="text" {...register("comment")} />
							<button className="addCommentButton" type="submit">
								Add comment
							</button>
						</div>
					</form>
					<ul className="mt-5 flex flex-col gap-1 overflow-y-auto max-h-60">
						{comments.map((comment) => (
							<li key={comment.id}>
								<div className="flex gap-2 text-whity">
									<div className="font-bold ">{comment.user.name}</div>
									<div>{comment.text}</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}

export default PhotoPostWithComments;
