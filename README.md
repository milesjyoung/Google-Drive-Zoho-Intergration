# Google-Drive-Zoho-Intergration

This project copies a template folder in google drive to a new location and renames it. The workflow used is as follows:

- A webhook that executes when some action in Zoho occurs triggers the function
- The function is a Google cloud function (with sufficient timeout allocated)
- The function creates the new copy of the template in the correct location using the Google drive API
- The function sends the link to the new Google drive resource back to a Zoho standalone API function
- The Zoho standalone function updates the corresponding record with the link to the new Google drive resource 



## Setup Steps

Setup api gateway and create a key
Make sure api gateway service account has invoker for the cloud function:
-give it invoker role (cloud FUNCTIONS invoker) in the cloud function
-go to cloud RUN service separately and give that same service account “cloud RUN invoker”

Now the API requests should be going through

Setup 

Create service account
Create key
Enable domain wide delegation


Create cloud function (add hmac secret to env)
	replace template folder id (and commercial)
	update package.json
	update “postData” url
	remember key.json

Copy trigger for cloud function and add to yaml api config

Create api gateway

Add cloud run invoker role to service account (DWD account)

Google takes a long time to propagate, it will never show up in library...to enable api run “ gcloud services enable <managed service name>

Go to credentials create api key (copy for now:<key val>)
Restrict API key to API gateway created
(You can whitelist Zoho IPs as well)


Go to Zoho
Create HMAC secret and API key secret (can we restrict these)

Create Zoho function(String zohoID,String salespersonName,String clientName,String type)
Remember to update URL in webhook code

Create workflow rule
We want to map zohoID=opID, salespersonName=spa, clientName=opName, type=resi/commercial