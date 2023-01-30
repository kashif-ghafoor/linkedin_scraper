"use strict";
function JSON2CSV(objArray) {
    var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
    var str = "";
    var line = "";
    if ($("#labels").is(":checked")) {
        var head = array[0];
        if ($("#quote").is(":checked")) {
            for (var index in array[0]) {
                var value = index + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
        }
        else {
            for (var index in array[0]) {
                line += index + ",";
            }
        }
        line = line.slice(0, -1);
        str += line + "\r\n";
    }
    for (var i = 0; i < array.length; i++) {
        var line = "";
        if ($("#quote").is(":checked")) {
            for (var index in array[i]) {
                var value = array[i][index] + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
        }
        else {
            for (var index in array[i]) {
                line += array[i][index] + ",";
            }
        }
        line = line.slice(0, -1);
        str += line + "\r\n";
    }
    return str;
}
