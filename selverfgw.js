// Module selveRFgw   Selve RF usb Gateway
// By JWT on 23-05-2024, edited 6-2-2025
// aanroep const sgw = require('./selverfgw'); 
// Version 1.0.2

// convert the SGW XML data into a CSV ; separated list
module.exports.convertXML2CSV = function(pData) {
  let lString = pData.replace(/ /g,'') ;
  lString = lString.replaceAll("\t","") ;
  lString = lString.replaceAll("\r\n","") ;
  lString = lString.replaceAll("</string>",";");
  lString = lString.replaceAll("</int>",";") ;
  lString = lString.replaceAll("</base64>",";") ; 
  lString = lString.replaceAll("<string>","") ;
  lString = lString.replaceAll("<int>","");
  lString = lString.replaceAll("<base64>","") ;
  lString = lString.replaceAll("<array>","");
  lString = lString.replaceAll("</array>","");
  lString = lString.replaceAll("<methodResponse>","");
  lString = lString.replaceAll("</methodResponse>",""); 
  lString = lString.replaceAll("; ",";");
  lString = lString.replaceAll(" ",";");
  return lString.trim() ;   
} // end of convertXML2CSV(pData)

// test base64 functions = OK
// functions om naar en van base64 om te zetten
module.exports.decodeBase64ToBoolArray = function(pStrMask) {  // pStrMask is the base64 encoded string
  let lBfrObjd = Buffer.from(pStrMask, "base64") ;
  let lDecodedStr = lBfrObjd.toString("utf8");
  let lLen = lDecodedStr.length ;
  let lbArray = new Uint8Array(lLen) ; // Array.from(decStr) ;
  console.log("Get to decode str  ", pStrMask) ;
  console.log("Get Decoded string ", lDecodedStr);
  for (let i=0; i < lLen; i++) { lbArray[i] = lDecodedStr.charCodeAt(i) ; } 
  return lbArray;
}  // end of decodeBase64ToBoolArray

//Length of boolArray has to be a multiple of 8 bytes
module.exports.encodeBoolArrayToBase64 = function(pBoolArray) {
  let lBfrObj = Buffer.from(pBoolArray) ;
  let lB64str = lBfrObj.toString("base64") ;
  return lB64str ;
} // end of  EncodeBoolArrayToBase64

module.exports.getGroupsTableIdByName = function(pGroupScreens, pName) {
  let found = -1;
  let lLen = pGroupScreens.length  ;
  let strName = "";
  for (let i = 0; i < lLen; i++) {
    let element = pGroupScreens[i];
    // console.log("element ", element, element.name) ;
    strName = element.name ;
    if (strName.toLowerCase() === pName.toLowerCase() ) {
      found = i;
    } 
  }
  return found;
} // end of getGroupsTableIdByName(pName)

module.exports.getScreensTableIdByName = function(pScreensTable, pName) {
 let found = -1;
 let lLen = pScreensTable.length ; 
 let strName = '' ;
 for (let i = 0; i < lLen; i++) {
   let element = pScreensTable[i];
   strName = element.name.toLowerCase() ;
   if (strName === pName.toLowerCase()) { // || (strName.includes(pName.toLowerCase()) )) {
     found = element.id;
   } 
 }
 return found;
} // end of GetScreensTableIdByName(pName)

module.exports.getScreensTableIdByDeviceId = function(pScreensTable, pDeviceId) {
  let found = -1;
  let lLen = pScreensTable.length ;
  for (let i = 0; i < lLen; i++) {
    let element = pScreensTable[i];
    if (element.deviceid === pDeviceId) {
      found = element.id;
    } 
  }
  return found;
} // end of GetScreensTableIdByDeviceId(pDeviceId)

module.exports.getMethodName = function(pXML) {
 let p= pXML.indexOf("selve.GW");
 let l = 0;
 let lResult = "";
 if (p>0) {
   l= pXML.indexOf("</string>") ;
   lResult = pXML.slice(p+9,l) ;  // selve.GW. is 9 tekens
 } else {
   lResult = "fault";	 
 }
 return lResult ;
}  // end of getMethodName


