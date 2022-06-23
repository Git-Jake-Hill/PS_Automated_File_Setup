//@include PS_automated_file_setup_module.jsx

// get info from text files
// ---------------------------
// used for specific folder

// var user_name = "jacob" // manual add username
user_name = $.getenv("USERNAME");
// alert($.getenv("USERNAME"));
var confirmUsername = confirm("is this you? " + user_name );
if (confirmUsername) {
    
    var folderRenderList = new Folder("G:/Temp/JH/Scripts/Photoshop_Render_List/" + user_name);
    // var processedFolder = new Folder("G:/Temp/JH/Scripts/Photoshop_Render_List/" + user_name + "/_Processed")
    var pathProcessed = "G:/Temp/JH/Scripts/Photoshop_Render_List/" + user_name + "/_Processed/";
    var pathAlerts = "G:/Temp/JH/Scripts/Photoshop_Render_List/" + user_name + "/_Alerts/";
    var textFileList = folderRenderList.getFiles();


    function runSetup(file) {
        var returnLog;
        var fileContent;
        var textFilePath = file.fsName.toString();
        var textFileName = textFilePath.substring(textFilePath.lastIndexOf("\\") + 1);
        // file.encoding = 'UTF8'; 
        file.open("r");
        fileContent = file.read();
        file.close();
        // alert("Run file " + fileContent)
        returnLog = run(false, fileContent); // run photoshop_setup_or_update script

        file.copy(pathProcessed + textFileName); // move to processed folder and remove original
        file.remove();
        fileContent = "";
        
        var outFileName = textFileName.substring(0, textFileName.indexOf("-"))
        var outFile = new File(pathAlerts + "/" + outFileName + ".txt");
        outFile.open("w");
        outFile.writeln(returnLog);
        outFile.close();
        
    }

    for (var index = 0; index < textFileList.length; index++) {
        
        if(textFileList[index] instanceof File) {
            var file = textFileList[index];
            runSetup(file);
        }
    }

} else {
    alert("Exiting, as this would alter other users images.");
}




