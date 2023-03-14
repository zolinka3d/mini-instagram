import {configureStore} from "@reduxjs/toolkit";
import otheruserSlice from "./userSlice";

export default configureStore({
	reducer: {
		otheruser: otheruserSlice,
	},
});
