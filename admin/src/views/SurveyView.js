import React, {useContext, useEffect, useMemo, useState} from "react";
import '../scss/SurveyView.scss';
import {Link, NavLink, Redirect, Route, Switch, useParams, useRouteMatch, useHistory, Prompt, useLocation} from "react-router-dom";
import {
    GetCodes, GetContacts,
    GetSurveyWithId, GetUserBySurvey, GetUsers,
} from "../api/APISurvey";
import {FormattedMessage, useIntl} from "react-intl";
import {getBranchIconColor, getMessageIcon, Modal, Popover, Skeleton, StatusText, Toast} from "../UIElements";
import {ReactComponent as BackArrow} from "../svg/back.svg";
import DatePicker, {registerLocale} from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css";
import fi from "date-fns/locale/fi";
import {dateToServerFormat, formatDate, updateTimeToServerFormat} from "../Formats";
import SurveyHeader from "./SurveyHeader";
import SurveyMessages from "./SurveyMessages";
import {ReactComponent as LoaderIcon} from "../svg/loader.svg";
import {ReactComponent as ReminderIcon} from "../svg/reminder.svg";
import {ReactComponent as ReminderIconSmall} from "../svg/reminder-s.svg";
import {ContentState, Editor, EditorState} from "draft-js";
import {ReactComponent as OptionsIcon} from "../svg/options.svg";
import {ReactComponent as DeleteIcon} from "../svg/delete.svg";
import {ReactComponent as MessageIcon} from "../svg/message.svg";
import {ReactComponent as MinimizeIcon} from "../svg/minimize.svg";
import {ReactComponent as PathsIcon} from "../svg/paths.svg";
import _ from "lodash"
import {ReactComponent as SupportIcon} from "../svg/support.svg";
import SurveySupportNeeds, {SurveyCoordinators} from "./SurveySupportNeeds";
import SurveyRecipients from "./SurveyRecipients";
import SurveyResults from "./SurveyResults";
import {ReactComponent as CloseIcon} from "../svg/close.svg";
import SurveyFollowUp from "./SurveyFollowUp";
registerLocale("fi", fi)

const SurveyContext = React.createContext({
    surveyContext: {
        config: {},
        contacts: null,
        endtime: "",
        followup: null,
        id: "",
        starttime: "",
        status: "DRAFT",
        updated: "",
        updatedby: ""
    },
    setSurveyContext: () => {}
})

const OriginalSurveyContext = React.createContext({
    originalSurveyContext: {},
    setOriginalSurveyContext: () => {}
})

const UserContext = React.createContext({
    userContext: {},
    setUserContext: () => {}
})

const UserSurveyContext = React.createContext({
    userSurveyContext: {},
    setUserSurveyContext: () => {}
})

const OriginalUserSurveyContext = React.createContext({
    originalUserSurveyContext: {},
    setOriginalUserSurveyContext: () => {}
})

const CodesContext = React.createContext({
    codesContext: {},
    setCodesContext: () => {}
})

const ContactsContext = React.createContext({
    contactsContext: {},
    setContactsContext: () => {}
})

const CopiedUsersContext = React.createContext({
    copiedUsersContext: {},
    setCopiedUsersContext: () => {}
})

const newSurveyData = {
    id: "new",
    updated: "",
    updatedby: "",
    starttime: dateToServerFormat(new Date()),
    endtime: dateToServerFormat(new Date()),
    followup: null,
    config: {
        title: "",
        message: ""
    },
    status: "DRAFT",
    contacts: []
}