// converts a CSV list of deviceId's to a base64 encoded string
module.exports.makeGroupMask = function(pCsvList) {
  let lBArray = new Uint8Array(8) ;  // to be used by SGW bitmask for devices, etc.
  for (let i=0; i < 8; i++) { lBArray[i] = 0 } // even op nul setten
  let lSA = pCsvList.split(";") ;
  let lStrDevId = "" ; 
  let lDevId = 0 ;
  let lByteNr = Math.floor(lDevId / 8) ;
  let lBitNr = lDevId % 8 ;
  for (let i=0; i < lSA.length; i++) {
    lStrDevId = lSA[i] ;
    lDevId = parseInt(lStrDevId);
    lByteNr = Math.floor(lDevId / 8) ;
    lBitNr = lDevId % 8 ;
    //  maskSGWdevice(lDevId) ;
    switch (lBitNr) {
     case 0:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b00000001 ;
      break ;
     case 1:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b00000010 ;
      break ;
     case 2:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b00000100 ;
      break ;
     case 3:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b00001000 ;
      break ;
     case 4:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b00010000 ;
      break ;
     case 5:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b00100000 ;
      break ;
     case 6:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b01000000 ;
      break ;
     case 7:
      lBArray[lByteNr] = lBArray[lByteNr] | 0b10000000 ;
      break ;
    }  // end switch
  } // for
  // let lBstr = lBArray.toString(2) ;
  let lBfrObj = Buffer.from(lBArray) ;
  let lB64str = lBfrObj.toString("base64") ;
  return lB64str ;
} // makeGroupMask(pCsvList)

// converts a base64 encoded string mask to a CSV list of deviceId's
module.exports.getListDevicesFromMask = function(pStrMask) {  // pStrMask is base64 encoded string mask}
  let lBfrObjd = Buffer.from(pStrMask, "base64") ;
  let lDecodedStr = lBfrObjd.toString("utf8");
  let lLen = lDecodedStr.length ;
  let lbArray = new Uint8Array(lLen) ; // Array.from(decStr) ;
  console.log("Get to decode str  ", pStrMask) ;
  console.log("Get Decoded string ", lDecodedStr);
  for (let i=0; i < lLen; i++) { lbArray[i] = lDecodedStr.charCodeAt(i) ; } 
  console.log("Get Decoded bArray ", lbArray);
  lLen = lbArray.length ;
  console.log("Get length decoded lbArray ", lLen) ;
  let lByte = 0 ;  // value of the byte
  let lBytenr = 0 ;
  let lDevID = 0 ;
  let lStrDevices = "" ; // contains the result list of devices separated by ;;  
  for (i=0; i < lLen; i++) {
    lByte = lbArray[i] ;
    console.log("Get lByte: ", lByte) ;
    if (lByte > 0) { // check the 8 bits of the byte
      for (j=0; j<8;j++) {
        // test bit for bit
        if (lByte >> j & 1) {
          lDevId = i*8+j ;
          lStrDevices += lDevId.toString()+";" ;
        }   
      } // for j
    } // endif
  }  // for i
  return lStrDevices ;
} // getListDevicesFromMask(pStrMask)

// updates the ScreenTable with the new state (up, down, stopped)
module.exports.updateGroupStates = function(pScreensTable, pGroup, pState) { 
  let lLen = pScreensTable.length ;
  let lStrId = "0" ;
  if (pGroup == "Alles") {
    for (let i = 0; i < lLen; i++) {
       pScreensTable[i].state = pState ;
    }
  } else if (pGroup == "West" || pGroup == "Oost") {
    for (let i = 0; i < lLen; i++) {
       if (pScreensTable[i].group == pGroup) {
         pScreensTable[i].state = pState ;
       }
    } // end for
  } else { // should be a list like 2;4;5;6
    for (let i = 0; i < lLen; i++) {
       lStrId = pScreensTable[i].id.toString() ;
       if (pGroup.indexOf(lStrId) > -1) {
         pScreensTable[i].state = pState ;
       }
    } // end for
  } // end of group test
  return pScreensTable ;
} // updateGroupStates

