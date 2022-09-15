const {MongoClient,ObjectId}=require('mongodb');
const dotenv=require('dotenv');

dotenv.config();



const mongo={
    db:null,
    products:null,
    users:null,
    admins:null,
    ObjectId,
    async connect(){
        try{
            const client = new MongoClient(process.env.MONGO_URL);
            await client.connect();
            this.db=client.db("rental");
            this.users=await this.db.collection("users");
            this.products=await this.db.collection("products");
            this.admins=await this.db.collection("admins");
            console.log("Mongo connection established successfully");
        }
        catch(e){
            console.log("error in connection of mongo db",e.message);
        }
    }
}

module.exports=mongo;