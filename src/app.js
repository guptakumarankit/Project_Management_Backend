import express, { urlencoded } from "express"
import cors from 'cors'
const app = express();

// default configuration
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended : true , limit : "16kb"}))
app.use(express.static("public"))

// cors configurations 

app.use(
    cors({
        origin:process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials:true,
        methods:["GET" , "POST" , "PUT" , "PATCH" , "DELETE" , "OPTIONS"],
        allowedHeaders: ["Context-type" , "Authorization"]
    }),
)

app.get('/' , (req , res) => {
    res.send("This is backend Project")
});

export default app;