# Google-Drive-Zoho-Intergration

This project copies a template folder in google drive to a new location and renames it. The workflow used is as follows:

- A webhook that executes when some action in Zoho occurs triggers the function
- The function is a Google cloud function (with sufficient timeout allocated)
- The function creates the new copy of the template in the correct location using the Google drive API
- The function sends the link to the new Google drive resource back to a Zoho standalone API function
- The Zoho standalone function updates the corresponding record with the link to the new Google drive resource 
