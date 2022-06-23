/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	The following puts a JPG and TIFF in G:/Project/_Output/JobFolder/ and draft JPG in G:/JobFolder/Images/_Drafts/
* 
* -------------------------------------------------------------------------------------------------------------------------------*/


// #target photoshop


var __canContinue = true;
var __alertMessage = "Files successfully outputted.";
var __currJobCode = "";
var __currViewCode = "";
var __jobCodeToViewCode = ""; //used to archive older files 
var __currJobName = "";
var __fileWidth;
var __fileHeight;
var __projectFile;
var __projectFileName;
var __savingFile;

var __jpegOptions = new JPEGSaveOptions();
__jpegOptions.quality = 10;

var __tiffOptions = new TiffSaveOptions();
__tiffOptions.byteOrder = ByteOrder.IBM;
__tiffOptions.layerCompression = LayerCompression.RLE;
__tiffOptions.imageCompression = TIFFEncoding.TIFFLZW;




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
*	@param null
*	@returns null
*/
function disableRun (msg) {
    __canContinue = false; 
    __alertMessage = msg;
}


/**
*	replaceAll 
*	@param null
*	@returns null
*/
function replaceAll (target, search, replacement) {
    return target.split(search).join(replacement);
};


/**
*	checkIfLayerExists
*	@param layerName
*	@returns true/false
*/
function checkIfLayerExists (layerName) {
    var doesLayerExist = false;
    for (var i = 0; i < app.activeDocument.artLayers.length; i++) {
        if (app.activeDocument.artLayers[i].name == layerName) {
            doesLayerExist = true;
        }
    }
    return doesLayerExist;
}


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
*	setSelection_Action - listener generated jsx
*	@param null
*	@returns null
*/
function setSelection_Action () {
    
    var idsetd = charIDToTypeID( "setd" );
    var desc1 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var ref1 = new ActionReference();
    var idChnl = charIDToTypeID( "Chnl" );
    var idfsel = charIDToTypeID( "fsel" );
    ref1.putProperty( idChnl, idfsel );
    desc1.putReference( idnull, ref1 );
    var idT = charIDToTypeID( "T   " );
    var idOrdn = charIDToTypeID( "Ordn" );
    var idAl = charIDToTypeID( "Al  " );
    desc1.putEnumerated( idT, idOrdn, idAl );
    executeAction( idsetd, desc1, DialogModes.NO );

    var idsetd = charIDToTypeID( "setd" );
    var desc2 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var ref2 = new ActionReference();
    var idChnl = charIDToTypeID( "Chnl" );
    var idfsel = charIDToTypeID( "fsel" );
    ref2.putProperty( idChnl, idfsel );
    desc2.putReference( idnull, ref2 );
    var idT = charIDToTypeID( "T   " );
    var ref3 = new ActionReference();
    var idChnl = charIDToTypeID( "Chnl" );
    var idChnl = charIDToTypeID( "Chnl" );
    var idMsk = charIDToTypeID( "Msk " );
    ref3.putEnumerated( idChnl, idChnl, idMsk );
    desc2.putReference( idT, ref3 );
    executeAction( idsetd, desc2, DialogModes.NO );
    
}




/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	RUN METHODS
* 
* -------------------------------------------------------------------------------------------------------------------------------*/

/**
*	docCheck
*	@param null
*	@returns null
*/
function docCheck() {
    if (app.documents.length == 0) {
        disableRun("There are no documents open.");
    }
}


/**
*	getJobCode - checks for something like COX084
*	@param null
*	@returns null
*/
function getJobCode () {
    
    var jobCode = __projectFileName.substring(0, 6);
    var re = new RegExp('^[a-zA-Z]{3}[0-9]{3}$');
    if (re.test(jobCode)) {
        __currJobCode = jobCode;
    } else {
        disableRun("Error: This file doesn't appear to start with a job code?");
    }

}


