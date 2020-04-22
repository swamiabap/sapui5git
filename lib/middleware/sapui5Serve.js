module.exports = function ({
    resources,
    options
}) {
    const express = require("express");
    return express.static("../sapui5-rt-1.56.7/resources");
}