export default function SurveyView() {
    let { surveyId } = useParams()
    // Get survey data and store it in local storage
    const getSurveyData = GetSurveyWithId(surveyId)
    let surveyData, storageData, originalData
    if (getSurveyData.status === "success") {
        const useData = surveyId === "new" ? newSurveyData : getSurveyData.data[0]
        originalData = _.cloneDeep(useData)
        surveyData = _.cloneDeep(useData)
        if (localStorage.getItem("stored-"+surveyData.id)) {
            storageData = JSON.parse(localStorage.getItem("stored-"+surveyData.id))
            if (storageData && surveyData && storageData.updated >= surveyData.updated) {
                surveyData = storageData
            }
        }
    }
    // Get annie users
    const getUserData = GetUsers()
    let userData
    if (getUserData.status === "success") {
        userData = _.cloneDeep(getUserData.data)
    }
    // Get annie user survey data by surveyId
    const getUserSurveyData = GetUserBySurvey(surveyId)
    let userSurveyData, userSurveyStorageData, originalUserSurveyData
    if (getUserSurveyData.status === "success") {
        userSurveyData = _.cloneDeep(getUserSurveyData.data)
        originalUserSurveyData = _.cloneDeep(getUserSurveyData.data)
        if (localStorage.getItem("userSurveyData-"+surveyId)) {
            userSurveyStorageData = JSON.parse(localStorage.getItem("userSurveyData-"+surveyId))
            if (storageData && surveyData && storageData.updated >= surveyData.updated) {
                userSurveyData = userSurveyStorageData
            }
        }
    }
    // Get support need category codes
    const getCodesData = GetCodes()
    let codesData
    if (getCodesData.status === "success") {
        codesData = getCodesData.data.find(obj => obj.hasOwnProperty('category')).category
    }
    // Get contacts
    const getContactsData = GetContacts()
    let contactsData
    if (getContactsData.status === "success") {
        contactsData = _.cloneDeep(getContactsData.data)
    }
    // Make sure that everything is loaded
    let statusCheck
    if (getSurveyData.status === "success" && getUserData.status === "success" && getUserSurveyData.status === "success" && getCodesData.status === "success" && getContactsData.status === "success") {
        statusCheck = true
    }

    return <>
        <div className={"survey-container"}>
            {
                !statusCheck ? <SurveySkeleton /> :
                    getSurveyData.status === "error" ? <span>Error: {getSurveyData.error.message}</span> :
                <ContextOfSurvey
                    surveyId={surveyId}
                    surveyContext={surveyData}
                    originalData={originalData}
                    originalUserSurveyData={originalUserSurveyData}
                    userContext={userData}
                    userSurveyContext={userSurveyData}
                    codesContext={codesData}
                    contactsContext={contactsData}
                />
            }
        </div>
    </>
}

function SurveyProvider({children, surveyContext}) {
    const [surveyData, setSurveyData] = useState(surveyContext)
    const value = useMemo(() =>(
        {surveyData, setSurveyData}
    ), [surveyData])
    useEffect(()=>{
        localStorage.setItem("stored-"+surveyData.id, JSON.stringify(surveyData))
    },[surveyData])
    return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
}

export function useSurveyData() {
    const context = useContext(SurveyContext)
    if (context === undefined) {
        throw new Error('useSurveyData must be used within a SurveyProvider')
    }
    return context
}

function OriginalSurveyProvider({children, originalSurveyContext}) {
    const [originalSurveyData, setOriginalSurveyData] = useState(originalSurveyContext)
    const value = useMemo(() =>(
        {originalSurveyData, setOriginalSurveyData}
    ), [originalSurveyData])
    return <OriginalSurveyContext.Provider value={value}>{children}</OriginalSurveyContext.Provider>
}

export function useOriginalSurveyData() {
    const context = useContext(OriginalSurveyContext)
    if (context === undefined) {
        throw new Error('useOriginalSurveyData must be used within a OriginalSurveyProvider')
    }
    return context
}

function UserProvider({children, userContext, surveyId}) {
    const [userData, setUserData] = useState(userContext)
    const value = useMemo(() =>(
        {userData, setUserData}
    ), [userData])
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserData() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserProvider')
    }
    return context
}

