// Module selveRFgw   Selve RF usb Gateway
// By JW Teunisse on 23-05-2024, edited 9-2-2025
// Version 1.0.2
// code usage under github MIT license
// Selve Gateway XML send en receive message functions are coded in this source file as an example.
//
// this javascript file is used for developing and testing Selve USB RF Gateway on Windows 11 PC/laptop
// 
//
// test serial ports https://itp.nyu.edu/physcomp/labs/labs-serial-communication/lab-serial-communication-with-node-js/
// 
// In order to get things done in the USB RF gateway  we have to send XML command messages to the USB COM port with a <methodCall>.
// The RF Gateway sends two type of messages to the USB COM port:
// 1) the answer on a sent <methodCall> with a <methodResponse>
// 2) the Gateway sends an internal command also to the USB COM port with a <methodCall>. The code who interprets the received data line, checks
//    if it is either a methodCall or a methodresponse.
// The function HandleIncomingSGWMessage(pData) deals with the incoming XML messages.
// The function SendMessage2SGW puts the XML message to be send in the Queue array SGW_SQ. 
// The other functions which start with SendSWG... compose the relevant XML messages with a <methodCall>, and call SendMessage2SGW function. 

const sleep = require('system-sleep');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { XMLParser } = require("fast-xml-parser");
const parseOptions = {
    ignoreAttributes: false,
    // attributeNamePrefix : "@_",
    allowBooleanAttributes: true
};
// const base64 = require("base-64") ;  // not used: these functions are now in tsandard javascript available
// const BitSet = require("bitset") ;   // not used
const xmlParser = new XMLParser(parseOptions);
const sgw = require('./selverfgw');   // the udf for Selve usb RF Gateway
// constants for Selve RF-Gateway
const EXEDIR = "D:\\AutoDomus\\exes\\" ;
const SGWSCREENTABLE_FILENAME = EXEDIR + 'sgwscreenstable.json' ;
const COM_PortSGW = "\\\\.\\COM3";  // adapted for usage of a Selve USB on a Windows11 notebook COM port
const SGW_CMD_STOP = 0 ;
const SGW_CMD_UP = 1 ;
const SGW_CMD_DOWN = 2 ;
const SGW_CMD_POS  = 7 ;
const SGW_CMD_POS1 = 3 ;
const SGW_CMD_POS2 = 5 ;
const SGW_CMD_SAVEPOS1 = 4 ; // only for setup
const SGW_CMD_SAVEPOS2 = 6 ;
const SGW_CMD_TYPE_FORCED = "0" ;
const SGW_CMD_TYPE_MANUAL = "1" ;  // inserted in a cmd string
const SGW_CMD_TYPE_TIME = "2" ;
const SGW_CMD_TYPE_GLASS = "3" ;



function ShowPortSGWOpen() {
  console.log(' Serial port '+COM_PortSGW+' open. Data rate: ' + serialPortSGW.baudRate);
  SGW_PortIsOpen = true ;
  //  sleep(100) ;  // wait een 0,1 seconde
  // the ping request and getState etc. are placed after the opening of the SGW USB Port
  console.log(" waiting for Selve commands to send.");
} // End of ShowPortSGWOpen

function ShowPortSGWClose() {
   console.log(' Serial port '+COM_PortSGW+' closed.');
}

// handling SQ functions
// isSQEmpty()  - boolean indien array leeg is
// isSQFilled() - boolean indien array gevuld
// SQAdd(msgType, xml string cmdMsg) - returns idx
// SQPeek()  - returns value [msgType, xml string cmdmsg]
// SQFront() - returns value [msgType, cmdmsg] and delete the row in the array
// SQSize()  - returns the size or number of elements
function isSGWSQEmpty() {
  let lResult = false ;
  if (SGW_SQ.length == 0) {
	  lResult = true ;
  }
  return lResult ;
}	
function isSGWSQFilled() {
  let lResult = false ;
  if (SGW_SQ.length > 0) {
	  lResult = true ;
  }
  return lResult ;
}
function SGWSQAdd(pMsg, pXMLMsg) {
  let lIdx = 0;
  SGW_SQ.push([pMsg,pXMLMsg]) ;
  lIdx = SGW_SQ.length - 1 ;
  return lIdx;
}
function SGWSQPeek() {
  return SGW_SQ[0] ;
}
function SGWSQFront() {
  //let lSQrow = SQ[0] ;
  return SGW_SQ.shift() ;
}
function SGWSQSize() {
  return SGW_SQ.length ;
}


