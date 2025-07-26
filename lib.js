const axios = require('axios').default;
const FormData = require('form-data');

const search = async (driveService, parentFolder) => {
    try {
        const res = await driveService.files.list({
            pageSize: 20,
            q: `"${parentFolder}" in parents and trashed = false`,
            fields: 'files(id, name, mimeType)'
        })
        return res?.data || null
    } catch (error) {
        return null
    }
}

const searchName = async (driveService, parentFolder, clientName) => {
    try {
        const res = await driveService.files.list({
            pageSize: 20,
            q: `"${parentFolder}" in parents and name="${clientName}"and mimeType="application/vnd.google-apps.folder" and trashed = false`,
            fields: 'files(id, name, mimeType)'
        })
        return res?.data || null
    } catch (error) {
        return null
    }
}

const searchFoundFolder = async (driveService, parentFolder) => {
    try {
        const res = await driveService.files.list({
            pageSize: 20,
            q: `"${parentFolder}" in parents and mimeType="application/vnd.google-apps.folder" and trashed = false`,
            fields: 'files(id, name, mimeType)'
        })        
        return res?.data || null
    } catch (error) {
        return null
    }
}

const createRoot = async (driveService, clientName, newFolderLocation) => {
    let fileMetadata = {
        'name': clientName,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [newFolderLocation]
    }
    try {
        const file = await driveService.files.create({
            resource: fileMetadata,
            fields: 'id'
        })
        return file?.data?.id || null
    } catch (error) {
        return null
    }
}

const copy = async (driveService, copyContentId, contentNewName, root) => {
    let fileMetadata = {
        'name': contentNewName,
        'parents': [root]
    };
    try {
        const file = await driveService.files.copy({
            'fileId': copyContentId,
            'resource': fileMetadata
        })
        return file?.data?.id || null
    } catch (error) {
        return null
    }
}

const create = async (driveService, contentNewName, root) => {
    let fileMetadata = {
        'name': contentNewName,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [root]
    }
    try {
        const file = await driveService.files.create({
            resource: fileMetadata,
            fields: 'id'
        })
        return file?.data?.id || null
    } catch (error) {
        return null
    }
}

async function recursive(driveService, startSearch, rootFolder, clientName) {
    let children = await search(driveService, startSearch);
    if (children.files.length > 0) {
        for (let element of children.files) {
            if (element.mimeType === 'application/vnd.google-apps.folder') {
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
    for (i = 1; i < (clientNameArray.length - 2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}
function clientNameSetWithoutStorage(clientName) {
    let clientNameArray = clientName.split(' ');
    let clientNameNew = clientNameArray[0];
    for (i = 1; i < (clientNameArray.length - 2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}



//update with new zoho API link
//Double check the beginning of the link sent back as the drive folder link
async function postData(zohoLeadID, root, clientFolderName) {
    var form = new FormData();
    form.append("arguments", JSON.stringify({ "ID": `${zohoLeadID}`, "folderNumber": `https://drive.google.com/drive/folders/${root}`, "clientFolderName": clientFolderName }));
    const axiosRes = await axios.post(
        'https://www.zohoapis.com/crm/v2/functions/npaautomation/actions/execute?auth_type=apikey&zapikey=key', form, { headers: form.getHeaders() }
    );
}

module.exports = {
    recursive,
    searchName,
    createRoot,
    postData,
    clientNameSetWithoutExpansion,
    clientNameSetWithoutStorage
}