function UserSurveyProvider({children, userSurveyContext, surveyId}) {
    const [userSurveyData, setUserSurveyData] = useState(userSurveyContext)
    const value = useMemo(() =>(
        {userSurveyData, setUserSurveyData}
    ), [userSurveyData])
    useEffect(()=>{
        localStorage.setItem("userSurveyData-"+surveyId, JSON.stringify(userSurveyData))
    },[userSurveyData, surveyId])
    return <UserSurveyContext.Provider value={value}>{children}</UserSurveyContext.Provider>
}

export function useUserSurveyData() {
    const context = useContext(UserSurveyContext)
    if (context === undefined) {
        throw new Error('useUserSurveyData must be used within a UserSurveyProvider')
    }
    return context
}

function OriginalUserSurveyProvider({children, originalUserSurveyContext}) {
    const [originalUserSurveyData, setOriginalUserSurveyData] = useState(originalUserSurveyContext)
    const value = useMemo(() =>(
        {originalUserSurveyData, setOriginalUserSurveyData}
    ), [originalUserSurveyData])
    return <OriginalUserSurveyContext.Provider value={value}>{children}</OriginalUserSurveyContext.Provider>
}

export function useOriginalUserSurveyData() {
    const context = useContext(OriginalUserSurveyContext)
    if (context === undefined) {
        throw new Error('useOriginalUserSurveyData must be used within a OriginalUserSurveyProvider')
    }
    return context
}

function CodesProvider({children, codesContext}) {
    const [codesData, setCodesData] = useState(codesContext)
    const value = useMemo(() =>(
        {codesData, setCodesData}
    ), [codesData])
    return <CodesContext.Provider value={value}>{children}</CodesContext.Provider>
}

export function useCodesData() {
    const context = useContext(CodesContext)
    if (context === undefined) {
        throw new Error('useCodesData must be used within a CodesProvider')
    }
    return context
}

function ContactsProvider({children, contactsContext}) {
    const [contactsData, setContactsData] = useState(contactsContext)
    const value = useMemo(() =>(
        {contactsData, setContactsData}
    ), [contactsData])
    return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}

export function useContactsData() {
    const context = useContext(ContactsContext)
    if (context === undefined) {
        throw new Error('useContactsData must be used within a ContactsProvider')
    }
    return context
}

function CopiedUsersProvider({children}) {
    const [copiedUsersData, setCopiedUsersData] = useState([])
    const value = useMemo(() =>(
        {copiedUsersData, setCopiedUsersData}
    ), [copiedUsersData])
    return <CopiedUsersContext.Provider value={value}>{children}</CopiedUsersContext.Provider>
}

export function useCopiedUsersData() {
    const context = useContext(CopiedUsersContext)
    if (context === undefined) {
        throw new Error('useCopiedUsersData must be used within a CopiedUsersProvider')
    }
    return context
}

function ContextOfSurvey({surveyId, surveyContext, originalData, userContext, userSurveyContext, codesContext, originalUserSurveyData, contactsContext}) {
    return <SurveyProvider surveyContext={surveyContext}>
        <UserProvider userContext={userContext} surveyId={surveyId}>
            <UserSurveyProvider userSurveyContext={userSurveyContext} surveyId={surveyId}>
                <CodesProvider codesContext={codesContext}>
                    <ContactsProvider contactsContext={contactsContext}>
                        <OriginalSurveyProvider originalSurveyContext={originalData}>
                            <OriginalUserSurveyProvider originalUserSurveyContext={originalUserSurveyData}>
                                <CopiedUsersProvider>
                                    <SurveyHeader />
                                    <SurveyStatusBanner />
                                    <div className={"survey-view"}>
                                        <div className={"survey-content"}>
                                            <SurveyNavigation />
                                            <SurveyContent/>
                                        </div>
                                    </div>
                                </CopiedUsersProvider>
                            </OriginalUserSurveyProvider>
                        </OriginalSurveyProvider>
                    </ContactsProvider>
                </CodesProvider>
            </UserSurveyProvider>
        </UserProvider>
    </SurveyProvider>
}

