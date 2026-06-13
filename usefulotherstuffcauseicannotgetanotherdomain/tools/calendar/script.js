let currentday = 0;
let currentmonth = 0;

function resettocheckday() {
    currentday = today.getDate();
    currentmonth = Date.getMonth();
    console.log(`today is ${currentday} on the month of ${currentmonth}`);
}