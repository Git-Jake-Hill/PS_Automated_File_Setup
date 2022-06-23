//@include PS_Automated_File_Setup_Module.jsx


var __currentPSDoc;
var __currentPSName;
var __currentViewNumber;
var __sourceLayer;
var __sourceLayerContent;
var __sourceFolderName = null;
var __incrementDraftLetter = false;
var __changeAllDraftLetter = false;
var __viewList = [];
var __fileCompPS;


function getFileName() {
    __currentPSDoc = app.activeDocument;
    __currentPSName = __currentPSDoc.name;
    __currentViewNumber = __currentPSName.substring(7,10);
}


function updateDraftLayerNumber(viewNum) {
    var draftFound = false;

    try {
        __sourceLayer = __currentPSDoc.layers.getByName("draft");
        draftFound = true;
    } catch (error) {
        // TODO: update new draft layer properties to match scharp standard. eg. size, colour, transparency, position.

        // var draftLayer = app.activeDocument.artLayers.add(); 
        // draftLayer.name = "DRAFT";
        // draftLayer.kind = LayerKind.TEXT
        // draftLayer.textItem.contents = viewNum + " DRAFT A";
    }

    if (draftFound) {
        __sourceLayerContent = __sourceLayer.textItem.contents;
        __sourceLayer.textItem.contents = viewNum + __sourceLayerContent.substring(3,);
        
    } else {
        __sourceLayer = draftLayer;
        __sourceLayerContent = __sourceLayer.textItem.contents;
    }
    
}


function incrementDraftLetter() {
    var currentDraftLetter = __sourceLayerContent.slice(-1);
    var newDraftLetter = String.fromCharCode(currentDraftLetter.charCodeAt(0) + 1);
    
    __sourceLayer.textItem.contents = __sourceLayerContent.slice(0,-1) + newDraftLetter;
}


function setDraftLetter(letterInput) {
    var draftFound = false;
    letterInput = letterInput.toUpperCase();
    var re = letterInput.match(/[A-Z]/);

    try {
        getFileName()
        __sourceLayer = __currentPSDoc.layers.getByName("draft");
        __sourceLayerContent = __sourceLayer.textItem.contents;
        draftFound = true;
    } catch (error) {
        // alert("error selecting draft layer")
    }
    
    if (draftFound) {
        if (letterInput == "ADD") {

            incrementDraftLetter();

        } else if (letterInput == "NO") {

            // dont change draft letter

        } else {

            if (letterInput.length != 1 | re == null) {

                alert(letterInput + " is not a valid draft letter.");

            } else {

                __sourceLayer.textItem.contents = __sourceLayerContent.slice(0,-1) + letterInput;

            }
        }
    }

    
}


function runUpdateDraft () {

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
        var letterInput = prompt("Change draft letter? \n \"ADD\" to increment by one.\n \"NO\" to keep current draft letter.", "C");
        var outputDraft = confirm("Output drafts as well?");
        if (letterInput) {
            for (var index = 0; index < __viewList.length; index++) {
                var viewNum = __viewList[index];
                var compPsdFile = createFileObject(viewNum,"COMP");
                
                __compFileFound = checkIfFileExists(compPsdFile); // check if Files Exists

                if (__compFileFound) {
                    openFile(compPsdFile);
                    setDraftLetter(letterInput);
                    updateDraftLayerNumber(viewNum)
                    if (outputDraft) {
                        // outputDraftRun();
                        app.doAction("Update_and_Output_Draft","JH - Tools.ATN");
                        __activeDoc.close();
                    } else {
                        saveAndClose(compPsdFile);
                    }
                    

                } else {

                    alert( viewNum + " psd file missing!");
                }
            }

        } else {

            disableRun("No input.");
        }
    }

    alert(__alertMessage);
}

runUpdateDraft();