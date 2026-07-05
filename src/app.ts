import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { join } from "node:path";
import cors from "cors";
import { error } from "node:console";
import { prisma } from "./lib/prisma";
import  httpStatus  from "http-status";
import bcrypt from "bcryptjs";


const app : Application = express();

app.use(cors({
    origin: config.app_url,
    credentials: true,
}))

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser())

app.get("/",(req : Request, res : Response) => {
    res.send("Hello, World!");
});


app.post("/api/users/register", async (req: Request , res: Response) => {
    const {name , email , password, profilePhoto} = req.body;
    console.log(name , email)

    const isUserExist = await prisma.user.findUnique({
        where : {email}
    })
    if(isUserExist){
        throw new Error("User already exist")
    }

   const hashedPassword = await bcrypt.hash(password , Number(config.bcrypt_salt_rounds))

   const createdUser = await prisma.user.create({
    data: {
        name,
        email,
        password: hashedPassword,
    }
   });
   
  await prisma.profile.create({
    data: {
        userId: createdUser.id,
        profilePhoto,
    }
   })

   const user = await prisma.user.findUnique({
    where: {
        id: createdUser.id, 
        email: createdUser.email || email, 
    },
    include: {
        profile: true
    }
   })

    res.status(httpStatus.CREATED ).json({
        success: true,
        statusCode: httpStatus.CREATED,
        massage:"user register successfully ",
        data : {
            user
        }
    })
})

export default app;