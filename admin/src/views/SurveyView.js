import React, {useContext, useEffect, useMemo, useState} from "react";
import '../scss/SurveyView.scss';
import {Link, NavLink, Redirect, Route, Switch, useParams, useRouteMatch, useHistory, Prompt} from "react-router-dom";
import {GetSurveyWithId, PostSurveyWithId, UpdateSurveyWithId} from "../api/APISurvey";
import {FormattedMessage, useIntl} from "react-intl";
import {getBranchIconColor, getMessageIcon, Modal, Popover, Skeleton, StatusText} from "../UIElements";
import {ReactComponent as BackArrow} from "../svg/back.svg";
import DatePicker, {registerLocale} from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css";
import fi from "date-fns/locale/fi";
import {dateToServerFormat, formatDate, updateTimeToServerFormat} from "../Formats";
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
import {LocaleContext} from "../LocaleContext";
registerLocale("fi", fi)

const SurveyContext = React.createContext({
    surveyContext: {
        config: {},
        contacts: null,
        endtime: "",
        id: "",
        starttime: "",
        status: null,
        updated: "",
        updatedby: ""
    },
    setSurveyContext: () => {}
})

const newSurveyData = [{
    "id": "new",
    "updated": "",
    "updatedby": "Annie",
    "starttime": dateToServerFormat(new Date()),
    "endtime": dateToServerFormat(new Date()),
    "config": {
        "name": {
            "en": "",
            "fi": ""
        },
        "message": ""
    },
    "status": "DRAFT",
    "contacts": null
}]

