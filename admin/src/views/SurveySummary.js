import {useCodesData, useContactsData, useSurveyData, useUserData, useUserSurveyData} from "./SurveyView";
import {useIntl} from "react-intl";
import {formatDate} from "../Formats";
import {getNameWithAnnieUser, getStudentFromContacts} from "../DataFunctions";
import React, {useEffect, useState} from "react";
import {ReactComponent as MessageIcon} from "../svg/message.svg";
import {ReactComponent as SuccessIcon} from "../svg/success-big.svg";
import {ReactComponent as ErrorIcon} from "../svg/error-big.svg";
import {ReactComponent as InfoIcon} from "../svg/info-big.svg";
import {ReactComponent as Chevron} from "../svg/chevron.svg";
import {getBranchIconColor, getMessageIcon} from "../UIElements";
import {ReactComponent as SupportIcon} from "../svg/support.svg";
import {ReactComponent as ProviderIcon} from "../svg/provider.svg";
import _ from "lodash";
import {ReactComponent as BranchesIcon} from "../svg/branches.svg";
import {ReactComponent as Alert} from "../svg/alert.svg";
import {ReactComponent as Info} from "../svg/info.svg";
import '../scss/SurveySummary.scss';

export function SurveySummary({setSurveyChecked}) {
    const {surveyData} = useSurveyData()
    const {userSurveyData} = useUserSurveyData()
    const {codesData} = useCodesData()
    const intl = useIntl()
    const surveyName = surveyData.config.title
    let startTime, endTime
    switch (intl.locale) {
        case "en":
            startTime = new Date(formatDate(surveyData.starttime)).toLocaleString("en-US")
            endTime = new Date(formatDate(surveyData.endtime)).toLocaleString("en-US")
            break
        case "fi":
            startTime = new Date(formatDate(surveyData.starttime)).toLocaleString("fi")
            endTime = new Date(formatDate(surveyData.endtime)).toLocaleString("fi")
            break
        default:
            startTime = new Date(formatDate(surveyData.starttime)).toLocaleString("en-US")
            endTime = new Date(formatDate(surveyData.endtime)).toLocaleString("en-US")
    }
    const hasReminders = surveyData.config.hasOwnProperty("reminders") && surveyData.config.reminders.length > 0

    const limitedEditing = surveyData.status === "IN PROGRESS" || surveyData.status === "FINISHED"
    const surveyFinished = surveyData.status === "FINISHED"

    let startTimeErrorText
    const startTimeCheck = () => {
        if (!surveyData.hasOwnProperty("starttime") || surveyData.starttime.length < 1) {
            startTimeErrorText = intl.formatMessage(
                {
                    id: 'survey.overview.noStartTime',
                    defaultMessage: 'Missing start time',
                })
            return false
        }
        if (!limitedEditing) {
            if (new Date(formatDate(surveyData.starttime)) < new Date()) {
                startTimeErrorText = intl.formatMessage(
                    {
                        id: 'survey.overview.startTimeError',
                        defaultMessage: 'The start time is set in the past',
                    })
                return false
            }
        }
        return true
    }

    let endTimeErrorText
    const endTimeCheck = () => {
        if (!surveyData.hasOwnProperty("endtime") || surveyData.endtime.length < 1) {
            endTimeErrorText = intl.formatMessage(
                {
                    id: 'survey.overview.noEndTime',
                    defaultMessage: 'Missing end time',
                })
            return false
        }
        if (!surveyFinished) {
            if (new Date(formatDate(surveyData.endtime)) < new Date()) {
                endTimeErrorText = intl.formatMessage(
                    {
                        id: 'survey.overview.endTimeBeforeNow',
                        defaultMessage: 'The end time is set in the past',
                    })
                return false
            }
            if (new Date(formatDate(surveyData.endtime)) < new Date(formatDate(surveyData.starttime))) {
                endTimeErrorText = intl.formatMessage(
                    {
                        id: 'survey.overview.endTimeBeforeStartTime',
                        defaultMessage: 'The end time is set earlier than the start time',
                    })
                return false
            }
        }
        return true
    }

    let reminderErrorText
    const infoErrorCheck = () => {
        if (!surveyFinished) {
            if (hasReminders) {
                if (surveyData.config.reminders.some(reminder => reminder.delay < 1)) {
                    reminderErrorText = intl.formatMessage(
                        {
                            id: 'survey.overview.reminderDelayError',
                            defaultMessage: 'A reminder is set earlier than the survey start time',
                        })
                    return false
                }
                if (surveyData.config.reminders.some(reminder => reminder.message.length < 1)) {
                    reminderErrorText = intl.formatMessage(
                        {
                            id: 'survey.overview.reminderMessageError',
                            defaultMessage: 'A reminder is missing a message text',
                        })
                    return false
                }
            }
        }
        return true
    }
    const remindersLeft = hasReminders && surveyData.config.reminders.length === 1 ?
        intl.formatMessage(
            {
                id: 'survey.overview.reminderSet',
                defaultMessage: 'Reminder set',
            }) :
        intl.formatMessage(
            {
                id: 'survey.overview.remindersSet',
                defaultMessage: 'Reminders set',
            })
    const reminderInfoText = hasReminders ? surveyData.config.reminders.length + " " + remindersLeft : "0" + " " + remindersLeft

    function someMessageIsMissingText(data) {
        if (data.message.length < 1) {
            return true
        }
        const branchesAndOther = Object.keys(data).filter(key => key.startsWith('branch') || key === 'other')
        if (branchesAndOther.some(obj => data[obj].message.length < 1)) {
            return true
        }
        return branchesAndOther.some(obj => someMessageIsMissingText(data[obj]))
    }

    function variableMisspelled(data) {
        if (data.message.includes("{") || data.message.includes("}")) {
            if (checkForVariableTypingAndExtraBrackets(intl.formatMessage(({id:'survey.firstMessage',defaultMessage:'First message'})), data.message)) {
                return true
            }
        }
        const branchesAndOther = Object.keys(data).filter(key => key.startsWith('branch') || key === 'other')
        for (const obj of branchesAndOther) {
            if (data[obj].message.includes("{") || data[obj].message.includes("}")) {
                if (checkForVariableTypingAndExtraBrackets(obj, data[obj].message)) {
                    return true
                }
            }
        }
        return branchesAndOther.some(obj => variableMisspelled(data[obj]))
    }

    let falseBranch = ""
    function checkForVariableTypingAndExtraBrackets(branch, messageContent) {
        const correctVariableRegex = /{{[A-Za-z0-9]*}}/g
        const variables = [...messageContent.matchAll(correctVariableRegex)]
        if (variables.length < 1) {
            falseBranch = branch.startsWith("branch") ? branch.slice(6) : branch
            return true
        }
        const numberOfForwardBrackets = messageContent.match(/{/g).length
        const numberOfBackwardBrackets = messageContent.match(/}/g).length
        if (numberOfForwardBrackets !== variables.length * 2 || numberOfBackwardBrackets !== variables.length * 2) {
            falseBranch = branch.startsWith("branch") ? branch.slice(6) : branch
            return true
        }
    }

    const {contactsData} = useContactsData()
    let contactHeaders = []
    for (let i = 0; i < contactsData.length; i++) {
        if (contactsData[i].hasOwnProperty("contact")) {
            for (const [key] of Object.entries(contactsData[i]["contact"])) {
                contactHeaders.indexOf(key) === -1 && contactHeaders.push(key)
            }
        }
    }

    function variableMissing(data) {
        if (data.message.includes("{") || data.message.includes("}")) {
            if (checkIfVariableExists(data.message)) {
                return true
            }
        }
        const branchesAndOther = Object.keys(data).filter(key => key.startsWith('branch') || key === 'other')
        for (const obj of branchesAndOther) {
            if (data[obj].message.includes("{") || data[obj].message.includes("}")) {
                if (checkIfVariableExists(data[obj].message)) {
                    return true
                }
            }
        }
        return branchesAndOther.some(obj => variableMissing(data[obj]))
    }

    let falseVariable = ""
    function checkIfVariableExists(messageContent) {
        const correctVariableRegex = /{{[A-Za-z0-9]*}}/g
        const variables = [...messageContent.matchAll(correctVariableRegex)]
        for (const variable of variables) {
            let variableName = variable[0].slice(2, -2)
            if (!contactHeaders.includes(variableName)) {
                falseVariable = variableName
                return true
            }
        }
    }

    let messagesErrorText
    const messagesErrorCheck = () => {
        if (!surveyFinished) {
            if (someMessageIsMissingText(surveyData.config)) {
                messagesErrorText = intl.formatMessage(
                    {
                        id: 'survey.overview.messagesMissingText',
                        defaultMessage: 'A message is missing text',
                    })
                return false
            }
            if (variableMisspelled(surveyData.config)) {
                messagesErrorText = intl.formatMessage(
                    {
                        id: 'survey.overview.messagesVariableMisspelled',
                        defaultMessage: 'Invalid form of variable in:',
                    }) + " " + falseBranch
                return false
            }
            if (variableMissing(surveyData.config)) {
                messagesErrorText = intl.formatMessage(
                    {
                        id: 'survey.overview.messagesVariableMissing',
                        defaultMessage: 'Used variable does not exist:',
                    }) + " " + falseVariable
                return false
            }
        }
        return true
    }

    function supportNeedMissingProvider(data) {
        const branches = Object.keys(data).filter(key => key.startsWith('branch') || key === 'other')
        if (branches.some(obj => data[obj].hasOwnProperty("supportneed") && !userSurveyData.some(annieuser => annieuser.meta.hasOwnProperty("category") && annieuser.meta.category.hasOwnProperty(data[obj].category)))) {
            return true
        }
        return branches.some(obj => supportNeedMissingProvider(data[obj]))
    }

    function someBranchIsMissingSupportCategory(data, codesData) {
        const branches = Object.keys(data).filter(key => key.startsWith('branch') || key === 'other')
        if (branches.some(obj => data[obj].hasOwnProperty("supportneed") && !codesData.hasOwnProperty(data[obj].category))) {
            return true
        }
        return branches.some(obj => someBranchIsMissingSupportCategory(data[obj], codesData))
    }

    let supportNeedsErrorText
    const supportNeedsErrorCheck = () => {
        if (someBranchIsMissingSupportCategory(surveyData.config, codesData)) {
            supportNeedsErrorText = intl.formatMessage({
                id:'survey.overview.supportNeedMissingTopic',
                defaultMessage: 'A support needs is missing a topic'
            })
            return false
        }
        return true
    }

    const surveyCoordinators = userSurveyData.filter(user => user.meta.coordinator)
    const coordinatorsSet = surveyCoordinators.length === 1 ?
        intl.formatMessage(
            {
                id: 'survey.overview.coordinatorSet',
                defaultMessage: 'Coordinator set',
            }) :
        intl.formatMessage(
            {
                id: 'survey.overview.coordinatorsSet',
                defaultMessage: 'Coordinators set',
            })
    const surveyCoordinatorsText = surveyCoordinators.length > 0 ? surveyCoordinators.length + " " + coordinatorsSet : "0" + " " + coordinatorsSet

    function recipientsDuplicatePhoneNumber() {
        const surveyContacts = surveyData.contacts
        const surveyPhoneNumbers = surveyContacts && surveyContacts.map(student => getStudentFromContacts(student, contactsData)["contact"]["phonenumber"])
        if (!surveyPhoneNumbers) {
            return false
        }
        return surveyPhoneNumbers.some( number => surveyPhoneNumbers.indexOf(number) !== surveyPhoneNumbers.lastIndexOf(number))
    }

    let recipientsErrorText
    const recipientsErrorCheck = () => {
        if (!limitedEditing) {
            if (!surveyData.hasOwnProperty("contacts") || !surveyData.contacts || (surveyData.hasOwnProperty("contacts") && surveyData.contacts && surveyData.contacts.length < 1)) {
                recipientsErrorText = intl.formatMessage({
                    id: 'survey.overview.noRecipients',
                    defaultMessage: 'Survey cant be published without recipients'
                })
                return false
            }
            if (recipientsDuplicatePhoneNumber()) {
                recipientsErrorText = intl.formatMessage({
                    id: 'survey.overview.recipientsPhoneDuplicate',
                    defaultMessage: 'Survey has duplicate phone numbers'
                })
                return false
            }
        }
        return true
    }

    const surveyRecipientsText = surveyData.hasOwnProperty("contacts") && surveyData.contacts ?
        surveyData.contacts.length + " " + intl.formatMessage({id:'survey.overview.recipients',defaultMessage:'Recipients'}) :
        "0 " + intl.formatMessage({id:'survey.overview.recipients',defaultMessage:'Recipients'})

    const surveyStatus = {
        name: surveyName.length > 0,
        startTime: startTimeCheck(),
        endTime: endTimeCheck(),
        reminders: infoErrorCheck(),
        messages: messagesErrorCheck(),
        supportNeeds: supportNeedsErrorCheck(),
        coordinators: surveyCoordinators.length > 0,
        recipients: recipientsErrorCheck()
    }

    // Update parents survey checked state with status check
    useEffect(()=>{
        setSurveyChecked(!Object.keys(surveyStatus).some(obj => surveyStatus[obj] === false))
    },[])

    return <div className={"survey-summary-container"}>
        <Slat
            header={intl.formatMessage(
                {
                    id: 'survey.overview.surveyName',
                    defaultMessage: 'Survey Name',
                })}
            text={surveyName}
            success={surveyStatus.name}
            errorText={intl.formatMessage(
                {
                    id: 'survey.overview.missingName',
                    defaultMessage: 'Survey is missing name',
                })}
            disabled={false}
        />
        <Slat
            header={intl.formatMessage(
                {
                    id: 'survey.information.startTime',
                    defaultMessage: 'Start time',
                })}
            text={startTime}
            success={surveyStatus.startTime}
            errorText={startTimeErrorText}
            disabled={limitedEditing}
        />
        <Slat
            header={intl.formatMessage(
                {
                    id: 'survey.information.endTime',
                    defaultMessage: 'End time',
                })}
            text={endTime}
            success={surveyStatus.endTime}
            errorText={endTimeErrorText}
            disabled={surveyFinished}
        />
        <Slat
            header={intl.formatMessage(
                {
                    id: 'survey.navigation.reminders',
                    defaultMessage: 'Reminders',
                })}
            text={reminderInfoText}
            info={!hasReminders}
            success={surveyStatus.reminders}
            errorText={reminderErrorText}
            disabled={surveyFinished}
            expandable={hasReminders}
        >
            {hasReminders &&
            <ul>
                {surveyData.config.reminders.map( (reminder, i) => {
                    const startTime = new Date(formatDate(surveyData.starttime))
                    const reminderDate = new Date(startTime.getTime() + reminder.delay*60*60*1000)
                    const reminderTime = intl.locale === "fi" ? reminderDate.toLocaleString("fi") : reminderDate.toLocaleString("en-US")
                    return <li className={"reminder"} key={i}>
                        <b>
                            {reminder.delay}
                            {" "}
                            {intl.formatMessage(
                                {
                                    id: 'survey.reminders.hours',
                                    defaultMessage: 'hours',
                                })}
                        </b>
                        {" "}
                        {intl.formatMessage(
                            {
                                id: 'survey.reminders.afterLaunch',
                                defaultMessage: 'after survey start',
                            })}
                        <span>
                    {" → "}
                            {reminderTime}
                    </span>
                        <div className={"message"}>
                            <MessageIcon />
                            {reminder.message.length > 0 ?
                                reminder.message :
                                <span className={"alert"}>
                                {intl.formatMessage(
                                    {
                                        id: 'survey.overview.reminderMessageMissing',
                                        defaultMessage: 'Missing message text',
                                    })}
                            </span>
                            }
                        </div>
                    </li>
                })}
            </ul>
            }
        </Slat>
        <Slat
            header={intl.formatMessage({
                id: 'survey.navigation.messages',
                defaultMessage: 'Messages',
            })}
            text={intl.formatMessage({
                id: 'survey.overview.messagesInfoText',
                defaultMessage: 'Click to view message flow',
            })}
            success={surveyStatus.messages}
            errorText={messagesErrorText}
            disabled={surveyFinished}
            expandable={true}
        >
            <Messages />
        </Slat>
        <Slat
            header={intl.formatMessage({
                id:'survey.supportNeeds',
                defaultMessage:'Support Needs'
            })}
            text={intl.formatMessage({
                id:'survey.overview.supportNeedsText',
                defaultMessage:'Click to view support needs'
            })}
            infoText={intl.formatMessage({
                id:'survey.overview.supportProvidersMissing',
                defaultMessage:'Unassigned support needs will be targeted to teachers'
            })}
            info={supportNeedMissingProvider(surveyData.config) && surveyStatus.supportNeeds}
            success={surveyStatus.supportNeeds}
            errorText={supportNeedsErrorText}
            disabled={false}
            expandable={true}
        >
            <SupportNeeds />
        </Slat>
        <Slat
            header={intl.formatMessage(
                {
                    id: 'survey.supportNeeds.coordinators',
                    defaultMessage: 'Survey Coordinators',
                })}
            text={surveyCoordinatorsText}
            success={surveyStatus.coordinators}
            errorText={intl.formatMessage(
                {
                    id: 'survey.overview.missingCoordinator',
                    defaultMessage: 'Survey has to have a coordinator assigned',
                })}
            disabled={false}
            expandable={surveyStatus.coordinators}
        >
            <SurveyCoordinator />
        </Slat>
        <Slat
            header={intl.formatMessage(
                {
                    id: 'survey.contacts.recipients',
                    defaultMessage: 'Survey Recipients',
                })}
            text={surveyRecipientsText}
            success={surveyStatus.recipients}
            errorText={recipientsErrorText}
            disabled={limitedEditing}
            expandable={!surveyData.hasOwnProperty("contacts") || (surveyData.contacts && !surveyData.contacts.length < 1)}
        >
            <SurveyRecipients />
        </Slat>
    </div>
}

