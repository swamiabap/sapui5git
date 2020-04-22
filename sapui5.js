const express = require('express');
const app = express();
const PORT = 8006;

app.use("/resources", express.static("../sapui5-rt-1.56.7/resources"));

app.get("/", (req, res) => {
    res.send(`a get request with / route on port ${PORT}`);
});

app.listen(PORT, () => {
    console.log(`SAPUI5 server started on http://localhost:${PORT}`);
});
