const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const axios = require('axios').default;
const FormData = require('form-data');
const {createClientName} = require('./clientName.js')
//this is the name:key of the folders where you will be creating the client folders
//the ids should be the google drive folder ids of the folders
const salesmanFolders = {
    person1: 'id123',
    person2: 'id234',
    person3: 'id345'
};
//START_SEARCH this needs to be the google drive id of root of the folder tree you want to copy, i.e. your template
let START_SEARCH = 'id123';

//for this project this was an alternative template
let changeStartSearchCommercial = 'id345';

//will set salesman from the webhook info
function getSalesmanFolder(salesman) {
    if(salesman.includes('person1')) {
        return salesmanFolders.person1;
    } else if(salesman.includes('person2')) {
        return salesmanFolders.person2;
    } else {
        return salesmanFolders.person3;
    }

}

function authorize() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'creds.json',
        scopes: SCOPES
    })
    return google.drive({version: 'v3', auth})
}

function search(driveService, parentFolder) {
    return new Promise((resolve, reject) => {
        driveService.files.list({
            pageSize: 20,
            q: `"${parentFolder}" in parents and trashed = false`, 
            fields: 'files(id, name, mimeType)'
        }).then(({data}) => resolve(data))
        .catch(err => reject(err))
    })
}

function searchName(driveService, parentFolder, clientName) {
    return new Promise((resolve, reject) => {
        driveService.files.list({
            pageSize: 20,
            q: `"${parentFolder}" in parents and name="${clientName}"and mimeType="application/vnd.google-apps.folder" and trashed = false`, 
            fields: 'files(id, name, mimeType)'
        }).then(({data}) => resolve(data))
        .catch(err => reject(err))
    })
}

function searchFoundFolder(driveService, parentFolder) {
    return new Promise((resolve, reject) => {
        driveService.files.list({
            pageSize: 20,
            q: `"${parentFolder}" in parents and mimeType="application/vnd.google-apps.folder" and trashed = false`, 
            fields: 'files(id, name, mimeType)'
        }).then(({data}) => resolve(data))
        .catch(err => reject(err))
    })
}