/**
*	getViewCode - checks for something like V02
*	@param null
*	@returns null
*/
function getViewCode () {

    var hasViewCode = false;
    var currentFileNameSplit = __projectFileName.split(" ");
    if (currentFileNameSplit.length >= 2) { 
        for (var i = 0; i < currentFileNameSplit.length; i++) { //loop through every space segment
            var fileNameSection = currentFileNameSplit[i];   
            if (fileNameSection.substring(0, 1) == "V") {
                if (!isNaN(Number(fileNameSection.substring(1, 2)))) { //check if the second character is a number
                    hasViewCode = true;
                    __currViewCode = fileNameSection;
                    __canContinue = true;
                }
            }
        }
    } 

    __jobCodeToViewCode = __projectFileName.substring(0, ( __projectFileName.indexOf(__currViewCode) + __currViewCode.length ) ); //start of the file until the end of view Code, say "COX084 Roma V01A"

    if (!hasViewCode) {
        disableRun("Error: This file doesn't appear to contain a view code?");
    }

}


/**
*	getJobName
*	@param null
*	@returns null
*/
function getJobName () {

    var hasMatch = false;
    var matchCount = 0;
    var jobsFolder = Folder("G:/Project/");
    var jobsFolderList = jobsFolder.getFiles(); 
    for (var i = 0; i < jobsFolderList.length; i++){  
        var currentFolderName = Folder(jobsFolderList[i]).name;
        if (currentFolderName.substring(0, 6) == __currJobCode) {
            __currJobName = currentFolderName;
            hasMatch = true;
            matchCount++;
        }
    }

    if (!hasMatch) {
        disableRun("Error: Unable to find a matching Job Code for " + __currJobCode + " within G:/Project/");
    } else if (matchCount > 1) {
        specifyJobFolderFromPath();
    }

}

/**
*	specifyJobFolder - updated to use the photoshop file path
*	@param null
*	@returns null
*/
function specifyJobFolderFromPath () {

    try {
        var fileDir = app.activeDocument.path.fsName;
        var foldersSplit = fileDir.split("\\");
        var jobFolder = foldersSplit[2];
        
        __currJobName = jobFolder;
    } catch (error) {
        disableRun("No job folder?");
    }

}

/**
*	specifyJobFolder
*	@param null
*	@returns null
*/
function specifyJobFolder () {

    try {
        var jobFolder = Folder("G:/Project/" + __currJobName).selectDlg("Multiple " + __currJobCode + " folders have been found. Please select the correct folder:");
    } catch (error) {
        disableRun("No job folder selected.");
    }

    if (jobFolder) {
        jobFolder = jobFolder.toString();
        __currJobName = jobFolder.substring(jobFolder.lastIndexOf("/")+1, jobFolder.length);
        
    } else {
        disableRun("No job folder selected.");
    }

}


/**
*	checkJobName
*	@param null
*	@returns null
*/
function checkJobName () {

    var jobCode = __currJobName.substring(0, 6);
    var re = new RegExp('^[a-zA-Z]{3}[0-9]{3}$');
    if (!re.test(jobCode)) {
        disableRun("Error: This folder doesn't appear to start with a job code?");
    } 

}



