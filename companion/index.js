// Import the messaging module
import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { me } from "companion";
import { encode } from 'cbor';
import { outbox } from 'file-transfer';

console.log("Companion starting! LaunchReasons: " + JSON.stringify(me.launchReasons));

var url = "https://fitbitgolf.com/apiv3.php?"; 
//var url = "https://lukes611.com/ping" ;
//var json = '[{"name":"Delfland Par 3 baan","holeCount":"9","course_id":"47902","distance":"2.8"}]';

// Fetch the weather from OpenWeather
function getCourses(lat,lon) {
  console.log("url:"+url+"lat="+lat+"&lon="+lon);
  fetch(url+"lat="+lat+"&lon="+lon,{method: "GET"}).then(res => res.json()).then(courses => { 
    returnData("courseList",courses);
  }).catch(e => console.log(e));
};

function getCourseDetails(course_id){
  console.log(url+"course_id="+course_id);
   fetch(url+"course_id="+course_id,{method: "GET"}).then(res => res.json()).then(courseDetails => { 
     //returnData("courseDetails",courseDetails); this is too large
     const myFileInfo = encode(courseDetails);
    outbox.enqueue('course.txt', myFileInfo)
  }).catch(e => console.log(e));
  
}

// Send the course data to the device
function returnData(command,data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    messaging.peerSocket.send({command:command, data: data});
  } else {
    console.log("Error: Connection is not open");
 
  }
}

// Helpful to check whether we are connected or not.
var connectionInterval = setInterval(function() {
  if(messaging.peerSocket.readyState == messaging.peerSocket.OPEN){
    clearInterval(connectionInterval);
    console.log("Companion: Connected");
  }
}, 3000);

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  console.log("Received command "+evt.data.command+" "+JSON.stringify(evt.data.data));
  if (evt.data && evt.data.command == "getCoursesList") {
    // The device requested course data
    getCourses(evt.data.data.lat,evt.data.data.lon);
  }
  if (evt.data && evt.data.command == "getCourseDetails") {
    // The device requested course data
    getCourseDetails(evt.data.data.course_id);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}
