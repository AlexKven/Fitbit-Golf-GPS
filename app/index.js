import { geolocation } from "geolocation";
import document from "document";
import * as messaging from "messaging"; // for getting de ajax call results from the companion js.
import { readFileSync } from 'fs';
import { inbox } from "file-transfer"

//DEVELOPER OPTIONS
var debug = false;
var simulator = false;

var phoneConnectionOpen = false;
var gpsFix = false;
var position = {coords:{
    latitude:52.073490, 
    longitude:4.325720,
    heading: 69.9999,
    speed:9.56789
  },
  timestamp:12345567788
};

var buttonUp = function(){if(debug)console.log("button Up Press")};
var buttonBack = function(){if(debug)console.log("button Back Press")};
var buttonDown = function(){if(debug)console.log("button Down Press")};
document.onkeypress = function(e) {
  //if(debug)console.log("Key pressed: " + e.key);
  if(e.key=="up") buttonUp();
  if(e.key=="down") buttonDown();
  if(e.key=="back") buttonBack();
}
showScreen("home-screen");



//list of items used for hole rendering


////////Course menu///////////
///////////////////////////////
var coursesFound = [];
var courseResultNum = 0;
var courseSelected = 0;


var counter = 0;
var holeNum = 1;
var hole = {};
let course = JSON.parse('{"holeCount":"9","updateRevision":"0","holes":{"1":{"items":[{"type":"green","front":{"lat":"52.0724144","lon":"4.3261995"},"back":{"lat":"52.0723190","lon":"4.3262105"},"middle":{"lat":"52.0723610","lon":"4.3262067"}},{"type":"bunker","front":{"lat":"52.0730972","lon":"4.3261733"},"back":{"lat":"52.0730705","lon":"4.3261695"}},{"type":"water","back":{"lat":"52.0729218","lon":"4.3261905"},"front":{"lat":"52.0729485","lon":"4.3261895"}},{"type":"dogleg","middle":{"lat":"52.0727043","lon":"4.3261089"}}]},"2":{"items":[{"type":"green","front":{"lat":"52.0728836","lon":"4.3249068"},"middle":{"lat":"52.0729065","lon":"4.3248491"},"back":{"lat":"52.0729332","lon":"4.3248158"}}]}}}');
                        
var GPSoptions = {
  enableHighAccuracy: true,
  maximumAge: 2000
};

//geolocation.getCurrentPosition(locationSuccess,locationError,{maximumAge:Infinity,enableHighAccuracy:false})
geolocation.watchPosition(locationSuccess, locationError, GPSoptions);



function locationSuccess(pos){
  if(!gpsFix){
   document.getElementById("GPSFix").text = "GPS FIX acquired";
    document.getElementById("GPSFix").style.fill = "green";
    gpsFix = true;
    if(debug)console.log("GPS fix "+pos.coords.latitude+","+pos.coords.longitude);
  }
   
  position = pos;
  updateDistances();
}

function locationError(error) {
  counter++;
  
  latlonData.text = "GPS not found "+counter;
  if(debug)console.log("GPS not found");
  if(debug)console.log(`Error: ${error.code}\nMessage: ${error.message}`);
  setTimeout(getPosition, Math.floor(Math.random() * 500) + 5750);
}

function showScreen(page){
  var screens = document.getElementsByClassName("screen");
  screens.forEach(function(screen) {
    screen.style.display = "none";
  });
  
 let newPage = document.getElementById(page);
  newPage.style.display = "inline";
  
 if(debug)console.log("screen "+page+ " shown");
}

document.getElementById("search-courses-button").onclick = function(evt) {
  
  sendCommand("getCoursesList",{lat:position.coords.latitude,lon:position.coords.longitude});
  document.getElementById('#searchingCourses').text = "Searching for courses";
}


///////COURS MENU////
function sendCommand(command,data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
     if(debug)console.log("Send command:"+command+" data:"+JSON.stringify(data));
    messaging.peerSocket.send({
      command: command,
      data:data
    });
  }else{
    if(debug)console.log("Peer socket not open");
  }
}

function getCourse(courseId){
  if(debug)console.log("Request "+courseId);
}





// Display the weather data received from the companion

function processCourseList(data) {
  for (var i = 0; i < data.length; i++) {
    //{"name":"Delfland Par 3 baan","holeCount":9,"course_id":47902,"distance":2.8}
    //conle.log(data[i]["name"]); //course name
    //Do something
    var tile = document.getElementById('tile-'+i);
    tile.style.display = "inline";
    tile.getElementById('course-tile-name').text = data[i]["name"];
    tile.getElementById('distance').text = data[i]["distance"]+"km";
    
    var courseId = data[i]["course_id"];
    tile.getElementById("mybutton").addEventListener('click', function(courseId){
      return function(){
        if(debug)console.log("Course button clicked "+courseId);
      sendCommand("getCourseDetails",{course_id:courseId});
      };
      
    }(courseId));
  }
  showScreen("courses-screen");
}

function processCourseDetails(){
  showScreen("hole-screen");
 
  buttonUp = function(){
    holeNum--;
    if(holeNum==0)holeNum=course.holeCount;
    showHole();
  }
  buttonDown = function(){
    holeNum++;
    if(holeNum>course.holeCount)holeNum=1;
    showHole();
  }
 showHole();
  
};

