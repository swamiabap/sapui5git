module.exports = function ({
    resources,
    options
}) {
    const express = require("express");
    return express.static("../pdfjs");
}
