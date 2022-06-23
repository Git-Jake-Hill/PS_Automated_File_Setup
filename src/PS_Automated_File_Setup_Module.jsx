/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	The following creates or updates RAW and Comp psd files for a specific project - including mask to folder with idCodes
*   
* -------------------------------------------------------------------------------------------------------------------------------*/

// To add a mask use # followed by the render element code you want to mask 
//     eg. #1 for Red channel MatID_Arch_123
// Use a M for MultiMatte ID 
//     eg. #M1 = R MM_Arch_123
// Use a comma to select RG,RB,GB or RGB 
//     eg. #M1,M2,M3 = RGB MM_Arch_123
// Use -I on the end of a tag to invert the mask
//     eg. #M1-I

// note:
//     - folders to have a unique name


/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	TODO:
*   - updte raw lighting  - done 21/02/2022
*   - upated size of render passes when changing from 3k to 6k render - eg reflection pass, AO pass etc.
*       - use this to update links to current view render pass when copying from one file to another.
*       - *done, but issue with pass having mask resizing incorectly..
*   - back up psd files into old - done 24/02/2022
*   - copy visible layers to save current state render and then turn off the layer
*
* -------------------------------------------------------------------------------------------------------------------------------*/

var __canContinue = true;
var __rawFileFound = false;
var __compFileFound = false;
var __exrFileFound = false;
var __alertMessage = "Messages during setup:";
var __jobFolderName;
var __iamgeFolderName = "Images"; // images, VR etc.
var __jobFolderCode;
var __viewNumbers = []; // List of views numbers only ["1,2,3"]
var __viewList = []; // List of views ["V01,V02,V03"]
var __rawPSFileName = "BMU006 V01-RAW";
var __compPSFileName = "BMU006 V01A A";
var __pathRawPS = "G:/Project/";
var __pathRawPSFolder = "G:/Project/";
var __pathImage = "R:/Project/";
var __pathCompPS;
var __activeDoc; // Curent document
var __alphaMask;
var __imageWidth;
var __imageHeight;
var __testPathOverride = "jh_test/" // set this to empty string "" to path correctly on G drive or "jh_test/" for testing

// Update Masks variables
var __currentViewNumber;
var __currentLayer;
var __matIdExtension; // ".MM_Plants_313233"
var __maskCode; // RGB
var __invertMask = false;

/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	UTIL METHODS
* 
* -------------------------------------------------------------------------------------------------------------------------------*/

/**
*	getDateStamp
*	@param null
*	@returns for example - 190218	
*/
function getDateStamp () {
    
    var date = new Date();
    
    var hours = date.getHours();
    if (hours < 10) {
        hours = "0" + hours;
    } else {
        hours = hours.toString();
    }

    var minutes = date.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    } else {
        minutes = minutes.toString();
    }

    var year = date.getFullYear(); //2019
    year = year.toString(); 
    year = year.substring(2, 4); //becomes - 19 

    var month = date.getMonth(); //1
    if (month < 9) { 
        month = "0" + (month+1); //becomes - 02
    } else {
        //month = month.toString();
		month = (month + 1).toString()
    }

    var day = date.getDate();
    if (day < 10) {
        day = "0" + (day);
    } else {
        day = day.toString();
    }

    var dateStamp = year + month + day + "-" + hours + minutes;
    return dateStamp;

}

/**
*	disableRun - disable any further script execution and notify of reason
*	@param msg
*	@returns null
*/
function disableRun (msg) {
    __canContinue = false; 
    __alertMessage = msg;
}


/**
*	replaceAll 
*	@param null
*	@returns string
*/
function replaceAll (target, search, replacement) {
    return target.split(search).join(replacement);
};


/**
*	getFolder
*	@param dir
*	@returns null
*/
function getFolder (dir) {
    var folder = Folder(dir);
    if (!folder.exists) {
        folder.create();
    }
    return folder;
}

/**
*	extractViewRange - get view range; 1-3 == 1,2,3 
*	@param null
*	@returns null
*/
function extractViewRange(start,end) {
    var range = (end - start) + 1;
    var viewList = [];
    for (var index = 0; index < range; index++) {
        viewList.push(start + index);
    }
    return viewList;
}


/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	RUN METHODS
* 
* -------------------------------------------------------------------------------------------------------------------------------*/



/**
*	specifyJobFolder - select job folder - somthing like "BMU006 Queens Wharf - IRD + T5 & 6"
*	@param null
*	@returns null
*/
function specifyJobFolder() {
    try {
        var jobFolder = Folder("G:/Project/").selectDlg("Please select the desired folder:");
    } catch (error) {
        disableRun("No job folder selected.");
    }

    if (jobFolder) {
        jobFolder = jobFolder.toString();
        var noSpacejobFolderName = jobFolder.substring(jobFolder.lastIndexOf("/")+1, jobFolder.length);
        __jobFolderName = replaceAll( noSpacejobFolderName, "%20", " ");
        __jobFolderCode = __jobFolderName.substring(0, 6) + " ";
    } else {
        disableRun("No job folder selected.");
    }
}