function Slat({header,text,errorText,success,info,infoText,expandable,disabled,children}){
    const [isOpen, setIsOpen] = useState(false)
    let headerStatus = "success"
    let statusIcon = <SuccessIcon />
    if (!success) {
        headerStatus = "error"
        statusIcon = <ErrorIcon />
    }
    if (info) {
        headerStatus = "info"
        statusIcon = <InfoIcon />
    }
    let slatClass = "slat"
    if (disabled) {slatClass = slatClass.concat(" disabled")}
    if (isOpen) {slatClass = slatClass.concat(" open")}

    return <div className={slatClass}>
        <div className={expandable ? "slat-header toggle" : "slat-header"} onClick={expandable ? ()=>setIsOpen(!isOpen):null}>
            {statusIcon}
            <h4 className={headerStatus}>{header}</h4>
            <p>→ {text}</p>
            {!success &&
            <p className={"error"}>→ {errorText}</p>
            }
            {info && infoText &&
            <p className={"info"}>→ {infoText}</p>
            }
            {expandable &&
            <span className={isOpen? "chevron open" : "chevron"}>
                <Chevron />
            </span>
            }
        </div>
        {isOpen &&
        <div className={"slat-content"}>
            {children}
        </div>
        }
    </div>
}

function SurveyRecipients() {
    const {surveyData} = useSurveyData()
    const {contactsData} = useContactsData()
    const intl = useIntl()
    const surveyContacts = surveyData.contacts
    const surveyContactsDetails = surveyContacts && surveyContacts.map(student => getStudentFromContacts(student, contactsData))
    const surveyDegrees = surveyContactsDetails && surveyContactsDetails.map(student => student["contact"]["degree"])
    const surveyGroups = surveyContactsDetails && surveyContactsDetails.map(student => student["contact"]["group"])
    const surveyLocations = surveyContactsDetails && surveyContactsDetails.map(student => student["contact"]["location"])
    const uniqueGroups = surveyGroups && surveyGroups.filter(filterUnique)
    const uniqueDegrees = surveyDegrees && surveyDegrees.filter(filterUnique)
    const uniqueLocations = surveyLocations && surveyLocations.filter(filterUnique)
    function filterUnique(value, index, self) {
        return self.indexOf(value) === index
    }
    const groupsWithAmounts = uniqueGroups.map(group => countAmounts(group, surveyGroups)).sort(amountSort)
    const degreesWithAmounts = uniqueDegrees.map(degree => countAmounts(degree, surveyDegrees)).sort(amountSort)
    const locationsWithAmounts = uniqueLocations.map(location => countAmounts(location, surveyLocations)).sort(amountSort)
    function countAmounts(obj, allObj) {
        let amount = 0
        for (let i = 0; i < allObj.length; i++) {
            if (allObj[i] === obj) {
                amount++
            }
        }
        if (!obj) {
            return {[intl.formatMessage(
                    {
                        id: 'survey.table.empty',
                        defaultMessage: '(Empty)',
                    })]: amount}
        }
        return {[obj]: amount}
    }
    function amountSort(a, b) {
        let first = a[Object.keys(a)[0]]
        let second = b[Object.keys(b)[0]]
        if ( first > second ){
            return -1
        }
        if ( first < second ){
            return 1
        }
        return 0
    }

    const summaryData = [
        {
            header: "Groups",
            keys: groupsWithAmounts
        },
        {
            header: "Degrees",
            keys: degreesWithAmounts
        },
        {
            header: "Locations",
            keys: locationsWithAmounts
        }
    ]

    return <table className={"summary-container recipient-overview"}>
        <thead>
        <tr>
            {summaryData.map((obj,i) => {
                return <th key={i}>
                    {obj.header} ({obj.keys.length})
                </th>
            })}
        </tr>
        </thead>
        <tbody>
        <tr>
            {summaryData.map((obj,i) => {
                return <td key={i}>
                    <ol>
                        {obj.keys.map((key, i)=>{
                            return <li key={i}>
                                {Object.keys(key)[0]} ({key[Object.keys(key)[0]]})
                            </li>
                        })}
                    </ol>
                </td>
            })}
        </tr>
        </tbody>
    </table>
}

