import React from "react";
import UploadWidget from "../components/UploadWidget";
import UpdateForm from "../components/UpdateForm";
import Header from "../components/Header";
import DeleteUserForm from "../components/DeleteUserForm";
import DeleteProfilePhoto from "../components/DeleteProfilePhoto";

function ProfileUpdate() {
	return (
		<div className="bg-light h-screen flex flex-col items-center gap-10 text-light">
			<Header />
			<div className="flex flex-col p-10 bg-medium rounded gap-2">
				<h1 className="flex justify-center text-2xl text-light">Update Profile</h1>
				<UploadWidget />
				<DeleteProfilePhoto />
				<UpdateForm />
				<DeleteUserForm />
			</div>
		</div>
	);
}

export default ProfileUpdate;