function SurveyStatusBanner() {
    const {surveyData} = useSurveyData()
    const intl = useIntl()
    const [status, setStatus] = useState(surveyData.status)
    const [showBanner, setShowBanner] = useState(true)
    let statusText
    let statusShowBanner = status === "IN PROGRESS" || status === "SCHEDULED" || status === "FINISHED" || status === "ARCHIVED" || status === "DELETED"
    let renderBanner = showBanner && statusShowBanner
    let statusClass = "survey-status-banner"

    if (status === "IN PROGRESS") {
        statusClass = statusClass.concat(" in-progress")
        statusText = intl.formatMessage(
            {
                id: 'survey.statusBanner.inProgress',
                defaultMessage: '🚨 The survey is in progress! Editing is limited.',
            })
    }
    if (status === "SCHEDULED") {
        statusClass = statusClass.concat(" scheduled")
        statusText = intl.formatMessage(
            {
                id: 'survey.statusBanner.scheduled',
                defaultMessage: '⏱ This survey is scheduled to start. If you wish to make changes switch the survey to Edit-mode, and republish after you are done.',
            })
    }
    if (status === "FINISHED") {
        statusClass = statusClass.concat(" finished")
        statusText = intl.formatMessage(
            {
                id: 'survey.statusBanner.finished',
                defaultMessage: '🎉 This survey is finished. If you wish to edit it consider creating a new survey by duplicating this one.',
            })
    }
    if (status === "ARCHIVED") {
        statusClass = statusClass.concat(" archived")
        statusText = intl.formatMessage(
            {
                id: 'survey.statusBanner.archived',
                defaultMessage: '🗃 This survey has been archived. Editing is limited.',
            })
    }
    if (status === "DELETED") {
        statusClass = statusClass.concat(" archived")
        statusText = intl.formatMessage(
            {
                id: 'survey.statusBanner.deleted',
                defaultMessage: '🗑 This survey has been deleted.',
            })
    }

    return renderBanner &&
        <div className={statusClass}>
            {status === "SCHEDULED" ?
                <>
                <div className={"count-container"}>
                    <CountDownTimer />
                    <div className={"close-toggle-container"}>
                        <div className={"close-toggle"} onClick={()=>setShowBanner(false)}>
                            <CloseIcon />
                        </div>
                    </div>
                </div>
                    {statusText}
                </> :
                <>
                    {statusText}
                    <div className={"close-toggle-container"}>
                        <div className={"close-toggle"} onClick={()=>setShowBanner(false)}>
                            <CloseIcon />
                        </div>
                    </div>
                </>
            }
    </div>
}

