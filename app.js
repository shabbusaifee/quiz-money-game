const express = require('express');
const app = express();
const HOSTNAME = '0.0.0.0';
const PORT = 3000;



app.listen(PORT, HOSTNAME, ()=>console.log(`App running on http://localhost:${PORT}`))