var objectList = document.getElementsByClassName("object");
function showHole(){
  hole = course.holes[holeNum.toString()];
  if(!hole)return;
  //if(debug)console.log("show hole "+holeNum+ "items: "+hole.items.length);
  document.getElementById('holeNumber').text = "#"+holeNum;
  
  for (var i = 0; i < objectList.length; i++) {
    
    var holeItem = hole.items[i];
    
    
    if (!holeItem){
      objectList[i].style.display = "none";
      continue;
    } else objectList[i].style.display = "inline";
   //if(debug)console.log(holeNum+' '+holeItem.type);
    
   holeItem.object = objectList[i];
    
    var objectBackground = "white";
    var objectHeight = "200";
    if(holeItem.type == "green"){
      objectBackground = "green";
      objectHeight = 220;
    } else if(holeItem.type == "bunker"){
       objectBackground = "yellow";
      objectHeight = 150;
    } else if(holeItem.type == "water"){
      objectBackground = "blue";
      objectHeight = 150;
    } else if(holeItem.type == "dogleg"){
      objectBackground = "white";
      objectHeight = 80;
    } 
    objectList[i].getElementById('objectBackground').style.fill = objectBackground;
    objectList[i].height = objectHeight;

    //greens have 3 points, bunker & water 2, en doglegs one
    objectList[i].getElementById('distance-1').style.display = "inline";
    objectList[i].getElementById('distance-2').style.display = "inline";
    objectList[i].getElementById('distance-3').style.display = "inline";
    
   if (holeItem.front && !holeItem.middle && holeItem.back){//bunker and water
      objectList[i].getElementById('distance-3').style.display = "none";
    }else if (!holeItem.front && holeItem.middle && !holeItem.back){ //dogleg
      objectList[i].getElementById('distance-2').style.display = "none";
      objectList[i].getElementById('distance-3').style.display = "none";
    }
      
  
  }//for loop 
  updateDistances();
 }//function
  
function updateDistances(){
  if(debug)console.log("Update distances "+position.coords.latitude);
  if(typeof hole.items === "undefined")return;
   for (var i =0; i < hole.items.length; i++){;
     var holeItem = hole.items[i];
      if(holeItem.front && holeItem.middle && holeItem.back){//green
      holeItem.object.getElementById('distance-1').text = distance(holeItem.front)+'m';
      holeItem.object.getElementById('distance-2').text = distance(holeItem.middle)+'m';
      holeItem.object.getElementById('distance-3').text = distance(holeItem.back)+'m';
    }else if (holeItem.front && !holeItem.middle && holeItem.back){//bunker and water
       holeItem.object.getElementById('distance-1').text = distance(holeItem.front)+'m';
      holeItem.object.getElementById('distance-2').text = distance(holeItem.back)+'m';
      holeItem.object.getElementById('distance-3').style.display = "none";
    }else if (!holeItem.front && holeItem.middle && !holeItem.back){ //dogleg
       holeItem.object.getElementById('distance-1').text = distance(holeItem.middle)+'m';
      holeItem.object.getElementById('distance-2').style.display = "none";
      holeItem.object.getElementById('distance-3').style.display = "none";
    }
  }//for loop
}


// SETTING UP THE CONNECTION


var phoneConnectionCheck = setInterval(function() {
  if(!phoneConnectionOpen && messaging.peerSocket.readyState == messaging.peerSocket.OPEN){
    if(debug)console.log("connection open");

    clearInterval(phoneConnectionCheck);
    sendCommand("getCourseDetails",{course_id:24456});
  }
}, 5000);//interval

  // Listen for the onopen event
  messaging.peerSocket.onopen = function() {
    // Fetch x when the connection opens
    if(debug)console.log("Connection socket open");
    document.getElementById("phoneConnection").text = "Phone Connection OK";
    document.getElementById("phoneConnection").style.fill = "green";
    phoneConnectionOpen = true;
    if(gpsFix && phoneConnectionOpen)sendCommand("getCoursesList",{lat:position.coords.latitude,lon:position.coords.longitude});
  }

    // Listen for messages from the companion
  messaging.peerSocket.onmessage = function(evt) {
    if (evt.data) {
      if(debug)console.log("received data: "+evt.data.message);
      if(evt.message =  "courseList")processCourseList(evt.data.data);
      else  if (evt.message =  "courseDetails")processCourseDetails(evt.data.data);

    }
  }

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  if(debug)console.log("Connection error: " + err.code + " - " + err.message);
}


// Event occurs when new file(s) are received
inbox.onnewfile = function () {
  var fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName) {
      
      if(debug)console.log("/private/data/" + fileName + " is now available");
      //let data = readFileSync(fileName);
      course = readFileSync(fileName, 'cbor');
      
      processCourseDetails(course);
      
    }
  } while (fileName);
};

/////FUNCTIONS//////
//////////////////////
function distance(target) {
	var lat1=target.lat;
	var lon1=target.lon;
	var lat2=position.coords.latitude;
	var lon2=position.coords.longitude;
	
  var R = 6371000; // Radius of the earth in meters
  var dLat = (lat2-lat1)*0.01745329251;  // deg2rad below
  var dLon = (lon2-lon1)*0.01745329251; 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((lat1)*0.01745329251) * Math.cos((lat2)*0.01745329251) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
	//if('units' in options&&options.units==="yards")d *= 1.0936133;
	if(d>=1000)return 999;
  else return Math.round(d);
}