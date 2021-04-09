require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const { json } = require('body-parser');
const e = require('express');
const app = express();


//middleware

app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(bodyParser.json({ extended: false, limit: '150mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '150mb' }));


//Mongo URI
const mongoURI = process.env.MONGODB_URI;
// const mongoURI = 'mongodb+srv://dbUser:dbUser1234@garicluster.67keb.mongodb.net/NewFileUploads?retryWrites=true&w=majority';
// const mongoURI = 'mongodb://localhost:27017/FileUploads_DB';


// heroku config:set MONGODB_URI="mongodb+srv://dbUser:dbUser1234@garicluster.67keb.mongodb.net/NewFileUploads?retryWrites=true&w=majority"

//Mongo Connection
const conn = mongoose.createConnection(mongoURI);
conn.once('open', () => console.log('MongoDB is Connected!'));
conn.on('error', (e) => console.log(e));


//GFS Init
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//Create a Storage Engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

//@Route GET,
//@desc Loads Form
app.get('/', (req, res) => {
    // gfs.files.find().toArray((err, files) => {
    /*  if (!files || files.length === 0) {
            res.render('index', { files: false });

        } else {
            files.map(file => {
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                    file.isImage = true;
                } else {
                    file.isImage = false;
                }
            });
            res.render('index', { files: files });
        }
    })
    res.render('index');
    */

    res.send("Server is connected! Success.");
});

//@route GET/files
//@desc Display all files in JSON
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        //CHECK IF FILES EXIST
        if (!files || files.length == 0) {
            return res.sendStatus(404).json({
                err: 'No files exist!'
            });
        }

        //FILES EXIST
        res.send(files);

    });


});

//@route GET/file
//@desc Display single file in JSON
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //CHECK IF FILES EXIST
        if (!file || file.length == 0) {
            return res.sendStatus(404).json({
                err: 'No file exists !'
            });
        }

        //FILES EXIST
        res.send(file);
        // res.download(file);
    });
});


//@route GET/image
//@desc Display single image
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        //CHECK IF FILES EXIST
        if (!file || file.length == 0) {
            return res.status(404).json({
                err: 'No file exists !'
            });
        }

        //CHECK IF IMAGE EXISTs
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            //READ OUTPUT TO BROWSER
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an Image!'
            });
        }
    });
});



//@route POST,
//desc Uploads file to Database

app.post('/upload', upload.single('file'), (req, res) => {

    //FIRST CHECK IF ALL REQUEST PARAMETERS ARE VALID

    //CHECK TO SEE IF FILE IS AN IMAGE
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        res.send({
            file: `${process.env.BASE_URL}image/${req.file.filename}`,
            filename: `${req.file.originalname}`,
            Message: 'Successfully Uploaded File!',
            status: 'Success!!',
            filetype: `${file.contentType}`

        });


    }

    // ELSE UPLOAD A FILE
    else if (file.contentType !== 'image/jpeg' || file.contentType !== 'image/png') {

        res.send({
            file: `${process.env.BASE_URL}files/${req.file.filename}`,
            filename: `${req.file.originalname}`,
            Message: 'Successfully Uploaded File!',
            status: 'Success!!',
            filetype: `${file.contentType}`

        });

    } else {

        return res.sendStatus(500).json({
            err: 'Check that required fields are spcified',
            required: 'KEY:file(file type: file), VALUE:select files'
        });

    }
    //res.sendStatus(200);


    res.download(req.file);

    // res.sendStatus(200);
    //res.send("POST is working!");
    //json({ file: req.file });
    // console.log(res.file);
});


const port = process.env.PORT || 80;
if (port == null || port == "") {
    port = 5008;
}
app.listen(port, () => console.log(`Server is listening on port ${port}...`));