/**
*	specifyViews - user input to specify views as V01,V02
*	@param null
*	@returns null
*/
function specifyViews() {
    
    try {
        var userInputViews = prompt("Enter views \nComma to seperate single view 1,2,3\nDash for range 1-3 --> 1,2,3", "3");
    } catch (error) {
        disableRun("Error on prompt");
    }

    if (userInputViews) {
        var userInputList = userInputViews.split(",")
        for (var index = 0; index < userInputList.length; index++) {
            if (userInputList[index].match(/^[^1-9]/) | userInputList[index].toString().length == 0 ) {
                disableRun(userInputList[index] + "\n\nIncorrect input."
                + "\n\nDo not enter V0 before the view numbers."
                + "\n\nRemove any extra commas.");
                break
            }
        }

        if (__canContinue) {
            var rawList = userInputList;
            for (var index = 0; index < userInputList.length; index++) {
                if (userInputList[index].match(/-/) != null) {
                    var viewRange = userInputList[index].split("-")
                    var viewRangeExtract = extractViewRange(parseInt(viewRange[0]),parseInt(viewRange[1]))
                    if (rawList.length == 0) {
                        rawList = userInputList.concat(viewRangeExtract)
                    } else {
                        rawList = rawList.concat(viewRangeExtract)
                    }
                }
            }
            
            for (var index = 0; index < rawList.length; index++) {
                if ((rawList[index].toString().match(/-/) == null)) {
                    
                    if (rawList[index].toString().length == 1) {
                        __viewList.push("V0" + rawList[index])
                    } else {
                        __viewList.push("V" + rawList[index])
                    }
                    __viewNumbers.push(rawList[index])
                }  
            }
            __viewList.sort()
            __viewNumbers.sort()
        }

    } else {
        disableRun("No views selected");
    }
}


/**
*	confirmFileOutput - confirm the project name and views to be created
*	@param null
*	@returns null
*/
function confirmFileOutput() {
    var printViews = "";
    for (var index = 0; index < __viewList.length; index++) {
        printViews = printViews + __viewList[index] + "\n";
    }
    var continueRun = confirm("Create or update these psd files?\n\n" + "Project foler:\n" + __jobFolderName + "\n\n" + "Views to create:\n" + printViews ); 

    if (!continueRun) {
        disableRun("Cancelled");
    }
}


/**
*	createFileObject - create file for Raw, comp and Exr.
*	@param viewNum
*   @param fileType
*   @param extension - extention for material id path
*	@returns fileObject
*/
function createFileObject(viewNum,fileType,extension) {
    var fileObject;
    if (extension == undefined) {
        extension = "";
    } 
    
    if (fileType.toUpperCase() == "EXR") {
        // fileObject = new File("C:/Project/" + __jobFolderName + "/Images/" + viewNum + "/"+ viewNum + ".jpg");
        fileObject = new File("R:/Project/" + __jobFolderName + "/" + __iamgeFolderName + "/" + viewNum + "/"+ viewNum + extension + ".exr");
    }
    if (fileType.toUpperCase() == "RAW") {
        __rawPSFileName = __jobFolderCode + viewNum + "-RAW";
        // fileObject = new File("C:/Project/" + __jobFolderName + "/Images/Photoshop/"  + viewNum + "/" + __rawPSFileName + ".psd");
        fileObject = new File("G:/Project/" + __testPathOverride + __jobFolderName + "/Images/Photoshop/"  + viewNum + "/" + __rawPSFileName + ".psd"); // TODO remove jh_test
    }
    if (fileType.toUpperCase() == "COMP") {
        __compPSFileName = __jobFolderCode + viewNum + "A A";
        // fileObject = new File("C:/Project/" + __jobFolderName + "/Images/Photoshop/"  + viewNum + "/" + __compPSFileName + ".psd");
        fileObject = new File("G:/Project/" + __testPathOverride + __jobFolderName + "/Images/Photoshop/"  + viewNum + "/" + __compPSFileName + ".psd"); // TODO remove jh_test
    }
    return fileObject;
}


/**
*	checkIfFileExists - check if file exists
*	@param fileObject
*	@returns boolean
*/
function checkIfFileExists(fileObject) {
    
    if (fileObject.exists) {
        // alert(fileObject + " File found.")
        return true;
    } else {
        // alert(fileObject + " Not found.")
        return false;
    }
}

/**
*	createFolder - create folder in photoshop directory per view number
*	@param viewNum
*	@returns null
*/
function createFolder(viewNum) {

    __pathRawPSFolder = "G:/Project/" + __testPathOverride + __jobFolderName + "/Images/Photoshop/" + viewNum + "/"; // TODO remove jh_test
    getFolder(__pathRawPSFolder);

}