function CountDownTimer() {
    const {surveyData} = useSurveyData()
    const intl = useIntl()

    const calculateTimeLeft = () => {
        let countTo = new Date(surveyData.starttime).getTime()
        let countFrom = new Date().getTime()
        let countRemainder = countTo - countFrom
        let timeLeft = {}
        if (countRemainder > 0) {
            timeLeft = {
                days : Math.floor(countRemainder / (1000 * 60 * 60 * 24)),
                hours : Math.floor((countRemainder % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes : Math.floor((countRemainder % (1000 * 60 * 60)) / (1000 * 60)),
                seconds : Math.floor((countRemainder % (1000 * 60)) / 1000)
            }
        } else {
            timeLeft = null
        }
        return timeLeft
    }

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

    useEffect(()=> {
        const timer = setTimeout(()=>{
            setTimeLeft(calculateTimeLeft())
        }, 1000)
        return () => clearTimeout(timer)
    })

    return <div className={"count-down-timer"}>
        ⏱ {timeLeft ?
            <>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</> :
            intl.formatMessage(
                {
                    id: 'survey.startingSurvey',
                    defaultMessage: 'Starting Survey...',
                })
        }
    </div>
}

function SurveyPreview() {
    const {surveyData} = useSurveyData()
    const intl = useIntl()
    const [previewOpen, setPreviewOpen] = useState( localStorage.getItem("previewOpen") ? JSON.parse(localStorage.getItem("previewOpen")) : true)
    return <div className={previewOpen ? "survey-preview" : "survey-preview closed"}>
        <div className={"preview-header"}>
            {previewOpen &&
            <h3>
                {intl.formatMessage(
                    {
                        id: 'survey.preview.preview',
                        defaultMessage: 'Preview',
                    })}
            </h3>
            }
            {previewOpen ?
                <button onClick={() => {
                    localStorage.setItem("previewOpen", JSON.stringify(!previewOpen))
                    setPreviewOpen(!previewOpen)
                }}>
                    <MinimizeIcon/>
                </button> :
                <button onClick={() => {
                    localStorage.setItem("previewOpen", JSON.stringify(!previewOpen))
                    setPreviewOpen(!previewOpen)
                }}>
                    <PathsIcon/>
                </button>
            }
        </div>
        {previewOpen &&
        <div className={"messages"}>
            <div className={"message-container has-steps"}>
                <div className={"message"}>
                    <div className={"message-icon"} title={surveyData.config.message}>
                        <MessageIcon/>
                    </div>
                </div>
                <div className={"message-children"}>
                    <GetPreviewChildren data={surveyData.config} depth={1}/>
                </div>
            </div>
        </div>
        }
    </div>
}

function GetPreviewChildren(props) {
    return <>
        {Object.keys(props.data).filter(key => key.startsWith('branch') || key === 'other').sort()
            .map( (keyValue, i) => {
                return <PreviewChild data={props.data} parentColor={props.parentColor} keyValue={keyValue} i={i} key={i} depth={props.depth} parent={props.parent} parentsParent={props.parentsParent} parentsParentsParent={props.parentsParentsParent}/>
            })}
    </>
}

function PreviewChild(props) {
    let isBranch = props.keyValue.startsWith('branch')
    let icon = getMessageIcon(props, isBranch)
    let color = getBranchIconColor(props, isBranch)

    return <div className={isBranch ? "message-container has-steps" : "message-container"} key={props.i}>
        <div className={"message"}>
            <div className={"message-icon"} title={props.data[props.keyValue].message} style={{backgroundColor:color}}>{icon}</div>
            {props.data[props.keyValue].hasOwnProperty("supportneed") &&
            props.data[props.keyValue]["supportneed"] &&
            <SupportIcon/>
            }
        </div>
            {
                isBranch &&
                <>
                    <div className={"message-children"}>
                        <GetPreviewChildren data={props.data[props.keyValue]} parentColor={color} depth={props.depth + 1} parent={props.keyValue} parentsParent={props.parent} parentsParentsParent={props.parentsParent}/>
                    </div>
                </>
            }
    </div>
}

function SurveyNavigation() {
    const intl = useIntl()
    let { url } = useRouteMatch()

    return <div className={"survey-navigation"}>
        <nav>
            <ul>
                <li>
                    <NavLink to={`${url}/information`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.information',
                                defaultMessage: 'Information',
                            })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={`${url}/messages`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.messages',
                                defaultMessage: 'Messages',
                            })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={`${url}/reminders`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.reminders',
                                defaultMessage: 'Reminders',
                            })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={`${url}/support-needs`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.supportNeeds',
                                defaultMessage: 'Support Needs',
                            })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={`${url}/recipients`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.recipients',
                                defaultMessage: 'Recipients',
                            })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={`${url}/follow-up`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.followUp',
                                defaultMessage: 'Follow Up',
                            })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to={`${url}/results`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.results',
                                defaultMessage: 'Results',
                            })}
                    </NavLink>
                </li>
            </ul>
        </nav>
    </div>
}

