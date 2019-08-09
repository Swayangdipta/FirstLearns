const express = require('express');
const expressLayout = require('express-ejs-layouts');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const methodOverride = require('method-override');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const bodyParser = require('body-parser');
const keys = require('./config/keys');

const app = express();

const PORT = process.env.PORT || 5000;

//SEtting UseNewUrlParser globally
mongoose.set('useNewUrlParser', true);



//DB config
const conn = mongoose.createConnection(keys.MongoURI);

//Init Gridfs
let gfs;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//Storage Engine/Object

const storage = new GridFsStorage({
    url: keys.MongoURI,
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
        }).catch(err => console.log(err));
    }
});
const upload = multer({ storage });

//MiddleWares
app.use(bodyParser.json());
app.use(express.urlencoded());
app.use(express.json());
//app.use(multer({ dest: './uploads/' }));
app.use(methodOverride('_method'));
app.use(expressLayout);
app.set('view engine', 'ejs');

mongoose.set('useCreateIndexes', true)

//Routes
app.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        //Check If Files
        if (!files || files.length === 0) {
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
    });
});

//Route Get /files
//@desc display all files in json
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        //Check If Files
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: 'File Not Exists'
            });
        }

        //files exists
        return res.json(files);
    });
});

//Route get /files/:filename
//@desc find an specific file

app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'File Not Exists'
            });
        }
        //File Exists
        return res.json(file);
    });
});

//Route get /images/:filename
//@desc display single image
app.get('/images/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'File Not Exists'
            });
        }
        //check if image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            //Read Output To Browser
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not An Image'
            });
        }
    });
});

//Route DELETE files/:id
//@Desc Delete files

app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
        res.redirect('/');
    });
});

//POST /upload
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');

});

app.listen(PORT, () => console.log(`Server Started At Port ${PORT}...`));