function getImageSize(viewNum) {
    var sizeFactor;
    try {
        var alphaDocRef = app.open(new File("R:/Project/" + __jobFolderName + "/" + __iamgeFolderName + "/" + viewNum + "/"+ viewNum + ".VRayAlpha.exr"));
        __imageWidth = parseInt(alphaDocRef.width);
        __imageHeight = parseInt(alphaDocRef.height);
        if (__imageWidth > __imageHeight) {
            sizeFactor = 6000 / __imageWidth;
        } else {
            sizeFactor = 6000 / __imageHeight;
        }
        
        __imageWidth = __imageWidth * sizeFactor;
        __imageHeight = __imageHeight * sizeFactor;

    } catch (error) {
        // alert("Alpha not found for " + viewNum)
        __alertMessage += "\n ERROR:" + viewNum + " Alpha not found.";
        __imageWidth = 6000;
        __imageHeight = 4000;
    }
    
    try {
        if (alphaDocRef.width < __imageWidth) {
            alphaDocRef.resizeImage( __imageWidth , __imageHeight , 300);
            
        }
    } catch (error) {
        
    }

    try {
        __alphaMask = alphaDocRef.layers[0];
        app.activeLayer = __alphaMask
        __alphaMask.isBackgroundLayer = false;
        __alphaMask.resize( __imageWidth , __imageHeight ,AnchorPosition.MIDDLECENTER);
        
        __alphaMask.copy();
        alphaDocRef.close(SaveOptions.DONOTSAVECHANGES)
    } catch (error) {
        // alert("error with copy mask")
    }
    
}

/**
*	createRawPsdFile - create the Raw 32bit photoshop file per view number
*	@param viewNum
*	@returns null
*/
function createPsdFile(type,compPsdFile) {
    var fileType;
    var bits;
    
    try {
        if (type == "RAW") {
            fileType = __rawPSFileName;
            bits = BitsPerChannelType.THIRTYTWO; 
            __activeDoc = app.documents.add(__imageWidth , __imageHeight, 300, fileType, NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1, bits);
        } else {
            fileType = __compPSFileName;
            bits = BitsPerChannelType.EIGHT;
            // __activeDoc = app.documents.add(__imageWidth , __imageHeight, 300, fileType, NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1, bits);
            __activeDoc = app.open(new File("G:/__SD_Library/2D/Photoshop Templates/Photoshop_Comp_Template.psd"));
            __activeDoc.resizeImage( __imageWidth , __imageHeight , 300);
            __activeDoc.saveAs(compPsdFile, PhotoshopSaveOptions,false,Extension.LOWERCASE)
            // var folder = __activeDoc.layerSets.add();
            // folder.name = "RENDER"
            // __activeDoc.activeLayer = folder;
        }
        
    } catch (error) {

        alert("could not create psd file")
    }
    
}

function createMask() {
    try {
        var idMk = charIDToTypeID( "Mk  " );
        var desc6 = new ActionDescriptor();
        var idNw = charIDToTypeID( "Nw  " );
        var idChnl = charIDToTypeID( "Chnl" );
        desc6.putClass( idNw, idChnl );
        var idAt = charIDToTypeID( "At  " );
        var ref1 = new ActionReference();
        var idChnl = charIDToTypeID( "Chnl" );
        var idChnl = charIDToTypeID( "Chnl" );
        var idMsk = charIDToTypeID( "Msk " );
        ref1.putEnumerated( idChnl, idChnl, idMsk );
        desc6.putReference( idAt, ref1 );
        var idUsng = charIDToTypeID( "Usng" );
        var idUsrM = charIDToTypeID( "UsrM" );
        var idRvlA = charIDToTypeID( "RvlA" );
        desc6.putEnumerated( idUsng, idUsrM, idRvlA );
        executeAction( idMk, desc6, DialogModes.NO );
    } catch (error) {
        
    }
}

function selectMask(layerName)
{
  try
  {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk ') );
    ref.putName( charIDToTypeID('Lyr '), layerName );
    desc.putReference( charIDToTypeID('null'), ref );
    desc.putBoolean( charIDToTypeID('MkVs'), true );
    executeAction( charIDToTypeID('slct'), desc, DialogModes.NO );

    // =======================================================
    var id1083 = charIDToTypeID( "setd" );
    var desc238 = new ActionDescriptor();
    var id1084 = charIDToTypeID( "null" );
    var ref161 = new ActionReference();
    var id1085 = charIDToTypeID( "Chnl" );
    var id1086 = charIDToTypeID( "fsel" );
    ref161.putProperty( id1085, id1086 );
    desc238.putReference( id1084, ref161 );
    var id1087 = charIDToTypeID( "T   " );
    var ref162 = new ActionReference();
    var id1088 = charIDToTypeID( "Chnl" );
    var id1089 = charIDToTypeID( "Ordn" );
    var id1090 = charIDToTypeID( "Trgt" );
    ref162.putEnumerated( id1088, id1089, id1090 );
    desc238.putReference( id1087, ref162 );
    executeAction( id1083, desc238, DialogModes.NO );
  }
  catch(e)
  {
  createMask()
  selectMask(layerName)
  }
} 