function SurveyContent() {
    let { url, path } = useRouteMatch()
    return <div className={"survey-edit"}>
        <Switch>
            <Route path={`${path}/information`}>
                <SurveyInformation />
            </Route>
            <Route path={`${path}/messages`}>
                <SurveyMessages />
            </Route>
            <Route path={`${path}/reminders`}>
                <SurveyReminders />
            </Route>
            <Route path={`${path}/support-needs`}>
                <SurveySupportNeeds />
            </Route>
            <Route path={`${path}/recipients`}>
                <SurveyRecipients />
            </Route>
            <Route path={`${path}/follow-up`}>
                <SurveyFollowUp />
            </Route>
            <Route path={`${path}/results`}>
                <SurveyResults />
            </Route>
            <Route path={path}>
                <Redirect to={`${url}/information`} />
            </Route>
        </Switch>
    </div>
}

function SurveyInformation() {
    const intl = useIntl()
    const {surveyData, setSurveyData} = useSurveyData()
    const limitedEditing = surveyData.status === "IN PROGRESS" || surveyData.status === "FINISHED"
    const surveyFinished = surveyData.status === "FINISHED"
    const surveyName = surveyData.config.title
    const [inputName, setInputName] = useState(surveyName)
    const [startDate, setStartDate] = useState(new Date(formatDate(surveyData.starttime)))
    const [endDate, setEndDate] = useState(new Date(formatDate(surveyData.endtime)))
    let datepickerPlaceholder = intl.formatMessage(
            {
                id: 'survey.information.datepickerPlaceholder',
                defaultMessage: 'Click to select date',
            })
    let dateFormat
    let locale
    let timeFormat
    let timeCaption
    switch (intl.locale) {
        case "en":
            dateFormat = "MMMM d, yyyy, h:mm aa"
            timeFormat = "h:mm aa"
            timeCaption = "Time"
            locale = ""
            break
        case "fi":
            dateFormat = "d. MMMM yyyy, HH:mm"
            timeFormat = "HH:mm"
            timeCaption = "Aika"
            locale = "fi"
            break
        default:
            dateFormat = "MMMM d, yyyy, h:mm aa"
            timeFormat = "h:mm aa"
            timeCaption = "Time"
            locale = ""
    }

    return <>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.navigation.information',
                    defaultMessage: 'Information',
                })}
        </h4>
        <label htmlFor={"survey-name"}>
            {intl.formatMessage(
                {
                    id: 'survey.information.name',
                    defaultMessage: 'Name',
                })}
        </label>
        <input type={"text"} id={"survey-name"}
               value={inputName}
               onChange={e => {
                   setInputName(e.target.value)
                   const newSurveyData = {...surveyData}
                   newSurveyData.config.title = e.target.value
                   setSurveyData(newSurveyData)
               }}
               placeholder={intl.formatMessage(
                       {
                           id: 'survey.information.name.placeholder',
                           defaultMessage: 'Give name for survey',
                       })}/>
        <div className={"survey-time"}>
            <div>
                <label htmlFor={"survey-start"}>
                    {intl.formatMessage(
                        {
                            id: 'survey.information.startTime',
                            defaultMessage: 'Start Time',
                        })}
                </label>
                {limitedEditing ?
                    <DatePicker id={"survey-start"}
                                selectsStart startDate={startDate} endDate={endDate}
                                showTimeSelect timeIntervals={15} timeFormat={timeFormat} timeCaption={timeCaption}
                                selected={startDate}
                                dateFormat={dateFormat} locale={locale}
                                placeholderText={datepickerPlaceholder}
                                readOnly disabled
                    />
                    :
                    <DatePicker id={"survey-start"}
                                selectsStart startDate={startDate} endDate={endDate}
                                showTimeSelect timeIntervals={15} timeFormat={timeFormat} timeCaption={timeCaption}
                                selected={startDate}
                                dateFormat={dateFormat} locale={locale}
                                placeholderText={datepickerPlaceholder}
                                onChange={date => {
                                    setStartDate(date)
                                    const newSurveyData = {...surveyData}
                                    newSurveyData.starttime = dateToServerFormat(date)
                                    setSurveyData(newSurveyData)
                                }}
                    />
                }
            </div>
            <div>
                <label htmlFor={"survey-end"}>
                    {intl.formatMessage(
                        {
                            id: 'survey.information.endTime',
                            defaultMessage: 'End Time',
                        })}
                </label>
                {surveyFinished ?
                    <DatePicker id={"survey-end"}
                                selectsEnd startDate={startDate} endDate={endDate} minDate={startDate}
                                showTimeSelect timeIntervals={15} timeFormat={timeFormat} timeCaption={timeCaption}
                                selected={endDate}
                                dateFormat={dateFormat} locale={locale}
                                placeholderText={datepickerPlaceholder}
                                readOnly disabled
                    />
                    :
                    <DatePicker id={"survey-end"}
                                selectsEnd startDate={startDate} endDate={endDate} minDate={startDate}
                                showTimeSelect timeIntervals={15} timeFormat={timeFormat} timeCaption={timeCaption}
                                selected={endDate}
                                dateFormat={dateFormat} locale={locale}
                                placeholderText={datepickerPlaceholder}
                                onChange={date => {
                                    setEndDate(date)
                                    const newSurveyData = {...surveyData}
                                    newSurveyData.endtime = dateToServerFormat(date)
                                    setSurveyData(newSurveyData)
                                }}
                    />
                }
            </div>
        </div>
        <div className={"sub-group"}>
            <SurveyCoordinators />
        </div>
    </>
}