/**
*	saveJpgAndTiffInOutputFolder
*	@param null
*	@returns null
*/
function saveJpgAndTiffInOutputFolder () {

    var outputFolder;
    var imagesFolder = Folder("G:/Project/_Output/" + __currJobName + "/Images/");
    if (imagesFolder.exists) {
        outputFolder = getFolder("G:/Project/_Output/" + __currJobName + "/Images/");
    } else {
        outputFolder = getFolder("G:/Project/_Output/" + __currJobName + "/");
    }

    var currFileName = __projectFile.name;   
    currFileName = currFileName.substr(0, currFileName.length-4);

    if (checkIfLayerExists("IMAGE EXTENT")) { //save out considering the image extent
                    
        __projectFile.activeLayer = __projectFile.artLayers.getByName("IMAGE EXTENT");
        __projectFile.artLayers.getByName("IMAGE EXTENT").visible = false;
        if (checkIfLayerExists("draft")) {
            __projectFile.artLayers.getByName("draft").visible = false;       
        }
        setSelection_Action();    
        
        try { //if there's a  mask applied, ensure it's used
            __fileWidth = __projectFile.selection.bounds[2].value - __projectFile.selection.bounds[0].value; 
            __fileHeight = __projectFile.selection.bounds[3].value - __projectFile.selection.bounds[1].value;  
            var hasImageExtentSelection = true;
        } catch (error) { //otherwise there's an image extent layer, but it's not being used 
            var hasImageExtentSelection = false;
        }
        
        if (hasImageExtentSelection) {
            __projectFile.selection.copy(true);   
        } else {
            __projectFile.selection.deselect();  
            __projectFile.selection.selectAll();    
            __projectFile.selection.copy(true);
            __fileWidth = __projectFile.selection.bounds[2].value - __projectFile.selection.bounds[0].value; 
            __fileHeight = __projectFile.selection.bounds[3].value - __projectFile.selection.bounds[1].value; 
        }
        
    } else { //otherwise just save out without the draft text if it exists
        
        if (checkIfLayerExists("draft")) {
            __projectFile.artLayers.getByName("draft").visible = false;   
        }
        __projectFile.selection.selectAll();   
        if (__projectFile.artLayers.length > 1) { //copy all layers merged
            __projectFile.selection.copy(true);
        } else {
            __projectFile.selection.copy();
        }
        __fileWidth = __projectFile.selection.bounds[2].value - __projectFile.selection.bounds[0].value; 
        __fileHeight = __projectFile.selection.bounds[3].value - __projectFile.selection.bounds[1].value; 
        
    }

    __savingFile = app.documents.add(__fileWidth, __fileHeight, 300, "_temp");
    __savingFile.info.author = "Scharp";
    __savingFile.info.copyrighted = CopyrightedType.COPYRIGHTEDWORK;
    __savingFile.info.copyrightNotice = "Scharp"; 
    __savingFile.paste();
    __savingFile.flatten();
    __savingFile.saveAs(File(outputFolder + "/" + currFileName +  ".tif"), __tiffOptions);               
    __savingFile.saveAs(File(outputFolder + "/" + currFileName + ".jpg"),  __jpegOptions, true);            
    
    app.activeDocument = __projectFile;
    __projectFile.selection.deselect();

}


/**
*	archiveOlderDraftFiles
*	@param null
*	@returns null
*/
function archiveOlderDraftFiles () {

    if (checkIfLayerExists("draft")) { //copy in the draft layer otherwise just output without

        var draftOutputFolder = getFolder("G:/Project/" + __currJobName + "/Images/_Drafts/");

        var oldDraftsOutputFolder = getFolder("G:/Project/" + __currJobName + "/Images/_Drafts/Old/");

        var draftOutputFolderFileList = draftOutputFolder.getFiles();  

        var currentFile;
        var currentFileName;
        var currentFileRef;
        var projectFileNameWithoutExt = __projectFileName; 
        projectFileNameWithoutExt = projectFileNameWithoutExt.substr(0, projectFileNameWithoutExt.length-4); //cut off the .psd
        var jobCodeToViewCodeNoSpaces = replaceAll(projectFileNameWithoutExt, " ", "%20"); //spaces are referenced with "%20" instead
        jobCodeToViewCodeNoSpaces = jobCodeToViewCodeNoSpaces + "_";
        for (var i = 0; i < draftOutputFolderFileList.length; i++){  
            currentFile = File(draftOutputFolderFileList[i]);
            currentFileName = String(currentFile.name);
            if (currentFileName.indexOf(jobCodeToViewCodeNoSpaces) != -1) { //if the file includes say, 'COX084 Roma V01' move into the 'Old' folder
                var currentFileRef = new File("G:/Project/" + __currJobName + "/Images/_Drafts/" + currentFileName);
                currentFileRef.copy("G:/Project/" + __currJobName + "/Images/_Drafts/Old/" + currentFileName);
                currentFileRef.remove();
            }
        }

    }

}