function applyMask(layer) {
    var renderFolder = null;
    try {
        renderFolder = __activeDoc.layerSets.getByName(layer);
        __activeDoc.activeLayer = renderFolder;
    } catch (error) {
        __alertMessage += "\n ERROR: No RENDER folder found.";
    }
    
    if (renderFolder != null) {
        try {
            selectMask(layer)
            var pasteLayer = __activeDoc.paste();
            // __alphaMask.paste();

        } catch (error) {
            
        }
    }
    
    activeDocument.selection.deselect();
    // __activeDoc.activeLayer = __activeDoc.layers[0];

    try {
        // change selection to draft layers rather than mask.
        __activeDoc.activeLayer = __activeDoc.layers.getByName("draft");
    } catch (error) {
        
    }
}


/**
*	linkExrImage - place a linked image of the view exr file from R drive
*	@param exrFile
*	@returns null
*/
function linkImage(exrFile) {

    try {
        var idPlc = charIDToTypeID( "Plc " );
        var desc3 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
        desc3.putPath( idnull, exrFile );
        var idLnkd = charIDToTypeID( "Lnkd" );
        desc3.putBoolean( idLnkd, true );
        var idFTcs = charIDToTypeID( "FTcs" );
        var idQCSt = charIDToTypeID( "QCSt" );
        var idQcsa = charIDToTypeID( "Qcsa" );
        desc3.putEnumerated( idFTcs, idQCSt, idQcsa );
        var idOfst = charIDToTypeID( "Ofst" );
        var desc4 = new ActionDescriptor();
        var idHrzn = charIDToTypeID( "Hrzn" );
        var idPxl = charIDToTypeID( "#Pxl" );
        desc4.putUnitDouble( idHrzn, idPxl, 0.000000 );
        var idVrtc = charIDToTypeID( "Vrtc" );
        var idPxl = charIDToTypeID( "#Pxl" );
        desc4.putUnitDouble( idVrtc, idPxl, 0.000000 );
        var idOfst = charIDToTypeID( "Ofst" );
        desc3.putObject( idOfst, idOfst, desc4 );
        executeAction( idPlc, desc3, DialogModes.NO );
    
    } catch (error) {
    
        __alertMessage += "\n ERROR: No image found for: " + exrFile;
    }
}

/**
*	moveLayer - move the current layer to the target in a nested parentFolder.
*	@param target // name of layer to move current layer to.
*   @param parentFolder // folder target is nested in.
*   @param copy // if true duplicate the layer instead of moving it.
*	@returns null
*/
function moveLayer(target, parentFolder, copy) {
    var targetFolder;
    var targetLayer;
    var targetFound = false;
    __destinationLayer = app.activeDocument.activeLayer;
    
    try {
        
        targetFolder = __activeDoc.layerSets.getByName(parentFolder);
        // __destinationLayer.move(targetLayer, ElementPlacement.INSIDE)
        targetFound = true;
    } catch (error) {
        alert("did not find folder")
    }
    try {
        targetLayer = targetFolder.layers.getByName(target);
    } catch (error) {
        alert("did not find target " + target)
    }
    try {
        if (copy) {
            __destinationLayer.duplicate(targetLayer, ElementPlacement.PLACEBEFORE);
        } else {
            __destinationLayer.move(targetLayer, ElementPlacement.PLACEBEFORE);
        }
        
        targetLayer.remove(); //remove the target layer
        targetFound = true;
    } catch (error) {
        alert("did not move layer")
    }
    
    if (!targetFound) {
        alert("could not find " + target)
    }
    
}

/**
*	scaleImageToCanvas - check if layer matches canvas size and scale if needed.
*	@param null
*	@returns null
*/
function scaleImageToCanvas() {
    var width = app.activeDocument.width.as('px');
    var height = app.activeDocument.height.as('px');
    var bounds = app.activeDocument.activeLayer.bounds;
    var layerWidth = bounds[2].as('px')-bounds[0].as('px');
    var layerHeight = bounds[3].as('px')-bounds[1].as('px');
    
    if (width != layerWidth) { // scale the layer to match canvas
        app.activeDocument.activeLayer.resize( (width/layerWidth)*100,(height/layerHeight)*100,AnchorPosition.MIDDLECENTER);
        // alert("file height = " + height + "\n" +"cur layer = " + layerHeight );
    } 
    else{
        // alert("did not resize");
    }
    if (bounds[0].value != 0 | bounds[1].value != 0) {
        bounds = app.activeDocument.activeLayer.bounds;

        layerWidth = bounds[2].as('px')-bounds[0].as('px'); // TODO check issue with bounds on resize odd image ratios
        layerHeight = bounds[3].as('px')-bounds[1].as('px');
        // Centering the layer

        // Getting center coordinates of the document
        var docCenterW = width / 2;
        var docCenterH = height / 2;

        // getting values to translate the layer. 
        var deltaX = Math.round(docCenterW - (bounds[0].value + layerWidth / 2));
        var deltaY = Math.round(docCenterH - (bounds[1].value + layerHeight / 2));

        
        // alert("translate " + bounds[0].value + " " + bounds[1].value)
        app.activeDocument.activeLayer.translate(-bounds[0].value, -bounds[1].value);
    }
    else{
        // alert("did not translate");
    }
}