function SendMessage2SGW(pCmdMsgType, pMsg) {  // msg is a XML string type
  if (pMsg.length > 0) {
    console.log("   Start "+cmdMsgType+" message, adding to the SGW SQ queue..") ;
    SGWSQAdd(pCmdMsgType, pMsg) ; // add in queue SQ
    //  console.log(SQ) ; // for testing
  } 
  if (serialPortSGW.isOpen == true) {
     // todo implementing queuing part if necessary
    let SQRow = SGWSQFront() ; // get the first message in the queue
    let qcmdMsgType = SQRow[0] ;
    let qMsg = SQRow[1] ;
    console.log("   sending "+qcmdMsgType) ;
    console.log("     msg: "+qMsg) ;
    serialPortSGW.write(qMsg+'\r\n');   // add \r\n as an EndOfrecord
    // if (debugLog) { DebugToFile(DEBUGFILENAME, 'S', qcmdMsgType+' '+qMsg) ; }
    console.log("   Selve XML message is send.") ;
  } else {
    SGW_PortIsOpen = false ;
    console.log("  SGW COM port is not open..") ;
  }	
} // sendMessage2SGW

function SendSGWServiceMessage(pName) {  // compose a service message with the methodName
  cmdMsgType = "service"+pName ;
  let SGW_Msg = "<methodCall><methodName>selve.GW.service." + pName + "</methodName></methodCall>";
  SendMessage2SGW(cmdMsgType, SGW_Msg) ;  // , false) ;
  console.log("  End of Send ServiceMessage:"+pName) ;
  // to-do actions ....
} // SendSGWServiceMessage

