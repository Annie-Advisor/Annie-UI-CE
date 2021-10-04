export function setBranchCategory(data, depth, category, branch, parent, parentsParent, parentsParentsParent) {
    if (depth === 1) {
        data[branch]["category"] = category
    }
    if (depth === 2) {
        data[parent][branch]["category"] = category
    }
    if (depth === 3) {
        data[parentsParent][parent][branch]["category"] = category
    }
    if (depth === 4) {
        data[parentsParentsParent][parentsParent][parent][branch]["category"] = category
    }
}

export function setSupportNeedStatus(hasSupportNeed, data, depth, branch, parent, parentsParent, parentsParentsParent) {
    if (hasSupportNeed) {
        if (depth === 1) {
            delete data[branch]["supportneed"]
            delete data[branch]["category"]
        }
        if (depth === 2) {
            delete data[parent][branch]["supportneed"]
            delete data[parent][branch]["category"]
        }
        if (depth === 3) {
            delete data[parentsParent][parent][branch]["supportneed"]
            delete data[parentsParent][parent][branch]["category"]
        }
        if (depth === 4) {
            delete data[parentsParentsParent][parentsParent][parent][branch]["supportneed"]
            delete data[parentsParentsParent][parentsParent][parent][branch]["category"]
        }
    } else {
        if (depth === 1) {
            data[branch]["supportneed"] = true
            data[branch]["category"] = branch.slice(6)
        }
        if (depth === 2) {
            data[parent][branch]["supportneed"] = true
            data[parent][branch]["category"] = branch.slice(6)
        }
        if (depth === 3) {
            data[parentsParent][parent][branch]["supportneed"] = true
            data[parentsParent][parent][branch]["category"] = branch.slice(6)
        }
        if (depth === 4) {
            data[parentsParentsParent][parentsParent][parent][branch]["supportneed"] = true
            data[parentsParentsParent][parentsParent][parent][branch]["category"] = branch.slice(6)
        }
    }   
}

export function getNameWithAnnieUser(userData, annieuser) {
    const user = userData.filter(e => e.id === annieuser)[0]
    if (!user || !user.meta) {
        return annieuser
    }
    if (user.meta.firstname && user.meta.lastname) {
        return user.meta.firstname + " " + user.meta.lastname
    }
    return annieuser
}

export function getStudentFromContacts(studentId, contactsData) {
    return contactsData.some(contact => contact.id === studentId) ?
        contactsData.find(contact => contact.id === studentId) :
        false
}

export function getStudentName(student, intl) {
    return !student ?
        intl.formatMessage(
            {
                id: 'survey.contacts.unknownRecipient',
                defaultMessage: 'Unknown Contact',
            }) :
        student.contact.firstname && student.contact.lastname ?
            student.contact.firstname + " " + student.contact.lastname :
            student.contact.phonenumber
}