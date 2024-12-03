const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send(`server is running`);
})

app.listen(PORT, () => {
  console.log(`server is running on the ${PORT}`);
});
