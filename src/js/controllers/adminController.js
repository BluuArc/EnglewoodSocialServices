"use strict";

let file, filename;
let input = document.getElementById("exampleInputFile");

getLogFile()
  .then(function (data) {
    console.debug(data);

    var logText = data.split(/\n/);

    for (var i = logText.length - 1 ; i > -1; i--) {
      var entry = logText[i].split(',');
      var rows = "";
      entry[2] = entry[2].replace(/\s/g, "");
      console.debug(JSON.stringify(entry[2]));
      // console.debug("equals false?",entry[2].toString() == 'false');
      var r= $('<input type="button" value="new button"/>');

      if(entry[2] == 'false'){
        rows += "<tr><td>" + new Date(+entry[0]).toUTCString() + "</td><td>" + entry[1] + "</td><td>" + '<input type="button" class="restoreButton" value="Restore" id="button_' + i + '"/>' +"</td></tr>";
      }
      else
        rows += "<tr><td>" + new Date(+entry[0]).toUTCString() + "</td><td>" + entry[1] + "</td><td>" + "Current version" +"</td></tr>";

      $(rows).appendTo("#list tbody");
      d3.select('#button_' + i)
          .datum({
            "time": entry[0],
            "name": entry[1]
          })
          .on('click', restoreFile);


      
    }

  });


d3.select("#exampleInputFile")
  .on('change', function () {
    var testing = document.getElementById("exampleInputFile").value;

    if (testing.length !== 0) {
      console.info("File selected!");
      document.getElementById("submitButton").disabled = false;
    } else {
      console.warn("No file!");
      document.getElementById("submitButton").disabled = true;
    }
  });

d3.select("#submitButton")
  .on("click", clickedButton);

d3.select("#confirmButton")
  .on("click", confirmClicked);

function clickedButton() {
  d3.event.preventDefault();
  if (!input) {
    alert("Um, couldn't find the file element.");
  } else if (!input.files) {
    alert("This browser doesn't seem to support the `files` property of file inputs.");
  } else if (!input.files[0]) {
    alert("Please select a file before clicking 'Load'");
  } else {
    file = input.files[0];
    filename = file.name;

    document.getElementById("fileName").innerHTML = filename;
  }
}

function confirmClicked() {
  if (typeof window.FileReader !== 'function') {
    alert("The file API isn't supported on this browser yet.");
    return;
  }


  let fr;

  fr = new FileReader();
  fr.onload = sendCSV;
  fr.readAsText(file);
  alert("The file has been updated!");
}

function getLogFile() {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();

    xhr.onload = function () {
      resolve(this.responseText);
    };
    xhr.onerror = function (e) {
      reject(e);
    };

    xhr.open("GET", "/admin/getlog");
    xhr.send();
  });
}

function sendCSV(e) {
  let xhr = new XMLHttpRequest();
  xhr.open("PUT", "/admin/savenew");
  xhr.setRequestHeader("Content-type", "application/json");

  console.debug(e);

  xhr.onload = function () {
    // LOG file received in this.responseText -- populate log 
    console.debug(this.responseText);
    location.reload();
  };
  xhr.onerror = function (e) {
    reject(e);
  };

  xhr.send(JSON.stringify({
    "data": e.target.result,
    "name": filename
  }));
}

function restoreFile(d){
  console.log("WE IN");
  let xhr = new XMLHttpRequest();
  xhr.open("PUT", "/admin/chooseold");
  xhr.setRequestHeader("Content-type", "application/json");

  xhr.onload = function () {
    // LOG file received in this.responseText -- populate log
    console.log(this.responseText);
    location.reload();
  };
  xhr.onerror = function (e) {
    reject(e);
  };

  xhr.send(JSON.stringify(d));
}
