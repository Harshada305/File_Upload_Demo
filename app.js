// app.js
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // save uploaded files to uploads folder
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // generate unique filename
    }
});
const upload = multer({ storage });

// MongoDB connection setup
mongoose.connect('mongodb://localhost:27017/mydb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'MongoDB connection error:'));
conn.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define a schema for storing file metadata in MongoDB
const fileSchema = new mongoose.Schema({
    filename: String,
    path: String,
    originalname: String,
    mimetype: String,
    size: Number
});
const File = mongoose.model('File', fileSchema);

// Serve static files (for UI)
app.use(express.static('public'));

// Route to serve HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Create a new entry in MongoDB for the uploaded file
        const newFile = new File({
            filename: req.file.filename,
            path: req.file.path,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        
        // Save file metadata to MongoDB
        await newFile.save();
        
        console.log('File uploaded and saved to MongoDB');
        res.send('File uploaded successfully');
    } catch (err) {
        console.error('Error uploading file to MongoDB:', err);
        res.status(500).send('Error uploading file');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
