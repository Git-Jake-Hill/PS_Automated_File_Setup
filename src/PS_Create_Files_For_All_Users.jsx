//@include PS_automated_file_setup_module.jsx

// get info from text files
// ---------------------------
var pathProcessed = "G:/Temp/JH/Scripts/Photoshop_Render_List/_old/";
var rootUserFolders = new Folder("G:/Temp/JH/Scripts/Photoshop_Render_List");
var userFoldersList = rootUserFolders.getFiles();
var testString = "";
var confirmUsername = confirm("Are you sure? This will create files for all users?");

function runSetup(file) {
    var textFilePath = file.fsName.toString();
    var textFileName = textFilePath.substring(textFilePath.lastIndexOf("\\") + 1);
    // file.encoding = 'UTF8'; 
    file.open("r");
    var fileContent = file.read();
    file.close();

    run(false, fileContent); // run photoshop_setup_or_update script

    file.copy(pathProcessed + textFileName); // move to processed folder and remove original
    file.remove();
    fileContent = "";
}


if (confirmUsername) {

    for (var index = 0; index < userFoldersList.length; index++) {
        var currUserFolder = userFoldersList[index]
        // alert(currUserFolder)
        var currFolderPath = currUserFolder.fsName.toString()
        var folderName = currFolderPath.substring(currFolderPath.lastIndexOf("\\") + 1);
        testString += userFoldersList[index] + "\n";
        
        
        if (folderName != "_old") {
            // alert(folderName)
            var textFileList = currUserFolder.getFiles();
            // alert(textFileList)

            for (var j = 0; j < textFileList.length; j++) {
                
                if(textFileList[j] instanceof File) {
                    var file = textFileList[j];
                    // alert("file found")
                    runSetup(file);
                }
            }  
        }    
        
    }
}






// ------------------------------------------------------------------------------------
// used for specific folder

// var user_name = "jacob"
// var folderRenderList = new Folder("G:/Temp/JH/Scripts/Photoshop_Render_List/" + user_name);
// var pathProcessed = "G:/Temp/JH/Scripts/Photoshop_Render_List/_Processed/";
// var textFileList = folderRenderList.getFiles();

// for (var index = 0; index < textFileList.length; index++) {
    
//     if(textFileList[index] instanceof File) {
//         var file = textFileList[index];
//         runSetup(file);
//     }
// }


