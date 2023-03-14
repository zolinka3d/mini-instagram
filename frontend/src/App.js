import "./App.css";
import LoginRegister from "./pages/LoginRegister";
import ProfileUpdate from "./pages/ProfileUpdate";
import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import PhotoPostWithComments from "./pages/PhotoPostWithComments";
import StatusWithComments from "./pages/StatusWithComments";

function App() {
	return (
		<>
			<Router>
				<Routes>
					<Route path="/" element={<LoginRegister />} />
					<Route path="/profileUpdate" element={<ProfileUpdate />} />
					<Route path="/home" element={<Home />} />
					<Route path="/User/:id" element={<UserProfile />} />
					<Route path="/PhotoPostWithComments/:id" element={<PhotoPostWithComments />} />
					<Route path="/StatusWithComments/:id" element={<StatusWithComments />} />
					<Route path="*" element={<h1>404 Not Found</h1>} />
				</Routes>
			</Router>
		</>
	);
}

export default App;