function SurveyReminders() {
    const {surveyData, setSurveyData} = useSurveyData()
    const surveyFinished = surveyData.status === "FINISHED"
    const intl = useIntl()
    let reminders
    if (surveyData.config.hasOwnProperty('reminders')) {
        reminders = surveyData.config["reminders"]
    } else {
        reminders = []
    }
    const addReminder = () => {
        let newReminder = {
            delay: 24,
            message: ""
        }
        reminders.push(newReminder)
        const newSurveyData = {...surveyData}
        newSurveyData.config["reminders"] = reminders
        setSurveyData(newSurveyData)
    }

    return <>
        <div className={"reminders"}>
            <h4>
                {intl.formatMessage(
                    {
                        id: 'survey.navigation.reminders',
                        defaultMessage: 'Reminders',
                    })}
            </h4>
            {reminders.length < 1 &&
            <p className={"placeholder"}>
                {intl.formatMessage(
                    {
                        id: 'survey.reminderMissing.placeholder',
                        defaultMessage: 'Your survey doesn\'t have any reminders. Start adding by clicking the button below.',
                    })}
            </p>
            }
            {reminders.map((reminder, i) => {
                return <div className={"message reminder"} key={i}>
                    <div className={"message-icon"}>
                        <ReminderIcon />
                    </div>
                    <div className={"message-content"}>
                        <div>
                            <EditableContent text={reminder.message} i={i}/>
                            <ReminderPopup i={i} />
                        </div>
                        <ReminderTools i={i} />
                    </div>
                </div>
            })}
            {surveyFinished ?
                <button className={"add-new-reminder add-new-button"} disabled>
                    {intl.formatMessage(
                        {
                            id: 'survey.reminders.addReminder',
                            defaultMessage: '+ Add reminder',
                        })}
                </button>
                :
                <button className={"add-new-reminder add-new-button"} onClick={addReminder}>
                    {intl.formatMessage(
                        {
                            id: 'survey.reminders.addReminder',
                            defaultMessage: '+ Add reminder',
                        })}
                </button>
            }
        </div>
    </>
}

function ReminderTools({i}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const [reminderTime, setReminderTime] = useState(surveyData.config["reminders"][i].delay)
    const intl = useIntl()
    return <div className={"reminder-tools"}>
        <ReminderIconSmall />
        <input type={"number"} value={reminderTime}
        onChange={e => {
            setReminderTime(e.target.value)
            const newSurveyData = {...surveyData}
            newSurveyData.config["reminders"][i].delay = e.target.value
            setSurveyData(newSurveyData)
        }}/> {intl.formatMessage(
        {
            id: 'survey.reminders.hours',
            defaultMessage: 'hours',
        })}
    </div>
}

