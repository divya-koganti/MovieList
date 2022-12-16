let http = require('http');
const path = require("path");
const express = require("express"); 
const app = express(); 
const bodyParser = require("body-parser"); 

app.use(bodyParser.urlencoded({extended:false}));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");


require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })  
const portNumber = 5000;

const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;
const apiKey = process.env.KEY;




const databaseAndCollection = {db: db, collection: collection};

const { MongoClient, ServerApiVersion } = require('mongodb');
const e = require('express');
const uri = `mongodb+srv://${username}:${password}@cluster0.ldn97rs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

let currEmail = "";
let currPass = "";


async function signUpUser(newUser) {
    try {

        await client.connect();

        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newUser);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
};

async function existingEmail(userEmail) {
    try {
        await client.connect();
        let filter = {email: userEmail};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);

        
        if (result) {
            return true;
        }
        else {
            return false;
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

};

async function validLogIn(userEmail, userPassword) {
    try {
        await client.connect();
        let filter = {email: userEmail};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);

        
        if (result && (result.password === userPassword)) {
            return true;
        }
        else {
            return false;
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

};

async function getUser(userEmail, userPassword) {
    try {
        await client.connect();
        let filter = {email: userEmail};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);
        
        let {email,password,movies} = result;
        return movies;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

};

async function displayMovies() {
    try {
        await client.connect();
        let filter = {email: currEmail};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);
        
        let {email,password,movies} = result;

        let str = "";
        movies.forEach(element => {
            if (element.Poster) {
                let curr = element.Poster;
                str += `<div class = "movie"><img src="${curr}" alt="unknown.png"></div>`

            }
            
        });
        return str;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
   

    

};



async function addMovie(userEmail, userPassword, movieTitle) {
    try {

        let movie = await getMovie(movieTitle);


        await client.connect();
        let filter = {email: userEmail};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .updateOne(filter, {$addToSet: {movies: movie}});

        
        return result;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

};

async function clearDatabase() {
    try {
        await client.connect();
        
        
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

};

async function foundMovie (movieTitle)  {

    let response = await fetch(`http://www.omdbapi.com/?apikey=${apiKey}&t=${movieTitle}`);
    if (response.ok) {
        let j = await response.json();
        return j.Response === "True";
    }    
    return response.ok;
}

async function getMovie (movieTitle) {
    let response = await fetch(`http://www.omdbapi.com/?apikey=${apiKey}&t=${movieTitle}`);
    return await response.json();
}


app.use(express.static(__dirname + '/public'));

app.get("/", (request, response) => { 
    variable = {text:""};
    response.render("index",variable);
});

app.post("/home", async (request, response)=> {
    let {email, password, login} = request.body;
    if (login === 'login') { 
        let canLogin = await validLogIn(email, password); 

        if (canLogin) {
            currEmail = email;
            currPassword = password;
            let str = await displayMovies();

            variable = {movies:str};

            response.render("home",variable);
        }
        else {
            variable = {text:"Invalid Credientials"};
    
            response.render("index", variable);
        }

    }
    else {
        let cannotSignUp = await existingEmail(email);
        if (cannotSignUp) {
            variable = {text:"User with that email exists"};
    
            response.render("index", variable);
        }
        else {
            currEmail = email;
            currPassword = password;
            user = {'email':email, 'password':password, movies:[]};
            await signUpUser(user);
            variable = {movies:""};

            response.render("home",variable);
        }
    }

});

app.post("/addMovie", async (request, response)=> {
    variable = {text:""};

    response.render("addMovie",variable);
    
});

app.post("/add", async (request, response)=> { 
    let {movieTitle} = request.body;
    if (foundMovie(movieTitle)) {
        await addMovie(currEmail,currPass,movieTitle);
        variable = {text:"Added movie"};


        response.render("addMovie",variable);

    }
    else {
        variable = {text:"Cound not find movie"};
        response.render("addMovie",variable);



    }

});

app.get("/home", async (request, response)=> {
    let str = await displayMovies();

    variable = {movies:str};

    response.render("home",variable);

});










app.listen(portNumber);
console.log(`Web server is running at http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.setEncoding("utf8");
process.stdin.on('readable', () => {
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
        let command = dataInput.trim();
		if (command === 'stop') {
			console.log("Shutting down the server");
            process.exit(0);
        } 
        else if (command === 'clear') {
            console.log("Clearing the database");
            clearDatabase();

        }

        else {
			console.log(`Invalid command: ${command}`);
		}
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});