function updateDraftNumber(viewNum) {
    var draftFound = false;

    try {
        __sourceLayer = __activeDoc.layers.getByName("draft");
        draftFound = true;
    } catch (error) {
        __alertMessage += "\n ERROR: Missing draft layer, check template PS file.";
        // TODO: fix draft add here.. size, postition, transparrent etc.

        var draftLayer = app.activeDocument.artLayers.add(); 
        draftLayer.name = "DRAFT";
        draftLayer.kind = LayerKind.TEXT
        draftLayer.textItem.contents = viewNum + " DRAFT B";
    }

    if (draftFound) {
        __sourceLayerContent = __sourceLayer.textItem.contents;
        __sourceLayer.textItem.contents = viewNum + __sourceLayerContent.substring(3,);
    } 
    
}

function turnOffVignetting() {

    try {
        var finalFolder = __activeDoc.layers.getByName("FINAL GRADING");
        var vignettingLayer = finalFolder.layers.getByName("R VIGNETTING");

        vignettingLayer.fillOpacity = 10;
        // vignettingLayer.visible = false; // to turn of layer

    } catch (error) {
        // alert("failed to turn set vignette opacity")
    }
    
}

/**
*	applyCameraRaw - apply a camera raw filter with auto settings
*	@param rawPsdFile
*	@returns null
*/
function applyCameraRaw() {
    try {
        var desc1 = new ActionDescriptor();
        desc1.putBoolean(charIDToTypeID("AuTn"), true); // AuTn = Auto

        var idStrt = charIDToTypeID( "Strt" );
        desc1.putInteger( idStrt, -15 ); // set saturation to -15
        executeAction(stringIDToTypeID('Adobe Camera Raw Filter'), desc1, DialogModes.NO); // add camera raw filter with auto settings
        
    } catch (error) {
        alert("Failed to add raw filter " + rawPsdFile );
    }    
}

/**
*	freeTransformImage - free transform to scale image and update link - saves time updating the image link when going from half size render to full size
*	@param horizontal - offset
*	@param vertical - offset
*	@param width - scale width
*	@param height - scale height
*	@returns null
*/
function freeTransformImage(viewNum, horizontal, vertical, width, height) { 
	var s2t = function (s) {
		return app.stringIDToTypeID(s);
	};
    
    if (viewNum != null) {
        __activeDoc.activeLayer = __activeDoc.layers.getByName(viewNum);
    }
    
	var descriptor = new ActionDescriptor();
	var descriptor2 = new ActionDescriptor();

	descriptor.putEnumerated( s2t( "freeTransformCenterState" ), s2t( "quadCenterState" ), s2t( "QCSAverage" ));
	descriptor2.putUnitDouble( s2t( "horizontal" ), s2t( "pixelsUnit" ), horizontal );
	descriptor2.putUnitDouble( s2t( "vertical" ), s2t( "pixelsUnit" ), vertical );
	descriptor.putObject( s2t( "offset" ), s2t( "offset" ), descriptor2 );
	descriptor.putUnitDouble( s2t( "width" ), s2t( "percentUnit" ), width );
	descriptor.putUnitDouble( s2t( "height" ), s2t( "percentUnit" ), height );
	executeAction( s2t( "transform" ), descriptor, DialogModes.NO );
}

/**
*	updateModifiedContent - update all modified content - updates layer links to images
*	@param null
*	@returns null
*/
function updateModifiedContent() {
    
    app.runMenuItem(stringIDToTypeID("placedLayerUpdateAllModified"));
}

/**
*	openFile - opens a file
*	@param psdFile
*	@returns null
*/
function openFile(psdFile) {

    __activeDoc = app.open(psdFile)
}

/**
*	saveAndClose - saves and closes a file
*	@param psdFile
*	@returns null
*/
function saveAndClose(psdFile) {

    __activeDoc.saveAs(psdFile);
    __activeDoc.close();
}

function backUpPsd(fileType) {
    var fileDir = app.activeDocument.path.fsName;
    var oldFolderPath = fileDir + "\\Old\\"

    getFolder(oldFolderPath);

    if (fileType.toUpperCase() == "RAW") {
        // alert(oldFolderPath + __rawPSFileName + "_" + getDateStamp() + ".psd")
        __activeDoc.saveAs(File(oldFolderPath + __rawPSFileName + "_Backup"  + ".psd"), PhotoshopSaveOptions, true)
    }
    if (fileType.toUpperCase() == "COMP") {
        // alert(oldFolderPath + __compPSFileName + "_" + getDateStamp() + ".psd")
        __activeDoc.saveAs(File(oldFolderPath + __compPSFileName + "_Backup"  + ".psd"), PhotoshopSaveOptions, true)
    }
}