function ReminderPopup({i}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const intl = useIntl()
    const deleteReminder = () => {
        const newSurveyData = {...surveyData}
        newSurveyData.config["reminders"].splice(i, 1)
        setSurveyData(newSurveyData)
        setConfirmModalOpen(false)
    }
    return <div className={"options-popover popover-container"}>
        <div className={"popover-toggle"} onClick={() => setPopoverOpen(true)}>
            <OptionsIcon />
        </div>
        {popoverOpen &&
        <Popover closePopover={() => setPopoverOpen(false)}>
            <div className={"delete"} onClick={() => {
                setConfirmModalOpen(true)
                setPopoverOpen(false)
            }}>
                <DeleteIcon />
                {intl.formatMessage(
                    {
                        id: 'survey.message.deleteReminder',
                        defaultMessage: 'Delete Reminder',
                    })}
            </div>
        </Popover>
        }
        {confirmModalOpen &&
        <Modal header={intl.formatMessage(
            {
                id: 'survey.reminders.delete.header',
                defaultMessage:  "Are you sure you want to delete this reminder?",
            })}
               text={intl.formatMessage(
                   {
                       id: 'survey.reminders.delete.text',
                       defaultMessage: "TThis action is irreversible.",
                   })}
               confirmText={intl.formatMessage(
                   {
                       id: 'survey.message.delete',
                       defaultMessage: 'Delete',
                   })}
               alert
               closeModal={() => {
                   setConfirmModalOpen(false)
               }} confirmAction={() => deleteReminder()} />
        }
    </div>
}

function EditableContent(props) {
    const {surveyData, setSurveyData} = useSurveyData()
    const [editorState, setEditorState] = useState(
        () => EditorState.createWithContent(ContentState.createFromText(props.text)),
    )
    const intl = useIntl()
    const editorUpdate = e => {
        setEditorState(e)
        const newSurveyData = {...surveyData}
        newSurveyData.config["reminders"][props.i].message = e.getCurrentContent().getPlainText()
        setSurveyData(newSurveyData)
    }
    return <Editor editorState={editorState} onChange={editorUpdate} placeholder={intl.formatMessage(
        {
            id: 'survey.reminder.placeholder',
            defaultMessage: 'Click to type your reminder',
        })} />
}

function SurveySkeleton() {
    return <div className={"survey-container skeleton-container"}>
        <div className={"survey-header"}>
            <Skeleton width={17} height={17} circle={true} noMargin={true} classText={"back"}/>
            <Skeleton width={250} height={24} noMargin={true}/>
            <Skeleton width={57} height={17} noMargin={true} classText={"status"}/>
            <div className={"save-toolbar"}>
                <Skeleton width={40} height={17} noMargin={true} classText={"cancel"}/>
                <Skeleton width={150} height={40} noMargin={true} classText={"draft"}/>
                <Skeleton width={90} height={40} noMargin={true} classText={"save"}/>
            </div>
        </div>
        <div className={"survey-view"}>
            <div className={"survey-content"}>
                <div className={"survey-navigation"}>
                    <Skeleton width={80} height={20} noMargin={true}/>
                    <Skeleton width={80} height={20} noMargin={true}/>
                    <Skeleton width={80} height={20} noMargin={true}/>
                    <Skeleton width={80} height={20} noMargin={true}/>
                    <Skeleton width={80} height={20} noMargin={true}/>
                </div>
                <div className={"survey-edit"}>
                    <Skeleton width={40} height={20}/>
                    <Skeleton height={55} noMargin={true} classText={"input"}/>
                    <div className={"survey-time"}>
                        <div>
                            <Skeleton width={40} height={20}/>
                            <Skeleton height={55} noMargin={true} classText={"input"}/>
                        </div>
                        <div>
                            <Skeleton width={40} height={20}/>
                            <Skeleton height={55} noMargin={true} classText={"input"}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}