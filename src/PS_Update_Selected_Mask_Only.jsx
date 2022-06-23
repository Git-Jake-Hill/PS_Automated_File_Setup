//@include PS_Automated_File_Setup_Module.jsx

specifyJobFolderFromPath(); // needs a file open to work.
getViewNumberAndWidth();
getViewNumber();

var __activeDoc = app.activeDocument;
var selecedLayer = __activeDoc.activeLayer;

if(selecedLayer.typename =='LayerSet'){
    findFoldersWithTags(selecedLayer, false)
    alert("Finshed updating mask: " + selecedLayer.name)
} else {
    alert(selecedLayer.name + " is a layer, please select a folder.")
}