function createRoot(driveService, CLIENT_NAME, NEW_FOLDER_LOCATION) {
    let fileMetadata = {
        'name': CLIENT_NAME,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [NEW_FOLDER_LOCATION]
    }
    return new Promise((resolve, reject) => {
        const file = driveService.files.create({
            resource: fileMetadata,
            fields: 'id'
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })
}

function copy(driveService, copyContentId, contentNewName, root) {
    
    let fileMetadata = {
        'name': contentNewName,
        'parents': [root]
    };
    return new Promise((resolve, reject) => {
        const file = driveService.files.copy({
            'fileId': copyContentId,
            'resource': fileMetadata
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })
}

function create(driveService, contentNewName, root) {
    let fileMetadata = {
        'name': contentNewName,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [root]
    };
    return new Promise((resolve, reject) => {
        const file = driveService.files.create({
            resource: fileMetadata,
            fields: 'id'
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })

}

async function recursive(driveService, startSearch, rootFolder, clientName) {
    let children = await search(driveService, startSearch);
    if(children.files.length > 0) {
        for(let element of children.files) {
            if(element.mimeType === 'application/vnd.google-apps.folder') {
                let name = element.name.replace('Last, First', clientName);
                let folderID = await create(driveService, name, rootFolder);
                await recursive(driveService, element.id, folderID, clientName);
            } else {
            let name = element.name.replace('Last, First', clientName);
            let fileID = await copy(driveService, element.id, name, rootFolder);
            }
        }
    } 
}

//for querying for existing folders
function clientNameSetWithoutExpansion(clientName) {
    let clientNameArray = clientName.split(' ');
    let clientNameNew = clientNameArray[0];
    for(i=1; i < (clientNameArray.length-2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}
function clientNameSetWithoutStorage(clientName) {
    let clientNameArray = clientName.split(' ');
    let clientNameNew = clientNameArray[0];
    for(i=1; i < (clientNameArray.length-2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}


//here we update zoho resource via a standalone api in zoho to add a link to the newly created google drive folder in your corresponding zoho module
//update with your new zoho API link

async function postData(zohoLeadID, root) {
    var form = new FormData();
    form.append("arguments", JSON.stringify({"ID":`${zohoLeadID}`, "folderNumber": `https://drive.google.com/drive/folders/${root}`}));
    const axiosRes = await axios.post(
        'this is the link for zoho api', form, {headers: form.getHeaders()}
    );
}

exports.main = async (req, res) => {

    try {

        const params = new URLSearchParams(req.body);
        let zohoLeadID = params.get('zohoLeadID');
        let salesmanName = params.get('salesman');
        let stringName = params.get('client');
        let commercialParam = params.get('type').toUpperCase()
        let commercial = commercialParam.includes('COMMERCIAL') ? true : false
        console.log(`typestring: ${commercialParam}, commercial value: ${commercial}`)


        let salesman = getSalesmanFolder(salesmanName);

        let clientName;
        if(!commercial){
            clientName = createClientName(stringName); 
        } else {
            clientName = stringName;
            salesman = salesmanFolders.Commercial
            START_SEARCH = changeStartSearchCommercial
        }
        const google = await authorize();
        let folderQueryResult = await searchName(google, salesman, clientName);
        
        if(folderQueryResult.files.length <= 0) {
            if(clientName.includes('- Expansion')) {
                console.log('we see it includes expansion');
                let clientNameWithout = clientNameSetWithoutExpansion(clientName);
                let folderQueryExpansion = await searchName(google, salesman, clientNameWithout);
                console.log(clientNameWithout);
                console.log(folderQueryExpansion.files);
                if(folderQueryExpansion.files.length <= 0) {
                    let root = await createRoot(google, clientName, salesman);
                    postData(zohoLeadID, root);
                    await recursive(google, START_SEARCH, root, clientName);
                } else {
                    let finalSearch = await searchName(google, folderQueryExpansion.files[0].id, clientName);
                    if(finalSearch.files.length <= 0) {
                        let root = await createRoot(google, clientName, folderQueryExpansion.files[0].id);
                        postData(zohoLeadID, root);
                        await recursive(google, START_SEARCH, root, clientName);
                    } else {
                        
                    } 
                }
            } else if(clientName.includes('- Storage')){
                let clientNameWithout = clientNameSetWithoutStorage(clientName);
                let folderQueryStorage = await searchName(google, salesman, clientNameWithout);
            
                if(folderQueryStorage.files.length <= 0) {
                    let root = await createRoot(google, clientName, salesman);
                    postData(zohoLeadID, root);
                    await recursive(google, START_SEARCH, root, clientName);
                } else {
                    let finalSearch = await searchName(google, folderQueryStorage.files[0].id, clientName);
                    if(finalSearch.files.length <= 0) {
                        let root = await createRoot(google, clientName, folderQueryStorage.files[0].id);
                        postData(zohoLeadID, root);
                        await recursive(google, START_SEARCH, root, clientName);
                    } else {
                        
                    }
                }
            } else {
                let root = await createRoot(google, clientName, salesman);
                postData(zohoLeadID, root);
                await recursive(google, START_SEARCH, root, clientName);
            }

        } else {
            let folderStatus = await searchFoundFolder(google, folderQueryResult.files[0].id);
            if(folderStatus.files.length <= 0) {
                let root = folderQueryResult.files[0].id;
                postData(zohoLeadID, root);
                await recursive(google, START_SEARCH, root, clientName);
            } else {
                let root = folderQueryResult.files[0].id;
                postData(zohoLeadID, root);
            }
        }
      
        res.status(200).send('Success');

    } catch (err) {
      console.log(err);
      res.status(500).send('Failed...');
    }

};