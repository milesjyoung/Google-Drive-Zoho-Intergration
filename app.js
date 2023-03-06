const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const axios = require('axios').default;
const FormData = require('form-data');
//Rob and nick are both commercial opps folder
//check chuck, ellis and michael, 'resource key' in url can't tell what the folder id is
const salesmanFolders = {
    Chuck: '0B_1drI8OeaN0YVpOeGZSVW9yZTA',
    Rob: '1K5_ZBotnIomaHlxGuc0QbwUKm1DyNIoL',
    Ellis: '0BwvLujdXdtkRQzUtaG9LYlI2MzA',
    Lindsey: '1P6QYkS553Eh8MfDAXeLoh-K1YtIexOIu',
    Michael: '0Bw8XszLlsKV8V1dHXzk1anBqRUU',
    Michelle: '1uF7xv8G6R22MzD8Q1F8A49y6S4CosE96',
    Miles: '1sf8RJQwfdMX0NqT7MkivBUafRwFgcN2u',
    Nick: '1otvNaoDquTJcetrSD72YSDgNcRsQC7yi',
    Sierra: '1CBqCkMdMWjKYICFElSji9uy2AACvCv0d',
    Travis: '1qCfjDG0s8_sLrJZXQ52rJT3qcBnWxzvc',
    Commercial: '1K5_ZBotnIomaHlxGuc0QbwUKm1DyNIoL'
};
//START_SEARCH needs to be the make a copy client folder will work regardless of content changes
let START_SEARCH = '0Bw8XszLlsKV8WDN3NXZISzkwajA';

let changeStartSearchCommercial = '1G6bW3i5Q9_b-twK3kxYoETZMX8rSGqSf';


function getSalesmanFolder(salesman) {
    if(salesman.includes('Sierra')) {
        return salesmanFolders.Sierra;
    } else if(salesman.includes('Ellis')) {
        return salesmanFolders.Ellis;
    } else if(salesman.includes('Travis')) {
        return salesmanFolders.Travis;
    } else if(salesman.includes('Lindsey')) {
        return salesmanFolders.Lindsey;
    } else if(salesman.includes('Michelle')) {
        return salesmanFolders.Michelle;
    } else if(salesman.includes('Nick')) {
        return salesmanFolders.Nick;
    } else if(salesman.includes('Michael')) {
        return salesmanFolders.Michael;
    } else if(salesman.includes('Rob')) {
        START_SEARCH = changeStartSearchCommercial;
        return salesmanFolders.Rob;
    } else if(salesman.includes('Chuck')) {
        return salesmanFolders.Chuck;
    } else if(salesman.includes('Miles')) {
        return salesmanFolders.Miles;
    } else {
        return salesmanFolders.Miles;
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

function setNameFinal(clientName) {
    let clientNameLow = clientName.toLowerCase();
    if(clientNameLow.includes('- expansion') || clientNameLow.includes('- exp')) {
        return setNameExpansionEnd(clientName);
    } else if(clientNameLow.includes('expansion -') || clientNameLow.includes('exp -')) {
        return setNameExpansionBeginning(clientName)
    } else if(clientNameLow.includes(' expansion') || clientNameLow.includes(' exp')) {
        return setNameExpansionEndNoDash(clientName);
    } else if(clientNameLow.includes('expansion ') || clientNameLow.includes('exp ')) {
        return setNameExpansionBeginningNoDash(clientName);
    } else if(clientNameLow.includes('- storage')) {
        return setNameDashStorage(clientName);
    } else if(clientNameLow.includes(' storage')) {
        return setNameStorage(clientName);
    } else if(clientNameLow.includes('storage -')) {
        return setNameStorageBeginningDash(clientName);
    } else if(clientNameLow.includes('storage')) {
        return setNameStorageBeginning(clientName);   
    } else {
        return setName(clientName);
    }
}
function setName(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`;
    for(let i=0; i < (clientNameArray.length - 1); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}
function setNameExpansionEnd(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 3]},`;
    for(let i=0; i < (clientNameArray.length - 3); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;
}
function setNameExpansionBeginning(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`
    for(let i=2; i < (clientNameArray.length - 1); i++){
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;
}
function setNameExpansionEndNoDash(clientName){
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 2]},`;
    for(let i=0; i < (clientNameArray.length - 2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;

}
function setNameExpansionBeginningNoDash(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`
    for(let i=1; i < (clientNameArray.length - 1); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;
}
function clientNameSetWithoutExpansion(clientName) {
    let clientNameArray = clientName.split(' ');
    let clientNameNew = clientNameArray[0];
    for(i=1; i < (clientNameArray.length-2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}
function setNameStorage(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 2]},`;
    for(let i=0; i < (clientNameArray.length - 2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Storage';
    return clientNameNew;
}
function setNameDashStorage(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 3]},`;
    for(i=0; i < (clientNameArray.length - 3); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Storage';
    return clientNameNew;
}
function setNameStorageBeginning(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`
    for(let i=1; i < (clientNameArray.length - 1); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Storage';
    return clientNameNew;
}
function setNameStorageBeginningDash(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`
    for(let i=2; i < (clientNameArray.length - 1); i++){
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Storage';
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




//update with new zoho API link
//Double check the beginning of the link sent back as the drive folder link
async function postData(zohoLeadID, root) {
    var form = new FormData();
    form.append("arguments", JSON.stringify({"ID":`${zohoLeadID}`, "folderNumber": `https://drive.google.com/drive/folders/${root}`}));
    const axiosRes = await axios.post(
        'https://www.zohoapis.com/crm/v2/functions/npaautomation/actions/execute?auth_type=apikey&zapikey=1003.f956ca6251843e8928f8b65fc626d49f.90086e4d1fb79e66cd8c521df80ffe94', form, {headers: form.getHeaders()}
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
            clientName = setNameFinal(stringName); 
        } else {
            clientName = stringName;
            salesman = salesmanFolders.Commercial
            START_SEARCH = changeStartSearchCommercial
        }
        const google = await authorize();
        console.log('NOW QUERRY FOR FOLDER INITIAL')
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