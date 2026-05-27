const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Welcome to DevOps CI/CD Project');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP'
    });
});

app.listen(3000, () => {
    console.log('Application running on Port 3000');
});