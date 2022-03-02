import {useEffect, useState} from "react";

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

export function nextBranchName(branches, parent) {
    let branchName
    const firstInBranch = branches.length < 1
    if (firstInBranch) {
        if (parent) {
            branchName = parent+"1"
        } else {
            branchName = "branchA"
        }
    } else {
        const endInNumberRegex = new RegExp(/\d+$/)
        const otherBranchesEndInNumber = branches.some(branch => endInNumberRegex.test(branch))
        if (otherBranchesEndInNumber) {
            // Check branches for highest number
            let endNumbers = []
            for (let i = 0; i < branches.length; i++ ) {
                const endNumber = branches[i].match(/\d+$/)
                if (endNumber) {
                    endNumbers.push(parseInt(endNumber[0], 10))
                }
            }
            const highestNumber = Math.max(...endNumbers)
            const lastBranch = branches.filter(branch => branch.endsWith(highestNumber))
            const endNumberLength = highestNumber.toString().length
            const lastBranchBody = lastBranch[0].slice(0, -endNumberLength)
            const nextNumber = highestNumber + 1
            branchName = lastBranchBody+nextNumber
        } else {
            const sortedBranches = branches.sort()
            let endLetters = []
            for (let i = 0; i < sortedBranches.length; i++ ) {
                // check branches for last letter
                const endLetter = sortedBranches[i].charAt(sortedBranches[i].length - 1)
                if (endLetter) {
                    endLetters.push(endLetter)
                }
            }
            const lastLetter = endLetters[endLetters.length - 1]
            const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0)+1)
            const lastBranchBody = sortedBranches[sortedBranches.length - 1].slice(0, -1)
            branchName = lastBranchBody+nextLetter
        }
    }

    return branchName
}

export function getConditionForBranchName(branch) {
    const branchText = branch.slice(6)
    let conditionText = branchText.split('')
    for (let i = 0; i < branchText.length; i++) {
        conditionText[i] = /^\d+$/.test(branchText.charAt(i)) ? branchText.charAt(i) : "[" + branchText.charAt(i).toLowerCase() + branchText.charAt(i).toUpperCase() + "]"
    }
    const conditionTextString = conditionText.join('')
    const condition = "^"+conditionTextString+"\\b"
    return condition
}

export function changeBranchName(newKey, data, depth, branch, parent, parentsParent, parentsParentsParent) {
    const condition = getConditionForBranchName(newKey)
    if (depth === 1) {
        data[newKey] = data[branch]
        data[newKey]["condition"] = condition
        delete data[branch]
    }
    if (depth === 2) {
        data[parent][newKey] = data[parent][branch]
        data[parent][newKey]["condition"] = condition
        delete data[parent][branch]
    }
    if (depth === 3) {
        data[parentsParent][parent][newKey] = data[parentsParent][parent][branch]
        data[parentsParent][parent][newKey]["condition"] = condition
        delete data[parentsParent][parent][branch]
    }
    if (depth === 4) {
        data[parentsParentsParent][parentsParent][parent][newKey] = data[parentsParentsParent][parentsParent][parent][branch]
        data[parentsParentsParent][parentsParent][parent][newKey]["condition"] = condition
        delete data[parentsParentsParent][parentsParent][parent][branch]
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

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window
    return {
        width,
        height
    }
}

export default function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions())
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, []);

    return windowDimensions;
}