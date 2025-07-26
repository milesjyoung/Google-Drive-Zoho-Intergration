const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const {createClientName} = require('./clientName.js')
const salesFolders = require('./salesFolders.js')

const {
    recursive,
    searchName,
    createRoot,
    postData,
    clientNameSetWithoutExpansion,
    clientNameSetWithoutStorage
} = require("./lib.js")

const {computeHash} = require("./decrypt.js")

let TEMPLATE_FOLDER = 'update me!';
let TEMPLATE_FOLDER_COMMERCIAL = 'update me!';
const KEY_FILE = "./key.json"

exports.main = async (req, res) => {
    try {
        let signature = req.headers['signature']?.split(' ')[1];
        const params = new URLSearchParams(req.body);
        let zohoLeadID = params.get('zohoID');
        let salesRepName = params.get('salespersonName');
        let stringName = params.get('clientName');
        let commercialParam = params.get('type')
        let commercial = commercialParam.toUpperCase().includes('COMMERCIAL') ? true : false
        // verify signature
        if(!signature) {
            throw new Error("No signature provided in request")
        }
        const concat = zohoLeadID + "|" + salesRepName + "|" + stringName + "|" + commercialParam
        const hash = computeHash(concat)
        if(signature !== hash) {
            throw new Error("Incorrect signature provided")
        }
        // setting location of copied folder
        let salesFolder = salesFolders[salesRepName]["folder"] || salesFolders["default"]["folder"]
        let salesRepEmail = salesFolders[salesRepName]["email"] || salesFolders["default"]["email"]
        // setting the name to replace target file names with
        let clientName;
        if (!commercial) {
            clientName = createClientName(stringName);
        } else {
            clientName = stringName;
            salesFolder = salesFolders["Commercial"]["folder"]
            TEMPLATE_FOLDER = TEMPLATE_FOLDER_COMMERCIAL
        }
        
        // Create a JWT client using the extracted credentials
        const auth = new google.auth.JWT({
            keyFile: KEY_FILE,
            scopes: SCOPES,
            subject: salesRepEmail,
        });
        const driveClient = google.drive({ version: "v3", auth })

        let folderQueryResult = await searchName(driveClient, salesFolder, clientName);
        if(!folderQueryResult) {
            throw new Error("query for a folder threw error")
        }
        if (folderQueryResult.files.length <= 0) {
            if (clientName.includes('- Expansion') || clientName.includes('- Storage')) {
                let clientNameWithout;
                if(clientName.includes('- Expansion')) {
                    clientNameWithout = clientNameSetWithoutExpansion(clientName);
                } else {
                    clientNameWithout = clientNameSetWithoutStorage(clientName);
                }
                let folderQuery = await searchName(driveClient, salesFolder, clientNameWithout);
                if(!folderQuery) {
                    throw new Error("folder query expansion threw error")
                }
                if (folderQuery.files.length <= 0) {
                    let root = await createRoot(driveClient, clientName, salesFolder);
                    if(!root) {
                        throw new Error("error creating root")
                    }
                    postData(zohoLeadID, root, clientName);
                    await recursive(driveClient, TEMPLATE_FOLDER, root, clientName);
                } else {
                    let finalSearch = await searchName(driveClient, folderQuery.files[0].id, clientName);
                    if(!finalSearch) {
                        throw new Error("Error in final search")
                    }
                    if (finalSearch.files.length <= 0) {
                        let root = await createRoot(driveClient, clientName, folderQuery.files[0].id);
                        postData(zohoLeadID, root, clientName);
                        await recursive(driveClient, TEMPLATE_FOLDER, root, clientName);
                    }
                }
            } else {
                let root = await createRoot(driveClient, clientName, salesFolder);
                if(!root) {
                    throw new Error("Error creating basic route")
                }
                postData(zohoLeadID, root, clientName);
                await recursive(driveClient, TEMPLATE_FOLDER, root, clientName);
            }

        } else {
            let folderStatus = await searchFoundFolder(driveClient, folderQueryResult.files[0].id);
            if (folderStatus.files.length <= 0) {
                let root = folderQueryResult.files[0].id;
                postData(zohoLeadID, root, clientName);
                await recursive(driveClient, TEMPLATE_FOLDER, root, clientName);
            } else {
                let root = folderQueryResult.files[0].id;
                postData(zohoLeadID, root, clientName);
            }
        }
        res.status(200).send('Success');

    } catch (err) {
        console.log(err);
        res.status(500).send('Failed...');
    }

};