import express, { urlencoded } from "express"
import cors from 'cors'
import healthCheckRouter from './routes/healthCheck.route.js'
import authRouter from './routes/auth.route.js'
import cookieParser from "cookie-parser"

const app = express();

// default configuration
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());

// cors configurations 
app.use(
    cors({
        origin:process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials:true,
        methods:["GET" , "POST" , "PUT" , "PATCH" , "DELETE" , "OPTIONS"],
        allowedHeaders: ["Context-type" , "Authorization"]
    }),
)

// routes   
app.use("/api" , healthCheckRouter)
app.use("/api/auth" , authRouter)

app.get('/' , (req , res) => {
    res.send("This is backend Project")
});

export default app;