/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	UPDATE MASKS
* 
* -------------------------------------------------------------------------------------------------------------------------------*/

/**
*	specifyJobFolderFromPath - updated to use the photoshop file path
*	@param null
*	@returns null
*/
function specifyJobFolderFromPath () {

    try {
        var fileDir = app.activeDocument.path.fsName;
        var foldersSplit = fileDir.split("\\");
        var jobFolder = foldersSplit[2];
        
        __jobFolderName = jobFolder;
        __jobFolderCode = __jobFolderName.substring(0, 6) + " ";
    } catch (error) {
        disableRun("No job folder?");
    }

}

/**
*	getViewNumberAndWidth - sets the width/height REMOVED!(gets the view number of the file to apply to the draft tag)
*	@param null
*	@returns null
*/
function getViewNumberAndWidth() {
    __activeDoc = app.activeDocument;
    // __currentViewNumber = __activeDoc.name.substring(7,10);
    __imageWidth = parseInt(__activeDoc.width);
    __imageHeight = parseInt(__activeDoc.height);
}

/**
*	getViewNumber - gets the view number of the file to apply to the draft tag, NOTE! images only, not VR
*	@param null
*	@returns null
*/
function getViewNumber() {
    __activeDoc = app.activeDocument;
    __currentViewNumber = __activeDoc.name.substring(7,10); // TODO: get view number for VRs too - if VR01 else V01 
}

/**
*	getMatIdCode - checks the folder name for a # and returns the idCode
*	@param layerName - folder name to check for # in name
*	@returns idCode
*/
function getMatIdCode(layerName) {
    var layerNameList = layerName.split("#");
    var fullCode = layerNameList[1];
    var splitCode = fullCode.split("-");
    var idCode = splitCode[0];
    try {
        if (splitCode[1] == "I") {
            __invertMask = true;
            
        } else {
            __invertMask = false;
        }

    } catch (error) {
        
    }
    
    return idCode;
}

/**
*	getMatIdExtension - check idCode to match the id to the layer mask name
*	@param layerName - folder name the layer will be applied to
*	@returns null
*/
function getMatIdExtension(layerName) {
    var idCode = getMatIdCode(layerName);

    // arch
    checkIdCode(idCode, "MI1", "MI2", "MI3", ".MatID_Arch_");

    if (__maskCode == null) {
        checkIdCode(idCode, "MI4", "MI5", "MI6", ".MatID_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MI7", "MI8", "MI9", ".MatID_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MI10", "MI11", "MI12", ".MatID_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MI13", "MI14", "MI15", ".MatID_Arch_");
    }
    // arch MM
    if (__maskCode == null) {
        checkIdCode(idCode, "MM1", "MM2", "MM3", ".MM_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM4", "MM5", "MM6", ".MM_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM7", "MM8", "MM9", ".MM_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM10", "MM11", "MM12", ".MM_Arch_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM13", "MM14", "MM15", ".MM_Arch_");
    }
    // site
    if (__maskCode == null) {
        checkIdCode(idCode, "MI16", "MI17", "MI18", ".MatID_Site_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MI19", "MI20", "MI21", ".MatID_Site_");
    }
    // site MM
    if (__maskCode == null) {
        checkIdCode(idCode, "MM16", "MM17", "MM18", ".MM_Site_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM19", "MM20", "MM21", ".MM_Site_");
    }
    // cars
    if (__maskCode == null) {
        checkIdCode(idCode, "MM22", "MM23", "MM24", ".MM_Cars_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM22", "MM23", "MM24", ".MM_Cars_");
    }
    // people
    if (__maskCode == null) {
        checkIdCode(idCode, "MM25", "MM26", "MM27", ".MM_People_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM25", "MM26", "MM27", ".MM_People_");
    }
    // plants
    if (__maskCode == null) {
        checkIdCode(idCode, "MI28", "MI29", "MI30", ".MatID_Plants_");
    }
    // plants MM
    if (__maskCode == null) {
        checkIdCode(idCode, "MM28", "MM29", "MM30", ".MM_Plants_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM31", "MM32", "MM33", ".MM_Plants_");
    }
    // furn
    if (__maskCode == null) {
        checkIdCode(idCode, "MM34", "MM35", "MM36", ".MM_Furn_");
    }
    if (__maskCode == null) {
        checkIdCode(idCode, "MM37", "MM38", "MM39", ".MM_Furn_");
    }
    // spare
    if (__maskCode == null) {
        checkIdCode(idCode, "MM40", "MM41", "MM42", ".MM_Spare_");
    }
}