function SurveyCoordinator() {
    const {userSurveyData} = useUserSurveyData()
    const surveyCoordinators = userSurveyData.filter(user => user.meta.coordinator)
    const {userData} = useUserData()
    return <ul>
        {surveyCoordinators.map( (coordinator, i) => {
            return <li className={"coordinator"} key={i}>
                <b>{getNameWithAnnieUser(userData, coordinator.annieuser)}</b> – {coordinator.annieuser}
            </li>
        })}
    </ul>
}

function Messages() {
    const intl = useIntl()
    const {surveyData} = useSurveyData()
    const branches = Object.keys(surveyData.config).filter(key => key.startsWith('branch') || key === 'other').sort()
    const [minimize, setMinimize] = useState(false)

    return <>
        <div className={"button-switch"}>
            <button className={minimize ? "" : "active"} onClick={()=>setMinimize(false)}>
                {intl.formatMessage({id:'show', defaultMessage:'Show'})}
            </button>
            <button className={minimize ? "active" : ""} onClick={()=>setMinimize(true)}>
                {intl.formatMessage({id:'survey.overview.minimize', defaultMessage:'Hide content'})}
            </button>
        </div>
        <div className={"messages-container summary-container"}>
            <div className={"message-group first"}>
                {minimize ?
                    <div className={"message-minimized"} title={surveyData.config.message}>
                        <div className={"icon"}>
                            <MessageIcon/>
                        </div>
                    </div>
                    :
                    <div className={"message-card"}>
                        <div className={"message-header"}>
                            <div className={"icon"}>
                                <MessageIcon/>
                                {intl.formatMessage({id:'survey.firstMessage',defaultMessage:'First message'})}
                            </div>
                        </div>
                        <div className={"message-text"}>
                            {surveyData.config.message.length > 0 ?
                                surveyData.config.message :
                                <span className={"error"}>
                            {intl.formatMessage({id:"survey.overview.reminderMessageMissing", defaultMessage:"Missing message text"})}
                        </span>
                            }
                        </div>
                    </div>
                }
                {branches.length > 0 &&
                <div className={branches.length > 1 ? "message-children line" : "message-children"}>
                    {branches.map((branch, i) => {
                        return <MessageChildren key={i} data={surveyData.config[branch]} branch={branch} minimize={minimize}/>
                    })}
                </div>
                }
            </div>
        </div>
    </>
}

