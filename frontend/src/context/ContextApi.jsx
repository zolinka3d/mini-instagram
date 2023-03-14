import React, {createContext, useState} from "react";

const ContextApi = createContext();

export function FeedbackProvider({children}) {
	const [userData, setUserData] = useState({
		isLogged: false,
	});

	const [userId, setUserId] = useState("");

	const [added, setAdded] = useState(0);

	return (
		<ContextApi.Provider value={{userData, setUserData, userId, setUserId, added, setAdded}}>
			{children}
		</ContextApi.Provider>
	);
}

export default ContextApi;