function SendSGWDeviceMessage(pName) {  // compose device message with the methodName
  cmdMsgType = "device"+pName ;
  let SGW_Msg = "<methodCall><methodName>selve.GW.device." + pName + "</methodName></methodCall>";
  SendMessage2SGW(cmdMsgType, SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWDeviceMessage

function SendSGWGetDeviceValues(pDeviceId) {  // get Values from a device, request update
  cmdMsgType = "devicegetvalues" ;
  let SGW_Msg = "<methodCall><methodName>selve.GW.device.getValues</methodName><array><int>"+pDeviceId+"</int></array></methodCall>";
  SendMessage2SGW(cmdMsgType,SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWGetDeviceValues

function SendSGWCommandDevice(pDeviceId, pCMD, pValToSend) {  // activate a screen device
  let valToSend = "0";
  let intCMD = 0 ;
  switch (pCMD) {
    case "down":
      intCMD = SGW_CMD_DOWN ; 
      break;
    case "stop":
      intCMD = SGW_CMD_STOP ; 
      break;
    case "up":
      intCMD = SGW_CMD_UP ; 
      break;
    case "drvpos1":
      intCMD = SGW_CMD_POS1 ; 
      break;
    case "drvpos2":
      intCMD = SGW_CMD_POS2 ; 
      break;
    case "targetpos":
      intCMD = SGW_CMD_POS ;
      valToSend = pValToSend ;
      break ;
//  case "setup": not implemented yet
    default:
      console.log("  Unknown CMD value ("+pCMD+") given, device commando will be not executed.") ;
      return ;  // ending abrupt this function
      break ;
  }
  cmdMsgType = "commanddevice" ;
  // <methodCall><methodName>selve.GW.command.device</methodName><array><int>4</int><int>1</int><int>1</int><int>0</int></array></methodCall>
  let SGW_Msg = "<methodCall><methodName>selve.GW.command.device</methodName><array><int>"+pDeviceId+"</int><int>"+intCMD.toString()+"</int>" ;
  SGW_Msg += "<int>"+SGW_CMD_TYPE_MANUAL+"</int><int>0</int></array></methodCall>";
  console.log(" cmd "+SGW_Msg) ;
  SendMessage2SGW(cmdMsgType,SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWCommandDevice

function SendSGWCommandGroup(pGroupId, pCMD, pValToSend) {  //activate a group of screen devices
  let valToSend = "0";
  let intCMD = 0 ;
  switch (pCMD) {
    case "down":
      intCMD = SGW_CMD_DOWN ; 
      break;
    case "stop":
      intCMD = SGW_CMD_STOP ; 
      break;
    case "up":
      intCMD = SGW_CMD_UP ; 
      break;
    case "drvpos1":
      intCMD = SGW_CMD_POS1 ; 
      break;
    case "drvpos2":
      intCMD = SGW_CMD_POS2 ; 
      break;
    case "targetpos":
      intCMD = SGW_CMD_POS ;
      valToSend = pValToSend ;
      break ;
//  case "setup": not implemented yet
    default:
      console.log("  Unknown CMD value ("+pCMD+") given, group commando will not be executed.") ;
      return ;  // abrupt ending of this function
      break ;
  }
  cmdMsgType = "commandgroup" ;
  let SGW_Msg = "<methodCall><methodName>selve.GW.command.group</methodName><array><int>"+pGroupId+"</int><int>"+intCMD.toString()+"</int>" ;
  SGW_Msg += "<int>"+SGW_CMD_TYPE_MANUAL+"</int><int>0</int></array></methodCall>";
  SendMessage2SGW(cmdMsgType,SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWCommandGroup

//  For a group of screen devices - 
function SendSGWCommandGroupMan(pGroupList, pCMD, pValToSend) {  // cmd a group of screens as a list, is like nr1;n2;n3;
  let valToSend = "0";
  let intCMD = 0 ;
  cmdMsgType = "commandgroupman" ;
  switch (pCMD) {
    case "down":
      intCMD = SGW_CMD_DOWN ; 
      break;
    case "stop":
      intCMD = SGW_CMD_STOP ; 
      break;
    case "up":
      intCMD = SGW_CMD_UP ; 
      break;
    case "drvpos1":
      intCMD = SGW_CMD_POS1 ; 
      break;
    case "drvpos2":
      intCMD = SGW_CMD_POS2 ; 
      break;
    case "targetpos":
      intCMD = SGW_CMD_POS ;
      valToSend = pValToSend ;
      break ;
//  case "setup": not implemented yet
    default:
      console.log("  Unknown CMD value ("+pCMD+") given, groupMan commando will not be executed.") ;
      return ;  // abrupt ending of this function
      break ;
  }
  // make a base64 multiple screens mask
  let lMaske = sgw.makeGroupMask(pGroupList) ;
  cmdMsgType = "commandgroupman" ;
  let SGW_Msg = "<methodCall><methodName>selve.GW.command.groupMan</methodName><array></int><int>"+intCMD.toString()+"</int>" ;
  SGW_Msg += "<int>"+SGW_CMD_TYPE_MANUAL+"</int><base64>"+lMaske+"</base64><int>"+valToSend+"</int></array></methodCall>";
  console.log(" command.roupman: "+SGW_Msg) ;
  SendMessage2SGW(cmdMsgType, SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWCommandGroupMan

function SendSGWCommandGroupMask(pGroupMask, pCMD, pValToSend) {  // cmd a group of screens, list is base64 encoded pGroupMask;
  let valToSend = "0";
  let intCMD = 0 ;
  cmdMsgType = "commandgroupman" ;
  switch (pCMD) {
    case "down":
      intCMD = SGW_CMD_DOWN ; 
      break;
    case "stop":
      intCMD = SGW_CMD_STOP ; 
      break;
    case "up":
      intCMD = SGW_CMD_UP ; 
      break;
    case "drvpos1":
      intCMD = SGW_CMD_POS1 ; 
      break;
    case "drvpos2":
      intCMD = SGW_CMD_POS2 ; 
      break;
    case "targetpos":
      intCMD = SGW_CMD_POS ;
      valToSend = pValToSend ;
      break ;
//  case "setup": not implemented yet
    default:
      console.log("  Unknown CMD value ("+pCMD+") given, groupMask commando will not be executed.") ;
      return ;  // abrupt endig of this function
      break ;
  }
  cmdMsgType = "commandgroupman" ;
  let SGW_Msg = "<methodCall><methodName>selve.GW.command.groupMan</methodName><array></int><int>"+intCMD.toString()+"</int>" ;
  SGW_Msg += "<int>"+SGW_CMD_TYPE_MANUAL+"</int><base64>"+pGroupMask+"</base64><int>"+valToSend+"</int></array></methodCall>";
  SendMessage2SGW(cmdMsgType, SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWCommandGroupMask

//  pLoad example <int>1</int> of <string>name</string>
//  is being used for a methodCall like service.setLed 
function SendSGWMessage(pName, pLoad) {  // compose a complete XML with methodName together with a pLoad
  cmdMsgType = pName ;
  let SGW_Msg = "<methodCall><methodName>selve.GW." + pName + "</methodName>";
  if (pLoad != "") {
     SGW_Msg = SGW_Msg + pLoad ;
  }
  SGW_Msg = SGW_Msg + "</methodCall>";
  SendMessage2SGW(cmdMsgType, SGW_Msg) ;  // , false) ;
  // to-do actions ....
} // SendSGWMessage


function HandleIncomingSGWMessage(pData) {  // handle pData, has a XML format
  let p = 0;
  let e = 0 ;
  let len = 0 ;
  let lMethodName = "" ;
  let lString = ""; 
  let lMsg = "" ;
  let lInt = 0 ;
  let lActorId = "" ;  // like (Screen) Id in the tblSGWScreens table
  let lActorStatus = "" ;
  console.log('  HandleIncMsg processing pData ....') ; // +pData) ; // for testing 
  p = pData.indexOf("<methodResponse>") ;    // check if it is a methodResponse
  if (p == -1) { // yes a methodCall
    console.log("  A methodCall received.") ;
  }
  lMethodName = sgw.getMethodName(pData) ;
  console.log("  MethodName: ", lMethodName);
  let lCSVData = sgw.convertXML2CSV(pData);
  let lCSVArray = lCSVData.split(";");
  console.log("  CSV response: "+lCSVArray) ;
/*  let lNodeHexId =  lMsgItems[3] ;
  let lDeviceId = "0" ;
  let lScreenName = 'unknown' ;  
  let lState = 'unknown' ;
 */
  let lJSONData = xmlParser.parse(pData);
 // let lOraDatumTijd = GetDatumTijd() ; //  get date-time andconvert to a Oracle date-time format
 // lOraDatumTijd = lOraDatumTijd.replace('T',' ') ; 
  switch(lMethodName) {
  case "command.device":    // send Up,Down, Stop deviceId
	lInt = lJSONData.methodResponse.array.int ;
    if (lInt == "0") {
      lMsg = lMethodName+" command can not be executed." ;
    } else {
      lMsg = lMethodName+" command will be executed." ;
    }
    console.log("  "+lMsg) ;   
    break;
  case "command.group":    // send group Stop deviceId
	lInt = lJSONData.methodResponse.array.int ;
    if (lInt == "0") {
      lMsg = lMethodName+" command can not be executed." ;
    } else {
      lMsg = lMethodName+" command will be executed." ;
    }
    console.log("  "+lMsg) ;   
    break;
  case "command.groupMan":    // send groups Stop deviceId
	lInt = lJSONData.methodResponse.array.int ;
    if (lInt == "0") {
      lMsg = lMethodName+" command can not be executed" ;
    }
    console.log("  "+lMsg) ;   
    break;
  case "command.result":    // send results previous action, parameters int Kommando , Type, Ergebnis 0=failed, 1=succes, base64 MaskSucces Maskfailed
	let lKommando = lCSVArray[0] ;
    let lTyp = lCSVArray[1] ;
    let lErgebnis = lCSVArray[2] ;
    let lb64MaskSuccess = lCSVArray[3] ;
    let lb64MaskFailed = lCSVArray[4] ;
    if (lErgebnis == "0") {
      lMsg = "command "+lKommando+" partly failed." ;
    } else {
      lMsg = "command "+lKommando+" is succesfull." ;
    }
    console.log("  SGW command.result: "+lMsg) ;   
    break;
  case "device.getIDs":   // getDeviceIDs
    // console.log('  getIDs message received '+lCSVData) ;
    let lBase64 = lCSVArray[1] ;  // 0 = methodName, 1 = base64 
    console.log('  getIDs base64 '+lBase64) ;
    let bArray = sgw.decodeBase64ToBoolArray(lBase64) ;
    NumOfDevices = 0 ;
    for (let i = 0; i < 64; i++) {
      if (bArray[i]) {
        NumOfDevices++ ;
      }
    }
    console.log("  Found a total Devices of ", NumOfDevices) ; 
    // console.log("  getIDs todo some programming.") ;
    break;

  case "device.getValues":   // getDeviceValues
    console.log('  getValues message received '+lCSVData) ;
    lActorId = lCSVArray[1] ;
    lInt = parseInt(lActorId) ;
    lActorStatus = lCSVArray[2] ;
    tblSGWScreens[lInt].state = lActorStatus ;
    let lActorValue = lCSVArray[3] ;
    let lActorTargetValue = lCSVArray[4] ;
    let lActorDayMode = lCSVArray[6] ;
    console.log('  getValues ActorDayMode: '+lActorDayMode) ;
    // todo JSON table updating
    break;
  case "service.ping":
    console.log('  Selve Gateway ping message received. '+lCSVData) ;
	break;
  case "service.getLED":
	lInt = lJSONData.methodResponse.array.int ;
	switch (lInt) {
	   case 0:	
		SGW_LEDStatus = "LED is off." ;
		break;
	   case 1:
        SGW_LEDStatus = "LED is on.";	   
	    break;
       default:
        SGW_LEDStatus = lInt + " unknown";
    }
	console.log('  getLED message received, LED status '+SGW_LEDStatus) ;
    // LogToFile(LOGFILENAME, '   SGW_LEDStatus '+SWG_LEDStatus);
  case "service.getState":
    SGW_IsReady = false ;
	lInt = lJSONData.methodResponse.array.int ;
	switch (lInt) {
	   case 0:	
		SGW_Status = "Bootloader" ;
		break;
	   case 1:
        SGW_Status = "Upload";	   
	    break;
	   case 2:
        SGW_Status = "Startup";
        break;
       case 3:
        SGW_Status = "Ready";
        SGW_IsReadt = true ;
        break;
       default:
        SGW_Status = lInt + " unknown";
    }
	console.log('  getState message received: '+SGW_Status) ;
    // LogToFile(LOGFILENAME, '   SGW_Status '+SWG_Status);
    break ;  
  case "service.getVersion":
    console.log('  getVersion message received '+lCSVData) ;
	SGW_serienr = lCSVArray[6];
    // LogToFile(LOGFILENAME, 'getVersion '+pData);
	console.log('  getVersion Serialnr '+SGW_serienr) ;
    break ;  
  case "fault":
    console.log('  fault message received '+pData) ;
    // LogToFile(LOGFILENAME, 'Handle Incoming Message falty message sent '+pData);
    break ;
  default:
     console.log('  handle incmsg SGW default pData='+pData) ; // for testing
     // LogToFile(LOGFILENAME, 'Handle Incoming RFL Message case default '+pData);
     // ?todo coding
  } // end of switch SGW MsgType
  return ;  
}  // end of HandleIncomingSGWMessage  


// var currentDir = __dirname;
var tblSGWScreens = require(SGWSCREENTABLE_FILENAME) ;  // importing the Selve GateWay Screens table
var datestamp = "";
var dataDir = "data";
// var datumTijd = GetDatumTijd() ;
// var oraDateTime = datumTijd.replace('T', ' ');  
var cmdMsgType = "unknown" ;
var XMLData = "" ;           // is the received XMl data from the Selve USB Gateway
var XMLMsgReady = false ;     // is true the XML message is ready to execute
var SGW_LEDStatus = "unknown";
var SGW_Status = "notready"; // defines the status of the Selve Gateway
var SGW_IsReady = false ;    // if true you can send new commands
var SGW_PortIsOpen = false ; // by startup port is not open.
var SGW_serienr = "unknown";
var strSGWGroupScreens = "[{" ;  // start array
var SGW_SQ = new Array() ;  // array SGW_SQ = SendQueu: [msgType, cmdMsg] like ['screen Up', XMLstring SGWcmdMsg]
var NumOfDevices = 0 ;      // number of Selve devices

//----- start main part of the script ------------------------------------------
console.log("Initiating the Selve Gateway configuration:") ;
// console.log(tblSGWScreens);
// testing function sgw.convertGroupList22GatewayIDs
let groupList = "1;2;3;4;7;10;0"  ;
let gatewayIds = sgw.convertGroupList2GatewayIDs(tblSGWScreens, groupList) ;
console.log("groupList: " + groupList) ;
console.log("groupGWId: " + gatewayIds) ;
 process.exit(0) ;
 
 
var ScreenId = sgw.getScreensTableIdByName(tblSGWScreens,"keuken") ; 
console.log(" id keuken "+ScreenId.toString() ) ;
ScreenId = sgw.getScreensTableIdByName(tblSGWScreens,"bad") ; 
console.log(" id bad "+ScreenId.toString() ) ;
ScreenId = sgw.getScreensTableIdByDeviceId(tblSGWScreens,"6") ;
console.log(" id dev 6 "+ScreenId.toString() ) ;
console.log("\r\nEnd of testing the screen functions") ;
// compose the JSON array SGWGroupScreens
strSGWGroupScreens += '"name": "oost", "deviceids": "'; 
for (let i = 0; i < tblSGWScreens.length; i++) {
  let element = tblSGWScreens[i];
  if ((element.group.toLowerCase() === "oost" )) {
           strSGWGroupScreens += element.id + ";" ;   // instead of deviceId you can use id
  } 
}
strSGWGroupScreens += '"},{"name": "west", "deviceids": "';
for (let i = 0; i < tblSGWScreens.length; i++) {
  let element = tblSGWScreens[i];
  if ((element.group.toLowerCase() === "west" )) {
           strSGWGroupScreens += element.id + ";" ;
  } 
}
strSGWGroupScreens += '"}]';
console.log("strSGWGroup: "+strSGWGroupScreens) ;
var SGWGroupScreens = JSON.parse(strSGWGroupScreens) ;
console.log(SGWGroupScreens) ;
console.log(SGWGroupScreens[1].deviceids) ;
SGWGroupScreens[0].mask = sgw.makeGroupMask(SGWGroupScreens[0].deviceids) ;
SGWGroupScreens[1].mask = sgw.makeGroupMask(SGWGroupScreens[1].deviceids) ;
console.log(SGWGroupScreens) ;
let lID = sgw.getGroupsTableIdByName(SGWGroupScreens, "Zuid") ;
console.log(lID) ;
lID = sgw.getGroupsTableIdByName(SGWGroupScreens, "West") ;
console.log(lID) ;
lID = sgw.getGroupsTableIdByName(SGWGroupScreens, "Oost") ;
console.log(lID) ;

// process.exit(0) ;
// testing the SGW message queue
/*
console.log(SGW_SQ) ;
let idx = 0
idx = SGWSQAdd("screenUp", "xml test 1") ;
idx = SGWSQAdd("screenStop", "xml test 2") ;
idx = SGWSQAdd("screenDown", "xml test 3") ;
console.log(SGW_SQ) ;
let SQRow = SGWSQFront() ;
console.log(SQRow) ;
console.log(SGWSQSize() );
*/
// testing base64 functions 
var testArray = new Array(64) ;
testArray = sgw.decodeBase64ToBoolArray("AAAAAAAAAAA=") ;
console.log(testArray) ;

// process.exit(0) ;

console.log(" Initiating and Open the USB COM port "+COM_PortSGW) ;
//var SerialPort = serialport.SerialPort; // localize object constructor
// const ByteLength = SerialPort.parsers.ByteLength
// Commeo Data is send serially (via USB) as a XML message at a speed of 115200 baud (N,8,1)
var serialPortSGW = new SerialPort({
  path: COM_PortSGW, 
  baudRate:115200,  
  databits:8,        // standard 8, 
  parity:"none",     // standard none
  stopbits: 1 
  // xon: 0, 
  // xoff: 0, 
  // rtscts: 0,
  // parser: SerialPort.parsers.ByteLength({length: 1})   // .raw uses the raw parseroption
  });;

const parser = serialPortSGW.pipe(new ReadlineParser({ delimiter: '\r\n' }))  // message ends with </methodResponse> or <methodCall>
// test closed parser.on('data', console.log) ;

serialPortSGW.on('open', ShowPortSGWOpen);
// parser for XML message 
parser.on('data', function(data) {
  // console.log(" onData "+data) ;
  if (data.indexOf('</methodResponse>') > -1 || data.indexOf('</methodCall>') > -1 ) {
    XMLMsgReady = true  ;
    console.log(" onData end of msg received "+data) ; 
  }
  XMLData = XMLData + data + '\r\n' ;
  if (XMLMsgReady) {
    XMLData = XMLData.substring(39) ; // skip the first 39 characters as <?xml ....>
    console.log(' Parser Received Data: '+XMLData+'\r\n End of parsed Data.');  // for testing
    HandleIncomingSGWMessage(XMLData) ;
    if (SGWSQSize() > 0) { // send next command from the  queue SGW_SQ 
      console.log(" Send next Message from Selve SendQueue") ;
      SendMessage2SGW([], false) ; 
    } else {
      console.log(" Waiting for a new XML message in the Selve SendQueue.")
    }
    XMLMsgReady = false ;  // wait for the next XML data
    XMLData = "" ;  // reset
  }
});  // end of parser on data

serialPortSGW.on('close', ShowPortSGWClose);

serialPortSGW.on("error", function (data) {
	// let lDatumTijd = GetDatumTijd() ;
    // console.log("? error:" + lDatumTijd + ", Error reading RFLinkHandler controller port: " + data);
    // LogToFile(LOGFILENAME, "Error reading Selve Gateway controller port: " + data);
    // client.publish( 'micasa/rflink/stat/mqtt', 'Service Selve Gateway controlller serial port error on '+datumTijd );
  console.log("  serialPort Error "+data) ;
});

sleep(250) ;
// first a ping as a start message, followed by a getState command
console.log(" Send ping to Selve Gateway.");
SendSGWServiceMessage("ping") ;
sleep(100);
console.log(" Request State from Selve Gateway.");
SendSGWServiceMessage("getState") ;
sleep(100) ;
console.log(" getVersion from Selve Gateway."); 
SendSGWServiceMessage("getVersion") ;

sleep(10) ;
// console.log(" getLED info from Selve Gateway.");
// SendSGWServiceMessage("getLED");

// ?todo
  sleep(10) ;
/*  console.log(" Test deviceId=4 GetDeviceValues") ;
  deviceId =  "4" // Eetkamer_Rechts
  SendSGWGetDeviceValues(deviceId)
  sleep(10) ;
   // send deviceUp
  console.log(" Test down command ") ;
  SendSGWCommandDevice(deviceId,"down", "");
 */

  // SendSGWDeviceMessage("getIDs") ;
  sleep(10) ;
//  console.log(" send cmd device 4 up") ;
//  SendSGWCommandDevice("4","up", "");
  sleep(500) ;
//  console.log(" send getDeviceCalues 4");
//  SendSGWGetDeviceValues("4") ;

 console.log(" send grouplist Oost down") ;
// SendSGWCommandGroupMan("5;4;1;", "up", "") ; // (pGroupList, pCMD, pValToSend)
  SendSGWCommandGroup("1", "down", "") ;  //  (pGroupId, pCMD, pValToSend) 
sleep(100) ;
console.log(" Finished testing ...")

process.on( 'SIGTERM', function () {
   // todo server.close() ;
   serialPortSGW.close(function () {
     console.log("Finished this test script");
   });
});
// end of script



