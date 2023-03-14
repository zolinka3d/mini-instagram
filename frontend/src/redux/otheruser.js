import axios from "axios";

export const getFriendshipAsync = async (id) => {
	const {data} = await axios.get("http://localhost:8000/api/otherusers/whatFriendship/" + id, {
		withCredentials: true,
	});
	return data;
};
