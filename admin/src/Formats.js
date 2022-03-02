export function formatDate(date) {
    if (date) {
        return date.replace(/-/g, '/') // Replaces dashes with a slash for the date to work in modern browsers
    }
}

export function dateToServerFormat(date) {
    // TODO: check utc timezone handling
    if (date) {
        return date.getFullYear() + "-"
            + ("0" + (date.getMonth() + 1)).slice(-2) + "-"
            + ("0" + date.getDate()).slice(-2) + " "
            + ("0" + date.getHours()).slice(-2) + ":"
            + ("0" + date.getMinutes()).slice(-2) + ":"
            + ("0" + date.getSeconds()).slice(-2)
            + (date.getTimezoneOffset > 0 ? "-" : "+")
            + (("0" + (-date.getTimezoneOffset() / 60)).slice(-2))
    }
}

export function updateTimeToServerFormat(date) {
    // TODO: check utc timezone and milliseconds handling
    if (date) {
        return date.getFullYear() + "-"
            + ("0" + (date.getMonth() + 1)).slice(-2) + "-"
            + ("0" + date.getDate()).slice(-2) + " "
            + ("0" + date.getHours()).slice(-2) + ":"
            + ("0" + date.getMinutes()).slice(-2) + ":"
            + ("0" + date.getSeconds()).slice(-2) + "."
            + date.getMilliseconds()
            + (date.getTimezoneOffset > 0 ? "-" : "+")
            + (("0" + (-date.getTimezoneOffset() / 60)).slice(-2))
    }
}

export function shadeColor(color, percent) {

    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    let RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}