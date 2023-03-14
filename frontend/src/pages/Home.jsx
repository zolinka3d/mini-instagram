import SearchUsers from "../components/SearchUsers";
import Header from "../components/Header";
import Gallery from "../components/Gallery";

function Home() {
	return (
		<div className="bg-light h-screen flex flex-col items-center gap-5">
			<Header />
			<SearchUsers />
			<Gallery />
		</div>
	);
}

export default Home;
