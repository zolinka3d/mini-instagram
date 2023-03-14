const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const {errorHandler} = require("./middleware/errorMiddleware");
const port = process.env.PORT || 8000;

const cors = require("cors");

const app = express();
// app.use(cors({  // zezwala na wysylanie ciastecek z frontu (inny port)
//     origin: "http://uni-project.pl:3000",
//     credentials: true
// }))

// allow localhost:3000 to send cookies and uni-project.pl:3000 to send cookies
app.use(
	cors({
		origin: ["http://localhost:3000", "http://uni-project.pl:3000"],
		credentials: true,
	})
);

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/api/goals", require("./routes/goalsRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/otherusers", require("./routes/otherusersRoutes"));
app.use("/api/posts", require("./routes/postsRoutes"));

app.use(errorHandler);

app.listen(port, () => {
	console.log("Server is running on port 8000");
});