function MessageChildren({data, branch, minimize}) {
    const intl = useIntl()
    const branchSymbol = getMessageIcon(data, branch !== "other", branch)
    let branchText = ""
    if (branch === "other") {branchText = intl.formatMessage({id:'survey.message.other',defaultMessage:'Error message'})}
    if (data.condition === ".*") {branchText = intl.formatMessage({id:'survey.message.repy',defaultMessage:'Reply'})}
    const branches = Object.keys(data).filter(key => key.startsWith('branch') || key === 'other').sort()
    let color = getBranchIconColor(data, branch !== "other", branch)
    let style = {backgroundColor:color}
    const {codesData} = useCodesData()
    const {userSurveyData} = useUserSurveyData()
    const {userData} = useUserData()
    const categoryProviders = userSurveyData.filter(user => user.meta.hasOwnProperty("category") && user.meta.category[data.category])
    const providerNames = categoryProviders.length > 0 ? categoryProviders.map(user => getNameWithAnnieUser(userData, user.annieuser)).join('\n') : intl.formatMessage({
        id:'survey.overview.supportProvidersMissing',
        defaultMessage:'Unassigned support needs will be targeted to teachers'
    })
    const supportNeed = data.hasOwnProperty("supportneed") && data.supportneed
    let locale = (intl.locale === "es" || intl.locale === "it") ? "en" : intl.locale
    const codeName = codesData.hasOwnProperty(data.category) ? codesData[data.category][locale] : intl.formatMessage({id:'survey.overview.noSupportNeedAssigned',defaultMessage:'No support need assigned'})

    return <div className={"message-group"}>
        {minimize ?
            <div className={"message-minimized"} style={style} title={data.message}>
                <div className={"icon"}>
                    {branchSymbol}
                </div>
            </div>
            :
            <div className={"message-card"}>
                <div className={"message-header"} style={style}>
                    <div className={"icon"}>
                        {branchSymbol}
                        {branchText}
                    </div>
                </div>
                <div className={"message-text"}>
                    {data.message.length > 0 ?
                        data.message :
                        <span className={"error"}>
                            {intl.formatMessage({id:"survey.overview.reminderMessageMissing", defaultMessage:"Missing message text"})}
                        </span>
                    }
                </div>
                {supportNeed &&
                <div className={"message-support-need"}>
                    <div className={"support-need-toggle"}>
                        <SupportIcon/>
                        <div className={codesData.hasOwnProperty(data.category) ? "block support-need" : "block support-need alert"}>
                            {codeName}
                        </div>
                    </div>
                    <div className={"support-providers"}>
                        <ProviderIcon/>
                        <div className={categoryProviders.length > 0 ? "support-provider block" : "support-provider block alert"} title={providerNames}>
                            {categoryProviders.length}
                        </div>
                    </div>
                </div>
                }
            </div>
        }

        { branches.length > 0 &&
        <div className={branches.length > 1 ? "message-children line" : "message-children"}>
            {branches.map((branch, i) => {
                return <MessageChildren key={i} data={data[branch]} branch={branch} minimize={minimize}/>
            })}
        </div>
        }
    </div>
}

