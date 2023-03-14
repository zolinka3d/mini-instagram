import React from "react";
import Header from "../components/Header";
import StatusPost from "../components/StatusPost";
import {useParams} from "react-router-dom";
import axios from "axios";
import {useState, useLayoutEffect} from "react";
import {useForm} from "react-hook-form";

function StatusWithComments() {
	const {id} = useParams();
	const [status, setStatus] = useState({createdAt: "0"});
	const [comments, setComments] = useState([]);
	const [refresh, setRefresh] = useState(false);

	const {register, handleSubmit, reset} = useForm();

	const getStatusURL = `${process.env.REACT_APP_GET_STATUS}`;
	const getStauts = async () => {
		await axios
			.get(getStatusURL + id, {
				withCredentials: true,
			})
			.then((res) => {
				setStatus(res.data);
			})
			.catch((error) => {
				console.log("Error: ", error.message);
			});
	};

	const getStatusCommentsURL = `${process.env.REACT_APP_GETSTATUSCOMMENTS}`;
	const getStatusComments = async () => {
		await axios
			.get(getStatusCommentsURL + id + `/comments`, {
				withCredentials: true,
			})
			.then((res) => {
				setComments(res.data);
			})
			.catch((error) => {
				console.log("Error: ", error.message);
			});
	};

	const sendStatusCommentURL = `${process.env.REACT_APP_SENDSTATUSCOMMENT}`;
	const onSubmit = async (data) => {
		await axios
			.post(
				sendStatusCommentURL + id + `/comments`,
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

	useLayoutEffect(() => {
		getStauts();
		getStatusComments();
		//eslint-disable-next-line
	}, [refresh]);

	return (
		<div className="bg-light h-screen">
			<Header />
			<div className="flex bg-light p-10 gap-5">
				<StatusPost status={status} />
				<div className="bg-medium p-10 rounded max-w-sm max-h-60">
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="flex gap-2">
							<input type="text" {...register("comment")} />
							<button className="addCommentButton" type="submit">
								Add comment
							</button>
						</div>
					</form>
					<ul className="mt-5 flex flex-col gap-1 overflow-y-auto max-h-24">
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

export default StatusWithComments;