/**
*	saveNewDraftJpg
*	@param null
*	@returns null
*/
function saveNewDraftJpg () {

    if (checkIfLayerExists("draft")) { //copy in the draft layer 
       
        var draftOutputFolder = getFolder("G:/Project/" + __currJobName + "/Images/_Drafts/");
   
        var projectFileNameWithoutExt = __projectFileName; 
        projectFileNameWithoutExt = projectFileNameWithoutExt.substr(0, projectFileNameWithoutExt.length-4); //cut off the .psd

        __projectFile.activeLayer = __projectFile.artLayers.getByName("draft");
        __projectFile.activeLayer.visible = true;
        var draftLayerOpacity = Math.round(__projectFile.activeLayer.opacity);
        __projectFile.selection.selectAll();    
        
        var isDraftCopied = false;
        try {
            __projectFile.selection.copy();      
            isDraftCopied = true;
        } catch (error) {
            isDraftCopied = false;
        }; 
       
        app.activeDocument = __savingFile;
        
        if (isDraftCopied) {
           
            __savingFile.paste(); //paste in draft layer
            __savingFile.activeLayer.name = "draft";   
            var draftLayer = __savingFile.artLayers.getByName("draft");
            var draftLayerWidth = draftLayer.bounds[2].value - draftLayer.bounds[0].value;
            var draftLayerHeight = draftLayer.bounds[3].value - draftLayer.bounds[1].value;
        
            var xTarget = __savingFile.width - draftLayerWidth - draftLayer.bounds[0].value; //docWidth - layerWidth - layerXPos
            var yTarget = __savingFile.height - draftLayerHeight - draftLayer.bounds[1].value; //docHeight - layerHeight - layerYPos
            draftLayer.translate(xTarget, yTarget); //move the layer to the bottom right corner
            draftLayer.opacity = draftLayerOpacity;
        
        }

        app.activeDocument = __savingFile;
        __jpegOptions.quality = 8;
        __savingFile.resizeImage(__savingFile.width/2, __savingFile.height/2, 300, ResampleMethod.BILINEAR);   
        __savingFile.saveAs(File(draftOutputFolder + "/" + projectFileNameWithoutExt + "_DRAFT_" + getDateStamp() + ".jpg"), __jpegOptions, true);   
        __savingFile.close(SaveOptions.DONOTSAVECHANGES);  

        app.activeDocument = __projectFile;
        __projectFile.selection.deselect();
        __projectFile.save();

    } else { //otherwise don't output into drafts as it's considered final

        app.activeDocument = __savingFile;
        __savingFile.close(SaveOptions.DONOTSAVECHANGES);  
        
        app.activeDocument = __projectFile;
        __projectFile.selection.deselect();
        __projectFile.save();

        __alertMessage =  "Files successfully outputted. As there was no draft layer, no updates have been made within the Images/_Drafts folder.";

    }

}




/*---------------------------------------------------------------------------------------------------------------------------------
* 
* 	RUN OPERATION
* 
* -------------------------------------------------------------------------------------------------------------------------------*/

/**
*	run
*	@param null
*	@returns null
*/
function run () {

    docCheck();

    if (__canContinue) {
        __projectFile = app.activeDocument;
        __projectFileName = __projectFile.name;
    }

    if (__canContinue) {
        getJobCode();
    }

    if (__canContinue) {
        getViewCode();
    }

    if (__canContinue) {
        getJobName();
    }

    if (__canContinue) {
        checkJobName();
    }

    if (__canContinue) {
        saveJpgAndTiffInOutputFolder();
    }

    if (__canContinue) {
        archiveOlderDraftFiles();
    }

    if (__canContinue) {
        saveNewDraftJpg();
    }

    if (__alertMessage != "Files successfully outputted.") {
        alert(__alertMessage);
    }

}

run();