function SupportNeeds() {
    const {surveyData} = useSurveyData()
    const {codesData} = useCodesData()
    const intl = useIntl()
    let locale = (intl.locale === "es" || intl.locale === "it") ? "en" : intl.locale
    const supportNeeds = findBranchesWithSupportNeed(surveyData.config)
    const supportNeedGroups = _.groupBy(supportNeeds, need => need.category)

    function findBranchesWithSupportNeed(data) {
        let supportNeedBranches = []
        branchLoopCheck(data)
        function branchLoopCheck(data) {
            for (const obj in data) {
                if (data[obj].supportneed) {
                    supportNeedBranches.push(
                        {
                            branch: obj,
                            category: data[obj].category,
                            condition: data[obj].condition,
                            title:data[obj].message,
                            categoryName: codesData.hasOwnProperty(data[obj].category) ?
                                codesData[data[obj].category][locale] :
                                intl.formatMessage({id:'survey.overview.noSupportNeedAssigned',defaultMessage:'No support need assigned'}),
                            supportNeedAssigned: codesData.hasOwnProperty(data[obj].category)
                        })
                }
                if (typeof data[obj] === 'object' && data[obj] !== null) {
                    branchLoopCheck(data[obj])
                }
            }
        }

        return supportNeedBranches
    }

    return <table className={"summary-container support-need-overview"}>
        <thead>
        <tr>
            <th/>
            <th>
                <SupportIcon/>
                {intl.formatMessage(
                    {
                        id: 'supportTopic',
                        defaultMessage: 'Support Topic',
                    })}
            </th>
            <th>
                <ProviderIcon/>
                {intl.formatMessage(
                    {
                        id: 'survey.supportNeeds.supportProvider',
                        defaultMessage: 'Support Provider',
                    })}
            </th>
            <th>
                <BranchesIcon/>
                {intl.formatMessage(
                    {
                        id: 'survey.navigation.messages',
                        defaultMessage: 'Messages',
                    })}
            </th>
        </tr>
        </thead>
        <tbody>
        {Object.keys(supportNeedGroups).map((group, i) => {
            const categoryObj = supportNeedGroups[group]
            return <tr key={i}>
                <td>{i+1}</td>
                <td className={"topics"}>
                    {categoryObj[0].supportNeedAssigned ?
                        categoryObj[0].categoryName :
                        <span className={"alert"}>
                            <Alert />
                            {categoryObj[0].categoryName}
                        </span>
                    }
                </td>
                <td className={"providers"}>
                    <SupportProviders data={categoryObj[0]}/>
                </td>
                <td className={"branches"}>
                    {categoryObj.map((obj, i) =>{
                        const branchSymbol = getMessageIcon(obj,obj.branch !== "other", obj.branch)
                        const style = {backgroundColor:getBranchIconColor(obj, obj.branch !== "other", obj.branch)}
                        return <div key={i} className={"message-minimized"} title={obj.title} style={style}>
                            <div className={"icon"}>{branchSymbol}</div>
                        </div>
                    })}
                </td>
            </tr>
        })}
        </tbody>
    </table>
}

function SupportProviders({data}) {
    const {userSurveyData} = useUserSurveyData()
    const {userData} = useUserData()
    const categoryProviders = userSurveyData.filter(user => user.meta.hasOwnProperty("category") && user.meta.category[data.category])
    const intl = useIntl()

    return <ol>
        {categoryProviders.length > 0 ?
            categoryProviders.map((provider, i) => {
                return <li key={i}>
                    <b>{getNameWithAnnieUser(userData, provider.annieuser)}</b> – {provider.annieuser}
                </li>})
            :
            <span className={"info"} title={intl.formatMessage({
                id: 'survey.overview.supportProvidersMissing',
                defaultMessage: 'Unassigned support needs will be targeted to teachers'
            })}>
                <Info />
                {intl.formatMessage({
                    id: 'unassigned',
                    defaultMessage: 'Unassigned'
                })}
            </span>
        }
    </ol>
}