/**
*	checkIdCode - set the R,G,B channel's to mask based on the idCode
*	@param idCodeCheck - code from folder name to compare too
*	@param num1 - first number in layer name
*	@param num2 - second number in layer name
*	@param num3 - third number in layer name
*	@param extString - layer name suffix
*	@returns null
*/
function checkIdCode(idCodeCheck, num1,num2,num3,extString) {
    
    var testRG = num1 + "," + num2;
    var testRB = num1 + "," + num3;
    var testGB = num2 + "," + num3;
    var testRGB = num1 + "," + num2 + "," + num3;
    // __matIdExtension = extString + num1.split("MM").join("") + num2.split("MM").join("") + num3.split("MM").join(""); // .MatID_Arch_456 /[,.\s]/
    __matIdExtension = extString + num1.split(/[A-Z]{2}/).join("") + num2.split(/[A-Z]{2}/).join("") + num3.split(/[A-Z]{2}/).join(""); // .MatID_Arch_456 
    switch (idCodeCheck) {

        case num1:
            __maskCode = "R"
            break;

        case num2:
            __maskCode = "G"
            break;

        case num3:
            __maskCode = "B"
            break;

        case testRG:
            __maskCode = "RG"
            break;

        case testRB:
            __maskCode = "RB"
            break;

        case testGB:
            __maskCode = "GB"
            break;

        case testRGB:
            __maskCode = "RGB"
            break;

        default:
            __matIdExtension = null;
            __maskCode = null;
            break;
    }
}