export default function SurveyView() {
    let { surveyId } = useParams()
    const {status, data, error} = surveyId === "new" ? {status: "success", data: newSurveyData, error: null} : GetSurveyWithId(surveyId)
    let surveyData
    let storageData
    let originalData
    if (status !== "loading" && status !== "error") {
        originalData = _.cloneDeep(data[0])
        surveyData = _.cloneDeep(data[0])
        if (localStorage.getItem("stored-"+surveyData.id)) {
            storageData = JSON.parse(localStorage.getItem("stored-"+surveyData.id))
            if (storageData.updated >= surveyData.updated) {
                surveyData = storageData
            }
        }
    }

    return <>
        <div className={"survey-container"}>
            {
                // TODO: Create skeleton elements for when loading data
                status === "loading" ? <span>Loading</span> :
                    status === "error" ? <span>Error: {error.message}</span> :
                        <>
            <ContextOfSurvey status={status} surveyContext={surveyData} originalData={originalData}/>
                        </>
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

function ContextOfSurvey({status, surveyContext, originalData}) {
    return <SurveyProvider surveyContext={surveyContext}>
        <SurveyHeader originalData={originalData} />
        <div className={"survey-view"}>
            <div className={"survey-content"}>
                <SurveyNavigation />
                <SurveyContent status={status}/>
            </div>
            <SurveyPreview />
        </div>
    </SurveyProvider>
}

function SurveyHeader({originalData}) {
    const {surveyData} = useSurveyData()
    const intl = useIntl()
    let surveyName
    switch (intl.locale) {
        case "en":
            surveyName = surveyData.config.name.en
            break
        case "fi":
            surveyName = surveyData.config.name.fi
            break
        default:
            surveyName = surveyData.config.name.en
    }
    let name
    if (surveyData.id === "new" && !surveyName) {
        name = intl.formatMessage(
            {
                id: 'survey.header.newSurvey',
                defaultMessage: 'New Survey',
            })
    } else {
        name = surveyName
    }
    let unsavedChanges = JSON.stringify(surveyData) !== JSON.stringify(originalData)

    return <div className={"survey-header"}>
        <Link to="/surveys">
            <BackArrow />
        </Link>
        <h3>{name}</h3>
        <StatusText survey={surveyData}/>
        {unsavedChanges &&
            <p className={"unsaved-changes"}>
                {intl.formatMessage({
                    id: 'survey.header.unsavedChanges',
                    defaultMessage: 'Unsaved changes',
                })}
            </p>
        }
        <SaveEdits />
        <PromptDialog unsavedChanges={unsavedChanges}/>
    </div>
}

function PromptDialog({unsavedChanges}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const [showSavePrompt, setShowSavePrompt] = useState(false)
    const [nextLocationPathname, setNextLocationPathname] = useState(null)
    const [confirmNavigation, setConfirmNavigation] = useState(false)
    const intl = useIntl()
    let history = useHistory()
    let { surveyId } = useParams()

    const checkForNextLocation = (nextLocation) => {
        setNextLocationPathname(nextLocation.pathname)
        if (confirmNavigation) {
            return true
        }
        if (nextLocation.pathname === "/surveys" || nextLocation.pathname === "/contacts" || nextLocation.pathname === "/users") {
            setShowSavePrompt(true)
            return false
        }
        return true
    }

    const cancelPrompt = () => {
        setShowSavePrompt(false)
    }

    const navigateToLink = () => {
        setConfirmNavigation(true)
    }

    useEffect(()=>{
        if (confirmNavigation) {
            history.push(nextLocationPathname)
            localStorage.removeItem("stored-"+surveyData.id)
        }
    },[confirmNavigation])

    // Send update to API
    const surveyUpdate = UpdateSurveyWithId(surveyData.id)
    const [newSurveyUpdateToAPI, setNewSurveyUpdateToAPI] = useState(null)
    useEffect(() => {
        if (newSurveyUpdateToAPI) {
            surveyUpdate.mutateAsync(surveyData).then( () => {
                setConfirmNavigation(true)
            })
        }
    }, [newSurveyUpdateToAPI])

    // Post new survey to API
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    const [newSurveyToAPI, setNewSurveyToAPI] = useState(null)
    useEffect(() => {
        if (newSurveyToAPI) {
            surveyPost.mutateAsync(surveyData).then( () => {
                setConfirmNavigation(true)
            })
        }
    }, [newSurveyToAPI])

    const saveChanges = () => {
        const newSurveyData = {...surveyData}
        if (surveyId === "new") {
            newSurveyData.id = newID
            newSurveyData.updated = updateTimeToServerFormat(new Date())
            newSurveyData.updatedby = "Annie Survey Manager"
            newSurveyData.status = "DRAFT"
            setSurveyData(newSurveyData)
            setNewSurveyToAPI(newSurveyData)
        } else {
            newSurveyData.updated = updateTimeToServerFormat(new Date())
            newSurveyData.updatedby = "Annie Survey Manager"
            setNewSurveyUpdateToAPI(newSurveyData)
        }
    }
    return <>
        <Prompt
        when={unsavedChanges}
        message={checkForNextLocation}
    />
    {showSavePrompt &&
    <Modal header={intl.formatMessage({
        id: 'survey.unsavedChanges.header',
        defaultMessage: 'Save changes to survey?',
    })}
           text={<FormattedMessage
               id={"survey.unsavedChanges.text"}
               defaultMessage={"Do you wish to save changes before leaving page?{br}Any unsaved changes will be lost."}
               values={{br: <br/>}}/>
           }
           discardText={intl.formatMessage({
               id: 'survey.unsavedChanges.discard',
               defaultMessage: "Don't save",
           })}
           confirmText={intl.formatMessage({
               id: 'survey.unsavedChanges.confirm',
               defaultMessage: 'Save changes',
           })}
           discardAction={navigateToLink}
           closeModal={cancelPrompt}
           confirmAction={saveChanges}
    />
    }
    </>
}

function SaveEdits() {
    const intl = useIntl()
    const {surveyData, setSurveyData} = useSurveyData()
    const surveyUpdate = UpdateSurveyWithId(surveyData.id)
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    let createNewSurvey
    let { surveyId } = useParams()
    if (surveyId === "new") {
       createNewSurvey = true
    }
    let surveyIsDraft = surveyData.status === "DRAFT"

    // Send update to API
    const [newSurveyUpdateToAPI, setNewSurveyUpdateToAPI] = useState(null)
    useEffect(() => {
        if (newSurveyUpdateToAPI) {
            surveyUpdate.mutateAsync(surveyData).then( () => {
                history.push("/surveys/")
                localStorage.removeItem("stored-"+surveyData.id)
            })
        }
    }, [newSurveyUpdateToAPI])

    // Post new survey to API
    const [newSurveyToAPI, setNewSurveyToAPI] = useState(null)
    let history = useHistory()
    useEffect(() => {
        if (newSurveyToAPI) {
            surveyPost.mutateAsync(surveyData).then( () => {
                history.push("/surveys/")
                localStorage.removeItem("stored-"+surveyData.id)
            })
        }
    }, [newSurveyToAPI])

    //TODO: Refactor button functions and that statuses are properly set

    return <div className={"save-toolbar"}>
        <button className={"cancel"} onClick={()=>{
            history.push("/surveys/")
            localStorage.removeItem("stored-"+surveyData.id)}
        }>
            {intl.formatMessage(
                {
                    id: 'survey.save.cancel',
                    defaultMessage: 'Cancel',
                })}
        </button>
        {createNewSurvey ?
            <button className={"draft"} onClick={() => {
                const newSurveyData = {...surveyData}
                newSurveyData.id = newID
                newSurveyData.updated = updateTimeToServerFormat(new Date())
                newSurveyData.updatedby = "Annie Survey Manager"
                newSurveyData.status = "DRAFT"
                setSurveyData(newSurveyData)
                setNewSurveyToAPI(newSurveyData)
            }}>
                {intl.formatMessage(
                    {
                        id: 'survey.save.finishLater',
                        defaultMessage: 'Finish Later',
                    })}
            </button>
            :
            <button className={"draft"} onClick={() => {
                const newSurveyData = {...surveyData}
                newSurveyData.updated = updateTimeToServerFormat(new Date())
                newSurveyData.updatedby = "Annie Survey Manager"
                newSurveyData.status = "DRAFT"
                setSurveyData(newSurveyData)
                setNewSurveyUpdateToAPI(newSurveyData)
            }}>
                {surveyIsDraft ?
                    intl.formatMessage(
                        {
                            id: 'survey.save.finishLater',
                            defaultMessage: 'Finish Later',
                        }) :
                    intl.formatMessage(
                        {
                            id: 'survey.save.draft',
                            defaultMessage: 'Change to draft',
                        })
                }
            </button>
        }

        {surveyUpdate.isLoading ? (
            <button disabled className={"save"}>
                <LoaderIcon/>
            </button>
        ) : (
            <>
                {surveyUpdate.isError &&
                <button className={"save"} onClick={() => {surveyUpdate.mutate(surveyData)}}>
                    Try again
                </button>
                }
                {surveyUpdate.isSuccess &&
                <button className={"save"} onClick={() => {surveyUpdate.mutate(surveyData)}}>
                    Saved ✓
                </button>
                }
                {surveyPost.isSuccess &&
                <button className={"save"} onClick={() => {surveyPost.mutate(surveyData)}}>
                    Published ✓
                </button>
                }
                {!surveyUpdate.isSuccess && !surveyUpdate.isError && !createNewSurvey && !surveyIsDraft &&
                <button className={"save"} onClick={() => {
                    const newSurveyData = {...surveyData}
                    newSurveyData.updated = updateTimeToServerFormat(new Date())
                    newSurveyData.updatedby = "Annie Survey Manager"
                    setSurveyData(newSurveyData)
                    setNewSurveyUpdateToAPI(newSurveyData)
                }}>
                    {intl.formatMessage(
                        {
                            id: 'survey.save.update',
                            defaultMessage: 'Update',
                        })}
                </button>
                }
                {!surveyPost.isSuccess && !surveyPost.isError && createNewSurvey &&
                <button className={"save"} onClick={() => {
                    const newSurveyData = {...surveyData}
                    newSurveyData.id = newID
                    newSurveyData.updated = updateTimeToServerFormat(new Date())
                    newSurveyData.updatedby = "Annie Survey Manager"
                    newSurveyData.status = null
                    setSurveyData(newSurveyData)
                    setNewSurveyToAPI(newSurveyData)
                }}>
                    {intl.formatMessage(
                        {
                            id: 'survey.save.publish',
                            defaultMessage: 'Publish',
                        })}
                </button>
                }
                {surveyIsDraft && !createNewSurvey &&
                <button className={"save"} onClick={() => {
                    const newSurveyData = {...surveyData}
                    newSurveyData.updated = updateTimeToServerFormat(new Date())
                    newSurveyData.updatedby = "Annie Survey Manager"
                    newSurveyData.status = null
                    setSurveyData(newSurveyData)
                    setNewSurveyUpdateToAPI(newSurveyData)
                }}>
                    {intl.formatMessage(
                        {
                            id: 'survey.save.publish',
                            defaultMessage: 'Publish',
                        })}
                </button>
                }
            </>
        )}
    </div>
}

function SurveyPreview() {
    const {surveyData} = useSurveyData()
    const intl = useIntl()
    const [previewOpen, setPreviewOpen] = useState(true)
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
                <button onClick={() => setPreviewOpen(!previewOpen)}>
                    <MinimizeIcon/>
                </button> :
                <button onClick={() => setPreviewOpen(!previewOpen)}>
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
        {Object.keys(props.data).filter(key => key.startsWith('branch') || key === 'other')
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
                    <NavLink to={`${url}/support-categories`}>
                        {intl.formatMessage(
                            {
                                id: 'survey.navigation.supportCategories',
                                defaultMessage: 'Support Categories',
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
            </ul>
        </nav>
    </div>
}

function SurveyContent({status}) {
    let { url, path } = useRouteMatch()
    if (status === "loading") {
        return <div className={"survey-edit"}>
            <Skeleton height={30} /><Skeleton height={30} width={200} />
            </div>
    }
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
            <Route path={`${path}/support-categories`}>
                <SupportCategories />
            </Route>
            <Route path={`${path}/recipients`}>
                <SurveyRecipients />
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
    let surveyName
    switch (intl.locale) {
        case "en":
            surveyName = surveyData.config.name.en
            break
        case "fi":
            surveyName = surveyData.config.name.fi
            break
        default:
            surveyName = surveyData.config.name.en
    }
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
    // TODO: fix date gets forgotten from context when switching languages

    return <>
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
                   newSurveyData.config.name[intl.locale] = e.target.value
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
            </div>
            <div>
                <label htmlFor={"survey-end"}>
                    {intl.formatMessage(
                        {
                            id: 'survey.information.endTime',
                            defaultMessage: 'End Time',
                        })}
                </label>
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
            </div>
        </div>
    </>
}

function SurveyReminders() {
    const {surveyData, setSurveyData} = useSurveyData()
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
            <button className={"add-new-reminder"} onClick={addReminder}>
                {intl.formatMessage(
                    {
                        id: 'survey.reminders.addReminder',
                        defaultMessage: '+ Add reminder',
                    })}
            </button>
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

function SupportCategories() {
    const intl = useIntl()
    return <>
        <h1>
            {intl.formatMessage(
                {
                    id: 'survey.navigation.supportCategories',
                    defaultMessage: 'Support Categories',
                })}
        </h1>
    </>
}

function SurveyRecipients() {
    const intl = useIntl()
    return <>
        <h1>
            {intl.formatMessage(
                {
                    id: 'survey.navigation.recipients',
                    defaultMessage: 'Recipients',
                })}
        </h1>
    </>
}