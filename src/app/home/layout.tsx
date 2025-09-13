import Navbar from "@/src/components/Navbar/Navbar";
import { Link } from "lucide-react";
// import styles from "./page.module.css";
// import RequireAuth from "../components/auth/requireAuth";


export default function HomeLayout() {
    return (
        <div className="w-full h-screen flex flex-row">

            <div className="w-[300px] h-screen flex item-center justify-around flex-col p-10 overflow-y-auto bg-black text-white">
                <div className="height-[200px] border-[#696E79]-2">
                    <h1 className="text-[#01C38D] text-2xl" >WorkSpaces</h1>
                </div>

                <div>
                    <p className="text-[#01C38D] text-2xl">Home</p>
                </div>

                <div className="">
                    <p className="text-[#01C38D]" >Muhammad Usama</p>
                </div>

            </div>


            <div className="w-screen h-screen flex item-center justify-center flex-col p-10 overflow-y-scroll text-white">
                <p>Welcome to outcome builders</p>

            </div>
        </div>
    );
}
