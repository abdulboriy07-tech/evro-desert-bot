'use client'
import { CiLogin } from "react-icons/ci";
import Database from "@/lib/database";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import React, { HtmlHTMLAttributes, useState } from "react";
import {signOut, signIn } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import axios, {AxiosError} from 'axios'
export default function Home(){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {toast} = useToast();
    
    //Database();
    

    async function   createUser(name : string, email : string , password : string) {
        await axios.post('/api/auth/Signup', {
            name : name,
            email : email, 
            password : password
        }).then((response) => {
            //console.log("--:"+name + email + password);
            
            if(response.status != 200){
                toast({
                    variant : "destructive",
                    title : "Error",
                    description : `${response.data.message}`
                })
            }
            else {
                toast({
                    variant : "default",
                    title : "user created."

                })
            }
            
           //console.log({
           // Signup : response
           //})
        }
    )

    }
    
    const SignupButtonHandler = async() => {
        await createUser(name, email , password);
            /*
            toast({
                variant : "destructive",
                title : "Error Encountered",
                description : `Error : ${error.response.data.message}`
            })
            */
            //console.log(error);
        
        setEmail("");
        setName("");
        setPassword("");
    }
    return(
        <main className = "flex items-center justify-center py-8">
            <section className = "flex mt-8 items-center flex-col justify-center bg-rose-200 px-8 py-4 space-y-6 min-w-[20rem] rounded-md">
                <h1 className = "text-3xl flex items-center justify-center gap-4 font-serif">Sign Up <CiLogin/></h1>
                <input value = {email} type = 'email' className = "px-4 py-2 rounded-md border-2 w-full border-black" onChange = {(e : React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="Email"/>
                <input value = {name} type = "text" className = "px-4 py-2 rounded-md border-2 w-full border-black" onChange = {(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder = "Name" />
                <input value = {password} type = "password" className = "px-4 py-2 rounded-md border-2 w-full border-black" onChange = {(e : React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder = "Password"/>
                <Button onClick = {SignupButtonHandler} className = "w-full rounded-md border-2 px-4 py-2">Sign Up</Button>
                <div className = "flex items-center justify-between w-full ">
                    <Button className = "flex w-full bg-white text-black hover:bg-slate-400 items-center justify-center gap-4"><FcGoogle /> Google</Button>
                </div>
                <p className = "text-lg font-serif">Already Have an account? Login <Link className = "text-blue-500 underline" href = "/auth/Login">here</Link> </p>
            </section>
        </main>
    )
}