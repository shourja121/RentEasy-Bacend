function sdateValid(startDate) {
    let today = new Date().toLocaleString();
    console.log(typeof (today), typeof (startDate));
    // console.log(today.toLocaleString());
    today = today.split(",")[0].split("/");
    let month = today[0];
    let date = today[1];
    let year = today[2];
    today[0] = year;
    today[1] = month;
    today[2] = date;
    if (today[1].length === 1)
        today[1] = '0' + today[1]
    if (today[2].length === 1)
        today[2] = '0' + today[2];
    today = today.join('-');
    if (today <= startDate)
        return true;
    return false;

}
function edateValid(startDate, endDate) {
    if (startDate > endDate)
        return false;
    return true;
}

module.exports = {
    sdateValid,
    edateValid
}