import Navbar from "@/src/components/Navbar/Navbar";
// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function Home() {
    return (
        <>
            <Navbar />
            <div className="flex item-center justify-center flex-col p-10">
                <div className="w-full h-[500px]">Outcome Builder</div>
                <div className="w-full h-[500px]">Welcome to the Outcome Builder application!</div>
                <div className="w-full h-[500px]">This is the home page.</div>
            </div>
            <footer className="w-full h-[500px] bg-black text-center flex flex-col justify-center">
                <h1>Folow Us on</h1>
                <p>Welcome to the Outcome Builder application!</p>
                <p>This is end of web page.</p>
                <ul>
                    <li>Facebook</li>
                    <li>Twitter</li>
                    <li>Instagram</li>
                </ul>
            </footer>
        </>
    );
}
