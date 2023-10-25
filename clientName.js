const createClientName = (clientName) => {
    let newClientName = clientName
    let expansion;
    let parens;
    let storage;
    let dashSpaces;
    let and;
    const parensRegex = /\((.*?)\)/g
    const expansionRegex = /EXPANSION(\s\d*)?/gi
    const storageRegex = /STORAGE(\s\d*)?/gi
    const dashSpaceRegex = /\s\-\s.*/
    const andRegex = /(&\s.*)|(and\s.*)/gi

    parens = clientName.match(parensRegex)
    expansion = clientName.match(expansionRegex)
    storage = clientName.match(storageRegex)
    dashSpaces = clientName.match(dashSpaceRegex)
    and = clientName.match(andRegex)

    if(parens!==null & dashSpaces!==null) {

    } else if(parens !== null) {
        let parensTermsRemove = []
        if(parens.length > 1) {
            //first remove all parenthesis
            for(let parenTerm of parens) {
                newClientName = newClientName.replace(parenTerm, '').trim()
                parensTermsRemove.push(parenTerm)
            }
            newClientName = formatNameLastFirst(newClientName)
            for(let parenTerm of parens) {
                newClientName = newClientName + ' ' + parenTerm
            }
        } else {
            newClientName = formatNameLastFirst(newClientName.replace(parens[0], '').trim())
            
            if(parens[0].toLowerCase().includes('expansion') && parens[0].includes(' ')) {
                newClientName = newClientName + ' ' + parens[0].substring(1, parens[0].length-1)    
            } else if(parens[0].toLowerCase().includes('storage') && parens[0].includes(' ')) {
                newClientName = newClientName + ' ' + parens[0].substring(1, parens[0].length-1)  
            } else if(parens[0].toLowerCase() === '(expansion)') {
                newClientName = newClientName + ' - Expansion'
            } else if(parens[0].toLowerCase() === '(storage)') {
                newClientName = newClientName + ' - Storage'
            } else {
                newClientName = newClientName.replace(parens[0], '').trim()
                newClientName = newClientName + ' ' + parens[0]
            }
        }
    } else if(dashSpaces !== null){
        let {dashRemoved, formattedName} = removeDash(newClientName)
        if(dashRemoved>1) {
            newClientName = formattedName + ' whoops'
        }
        newClientName = formattedName + '' + dashRemoved[0]
    } else if(expansion !== null) {
        let expansionSpace = /expansion(\s.*)+/gi
        let expansionNoSpace = /expansion$/gi
        let expansionSpaceMatches = newClientName.match(expansionSpace)
        let expansionNoSpaceMatches = newClientName.match(expansionNoSpace)
        if(expansionSpaceMatches !== null && expansionSpaceMatches.length===1) {
            newClientName = newClientName.replace(expansionSpaceMatches[0], '').trim()
            newClientName = formatNameLastFirst(newClientName)
            newClientName = newClientName + ' - ' + expansionSpaceMatches[0]
        } else if(expansionNoSpaceMatches !== null) {
            newClientName = newClientName.replace(expansionNoSpaceMatches[0], '').trim()
            newClientName = formatNameLastFirst(newClientName)
            newClientName = newClientName + ' - Expansion' 
        }
    } else if(storage !== null) {
        let storageSpace = /storage(\s.*)+/gi
        let storageNoSpace = /storage$/gi
        let storageSpaceMatches = newClientName.match(storageSpace)
        let storageNoSpaceMatches = newClientName.match(storageNoSpace)
        if(storageSpaceMatches !== null && storageSpaceMatches.length===1) {
            newClientName = newClientName.replace(storageSpaceMatches[0], '').trim()
            newClientName = formatNameLastFirst(newClientName)
            newClientName = newClientName + ' - ' + storageSpaceMatches[0]
        } else if(storageNoSpaceMatches !== null) {
            newClientName = newClientName.replace(storageNoSpaceMatches[0], '').trim()
            newClientName = formatNameLastFirst(newClientName)
            newClientName = newClientName + ' - Storage' 
        }
    } else if(and !== null){
        newClientName = newClientName.replace(andRegex, '').trim()
        newClientName = formatNameLastFirst(newClientName)

    } else {
        newClientName = formatNameLastFirst(newClientName)
    }

    return newClientName.trim()
}




const removeDash = (clientName) => {
    let dashWithFollowing = /\s-\s.*/g
    let match = clientName.match(dashWithFollowing)
    let newName = formatNameLastFirst(clientName.replace(dashWithFollowing, '').trim())
    return {
        dashRemoved: match,
        formattedName: newName
    }
}


const formatNameLastFirst = (clientName) => {
    const clientNameArray = clientName.split(' ')
    let newClientName = clientNameArray[clientNameArray.length - 1] + ','
    for(let i=0 ; i<clientNameArray.length-1 ; i++) {
        newClientName = newClientName + ` ${clientNameArray[i]}`
    }
    return newClientName
}

module.exports = {
    createClientName
}