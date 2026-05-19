import app from './src/api.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () =>{
    console.log("Servidor rodando na porta " + PORT);
});