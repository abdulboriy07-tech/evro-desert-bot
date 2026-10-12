'use server'
import {User} from "@/models/user.model";
import { NextResponse } from "next/server";
import Database from '@/lib/database';
import { hashPassword } from '@/lib/auth';

export async function GET(){
    return Response.json({message : "hello world"});
}


export async function POST(req) {
    const data = await req.json();
    //console.log({data : data});
    const { name ,email , password } = data;
    if (!email || !(name.trim()) || !email.includes('@') || !password){
        return Response.json({
            message : 
            `Invalid input. Please enter a valid email and password`
        }, {status : 504});
    }
    //console.log(`name : ${name}, email : ${email}, password : ${password}`);
    await Database();
    // checking if a user exists
    //console.log('database connected');
    const userExist = await User.findOne({email : email});
    //console.log({
   //     user : userExist
    //});
    if(userExist){
        return Response.json({message : `Email : ${email} already in use. Please use another email.`},{status : 400});
    }

    const hashedPassword = await hashPassword(password);
    const  user_data = {
        name : name,
        email : email,
        password : hashedPassword
    };

    const created_user = await User.create({name : name , email : email, password : hashedPassword});
    //console.log({
    //    user_data : created_user
    //})
    return NextResponse.json({message : "user created"})
    //res.status(201).json({message : `User : ${name} with email : ${email} created.`})
    
}