/**
*	findFoldersWithTags - serch for folder with # - this is a mask code to apply.
*	@param parentLayer - folder to look inside for other folders.
*	@returns null
*/
function findFoldersWithTags(parentLayer, allFolders){
    // default to search all folders = true
    if ( allFolders == null) {
        allFolders = true
    }
    
    if ( allFolders ) {
        for(var i=0;i<parentLayer.layers.length;i++){
            __currentLayer = parentLayer.layers[i];
            searchFolders();
        }

    } else {
        __currentLayer = parentLayer;
        searchFolders();
    }
    
    if (allFolders) {
        app.runMenuItem(stringIDToTypeID('collapseAllGroupsEvent'));
    } 
    

    function searchFolders() {
        if (__currentLayer.typename == 'LayerSet') {
            if (__currentLayer.visible) {

                __activeDoc.activeLayer = __currentLayer;

                if (__currentLayer.name.match(/[#]/ig)) {

                    getMatIdExtension(__currentLayer.name);

                    if (__matIdExtension != null) {

                        var imageFound = false;
                        try {
                            var matIdFile = createFileObject(__currentViewNumber, "EXR", __matIdExtension);
                            imageFound = true;
                        } catch (error) {
                        }

                        if (imageFound) {
                            var maskPsd = app.documents.add(__imageWidth, __imageHeight, 300);
                            app.activeDocument = maskPsd;
                            linkImage(matIdFile);
                            app.doAction(__maskCode, "Scharp - Masking.ATN");
                            try {
                                var maskLayer = maskPsd.artLayers.getByName(__maskCode);
                                if (__invertMask) {
                                    maskLayer.invert();
                                }
                                maskLayer.copy();

                            } catch (error) {
                                
                                __alertMessage += "\n ERROR: " + __currentLayer.name + " Did not copy mask.";
                            }

                            maskPsd.close(SaveOptions.DONOTSAVECHANGES);
                            app.activeDocument = __activeDoc;
                            __activeDoc.activeLayer = __currentLayer;

                            try {
                                selectMask(__currentLayer.name);
                                __activeDoc.paste();

                            } catch (error) {
                                // alert("error pasting file")
                            }

                            app.activeDocument.selection.deselect();
                        }

                    } else {
                        
                        alert(__currentLayer.name + " # material code not correct.");

                    }
                }
                if (allFolders) {
                    // only keep checking if allFolders is true
                    findFoldersWithTags(__currentLayer);
                }
            }

        }
    }
}

/**
*	findLayerLinksToUpdate - serch for folder layers to update.
*	@param parentLayer - folder to look inside for other folders.
*	@returns null
*/
function findLayerLinksToUpdate(parentLayer){

    for(var i=0;i<parentLayer.layers.length;i++){
        __currentLayer = parentLayer.layers[i];

        if (__currentLayer.visible) {
            if (__currentLayer.name.match (/[.]/ig)) {
                if (__currentLayer.kind == LayerKind.SMARTOBJECT) {
                    
                    __activeDoc.activeLayer = __currentLayer;
                    
                    try {
                        scaleImageToCanvas();
                        // alert("scale complete " + __currentLayer.name);
                    } catch (error) {
                        
                    }
                    
                }
            }

            if(__currentLayer.typename =='LayerSet') {
                // alert("open folder " + __currentLayer.name);
                findLayerLinksToUpdate(__currentLayer);
            }
        }
    }
    // app.runMenuItem(stringIDToTypeID('collapseAllGroupsEvent'));
}

/**
*	updateRawLightingMask - update the mask using the raw lighting pass.
*	@param null 
*	@returns null
*/
function updateRawLightingMask(viewNum){
    try {
        var rawlightingPass = new File("R:/Project/" + __jobFolderName + "/" + __iamgeFolderName + "/" + viewNum + "/"+ viewNum + ".VRayRawLighting.exr");
        linkImage(rawlightingPass);
        app.doAction("Place RAWLIGHTING Masks auto","PS_Automated_File_Setup.ATN");
    } catch (error) {
        __alertMessage += "\n ERROR: " + viewNum + " Raw lighting mask failed.";
    }
    
}

/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	RUN OPERATION
* 
* -------------------------------------------------------------------------------------------------------------------------------*/

/**
*	run - runs the photoshop setup or update to create or update files.
*	@param manualRun - if run manually select the project folder and view numbers - otherwise get these from log files.
*	@param outputPath - job path supplied from log files.
*	@returns null
*/
function run (manualRun,outputPath) {

    if (manualRun) {
        if (__canContinue) {
            specifyJobFolder();
        }
    
        if (__canContinue) {
            specifyViews();
        }
    
        if (__canContinue) {
            confirmFileOutput();
        }
    
        if (__canContinue) {
            var outputDraft = confirm("Output drafts as well?"); 
        }
    } else {
        
        var pathSplit = outputPath.split("\\");
        var textJobFolder = pathSplit[2];
        __iamgeFolderName = pathSplit[3]; // if run by log files image folder path is updated here.
        var viewNumber = outputPath.substring(outputPath.lastIndexOf("\\")+1, outputPath.lastIndexOf("."));
        
        __jobFolderName = textJobFolder;
        __jobFolderCode = __jobFolderName.substring(0, 6) + " ";
        __viewList = [viewNumber];
        __alertMessage = "Messages during setup:";
        outputDraft = false; // set to true to output drafts when running from log files.
    }
    

    if (__canContinue) {
        for (var index = 0; index < __viewList.length; index++) {
            var viewNum = __viewList[index];
            var rawPsdFile = createFileObject(viewNum,"RAW");
            var compPsdFile = createFileObject(viewNum,"COMP");
            var exrFile = createFileObject(viewNum,"EXR");
            
            // check if Files Exists
            __exrFileFound = checkIfFileExists(exrFile)
            __rawFileFound = checkIfFileExists(rawPsdFile) 
            __compFileFound = checkIfFileExists(compPsdFile)
            
            if (__rawFileFound) { //  update raw psd file

                openFile(rawPsdFile);
                backUpPsd("RAW") // save psd copy in old 
                freeTransformImage(viewNum, 0, 0, 10, 10);
                scaleImageToCanvas();
                saveAndClose(rawPsdFile);
                
            } else {
                
                if (__exrFileFound) { // create raw psd file

                    getImageSize(viewNum);
                    createFolder(viewNum);
                    createPsdFile("RAW");
                    linkImage(exrFile);
                    scaleImageToCanvas();
                    applyCameraRaw();
                    saveAndClose(rawPsdFile);
                    __alertMessage += "\n" + viewNum + " Raw Psd file created.";

                } else {

                    __alertMessage += "\n ERROR:" + viewNum + " EXR file is missing.";
                }
            }
            
            if (__compFileFound) { // update comp psd file

                openFile(compPsdFile);
                backUpPsd("COMP") // save psd copy in old 
                updateModifiedContent();
                if (__alphaMask == null) {
                    getImageSize(viewNum);
                }
                applyMask("RENDER");
                specifyJobFolderFromPath(); // needs a file open to work.
                getViewNumberAndWidth();
                updateRawLightingMask(viewNum);
                findFoldersWithTags(__activeDoc); // update masks to folders with #
                findLayerLinksToUpdate(__activeDoc);
                if (outputDraft) {
                    app.doAction("Update_and_Output_Draft","PS_Automated_File_Setup.ATN");
                    __activeDoc.close();
                } else {
                    saveAndClose(compPsdFile);
                }
                
                __alphaMask = null;

            } else {

                if (__exrFileFound) { // create comp psd file

                    if (__alphaMask == null) { 
                        getImageSize(viewNum);
                    }
                    createPsdFile("COMP",compPsdFile);
                    linkImage(rawPsdFile);
                    moveLayer("LINKED RENDER" , "RENDER" , false);
                    moveLayer("COPY OF LINKED RENDER" , "BG" , true); // copy render and move
                    applyMask("RENDER");
                    getViewNumberAndWidth();
                    updateRawLightingMask(viewNum);
                    updateDraftNumber(viewNum);
                    turnOffVignetting();
                    if (outputDraft) {
                        app.doAction("Update_and_Output_Draft","PS_Automated_File_Setup.ATN");
                        __activeDoc.close();
                    } else {
                        saveAndClose(compPsdFile);
                    }
                    __alphaMask = null;
                    __alertMessage += "\n" + viewNum + " Comp Psd file created.";
                }
            }
        }
    }

    if (manualRun) {
        alert(__alertMessage);
    } else{
        return __alertMessage
    }
}