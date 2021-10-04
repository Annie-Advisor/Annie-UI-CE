import {FormattedMessage, useIntl} from "react-intl";
import React, {useEffect, useState} from "react";
import '../scss/SurveyHeader.scss';
import {Link, Prompt, useHistory, useLocation, useParams} from "react-router-dom";
import {ReactComponent as BackArrow} from "../svg/back.svg";
import {Modal, StatusText, Toast} from "../UIElements";
import {useOriginalSurveyData, useOriginalUserSurveyData, useSurveyData, useUserSurveyData} from "./SurveyView";
import {PostSurveyWithId, PostUsersToAnnieUserSurvey, UpdateSurveyWithId} from "../api/APISurvey";
import {formatDate, updateTimeToServerFormat} from "../Formats";
import _ from "lodash";
import {ReactComponent as LoaderIcon} from "../svg/loader.svg";

export default function SurveyHeader() {
    const {surveyData} = useSurveyData()
    const {originalSurveyData} = useOriginalSurveyData()
    const {userSurveyData} = useUserSurveyData()
    const {originalUserSurveyData} = useOriginalUserSurveyData()

    return <HeaderRender
        surveyData={surveyData}
        originalSurveyData={originalSurveyData}
        userSurveyData={userSurveyData}
        originalUserSurveyData={originalUserSurveyData}
    />
}

function HeaderRender({surveyData, originalSurveyData, userSurveyData, originalUserSurveyData}) {
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

    let unsavedChanges = JSON.stringify(surveyData) !== JSON.stringify(originalSurveyData) || JSON.stringify(userSurveyData) !== JSON.stringify(originalUserSurveyData)
    const [showToast, setShowToast] = useState(false)
    const [toastText, setToastText] = useState("")
    const [toastStatus, setToastStatus] = useState("")
    return <>
        <div className={"survey-header"}>
            <Link to="/surveys" className={"back"}>
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
            <SaveEdits setShowToast={(value)=>setShowToast(value)} setToastText={(value)=>setToastText(value)} setToastStatus={(value)=>setToastStatus(value)}/>
            <PromptDialog unsavedChanges={unsavedChanges}/>
        </div>
        <Toast show={showToast} text={toastText} status={toastStatus} hideToast={()=>setShowToast(false)}/>
    </>
}

function PromptDialog({unsavedChanges}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const {userSurveyData} = useUserSurveyData()
    const {originalSurveyData, setOriginalSurveyData} = useOriginalSurveyData()
    const {originalUserSurveyData, setOriginalUserSurveyData} = useOriginalUserSurveyData()
    const surveyUpdate = UpdateSurveyWithId(surveyData.id)
    const [showSavePrompt, setShowSavePrompt] = useState(false)
    const [nextLocationPathname, setNextLocationPathname] = useState("")
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    const annieUserSurveyPost = PostUsersToAnnieUserSurvey()
    const [confirmNavigation, setConfirmNavigation] = useState(false)
    const intl = useIntl()
    let history = useHistory()
    let { surveyId } = useParams()

    useEffect(() => {
        if (confirmNavigation) {
            localStorage.removeItem("stored-"+surveyData.id)
            localStorage.removeItem("userSurveyData-"+surveyData.id)
            localStorage.removeItem("stored-new")
            localStorage.removeItem("userSurveyData-new")
            history.push(nextLocationPathname)
        }
    }, [confirmNavigation, surveyData.id, history, nextLocationPathname])

    const navigateToLink = () => {
        setConfirmNavigation(true)
    }

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

    const saveChanges = () => {
        const newSurveyData = {...surveyData}
        for (const lang in newSurveyData.config.name) {
            if (newSurveyData.config.name[lang].length === 0) {
                let otherLangName
                for (const otherLang in newSurveyData.config.name) {
                    if (newSurveyData.config.name[otherLang].length !== 0) {
                        otherLangName = newSurveyData.config.name[otherLang]
                        break
                    } else {
                        otherLangName = ""
                    }
                }
                newSurveyData.config.name[lang] = otherLangName
            }
        }
        newSurveyData.updated = updateTimeToServerFormat(new Date())
        newSurveyData.updatedby = "Annie Survey Manager"
        if (surveyId === "new") {
            newSurveyData.id = newID
            setSurveyData(newSurveyData)
            surveyPost.mutate(newSurveyData, {
                onError: () => {
                    console.log("New Survey Post error")
                },
                onSuccess: () => {
                    setOriginalSurveyData(newSurveyData)
                    const newAnnieUserSurveyData = [...userSurveyData]
                    newAnnieUserSurveyData.forEach( annieuser => annieuser.survey = newID)
                    annieUserSurveyPost.mutate(newAnnieUserSurveyData, {
                        onError: () => {
                            console.log("Annie user Post error")
                        },
                        onSuccess: () => {
                            setOriginalUserSurveyData(newAnnieUserSurveyData)
                            setConfirmNavigation(true)
                        }
                    })
                }
            })
        } else {
            surveyUpdate.mutate(newSurveyData, {
                onError: () => {
                    console.log("New Survey Post error")
                },
                onSuccess: () => {
                    setOriginalSurveyData(_.cloneDeep(newSurveyData))
                    annieUserSurveyPost.mutate(userSurveyData, {
                        onError: () => {
                            console.log("Annie user Post error")
                        },
                        onSuccess: () => {
                            setOriginalUserSurveyData(_.cloneDeep(userSurveyData))
                            setConfirmNavigation(true)
                        }
                    })
                }
            })
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

function SaveEdits({setShowToast, setToastText, setToastStatus}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const {userSurveyData} = useUserSurveyData()
    const {originalSurveyData, setOriginalSurveyData} = useOriginalSurveyData()
    const {originalUserSurveyData, setOriginalUserSurveyData} = useOriginalUserSurveyData()
    const [buttonPressed, setButtonPressed] = useState("")
    const surveyUpdate = UpdateSurveyWithId(surveyData.id)
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    const annieUserSurveyPost = PostUsersToAnnieUserSurvey()
    let history = useHistory()
    let { surveyId } = useParams()
    let createNewSurvey = surveyId === "new"
    let surveyIsDraft = surveyData.status === "DRAFT"
    const intl = useIntl()
    const [showPublishSummary, setShowPublishSummary] = useState(false)

    function clearLocalStorage() {
        localStorage.removeItem("stored-"+surveyData.id)
        localStorage.removeItem("userSurveyData-"+surveyData.id)
        localStorage.removeItem("stored-new")
        localStorage.removeItem("userSurveyData-new")
    }

    // Display toast after navigating to a new survey that has just been published
    let location = useLocation()
    useEffect(()=> {
        if (location.state && location.state.hasOwnProperty("newSavedSurvey")) {
            if (location.state.newSavedSurvey) {
                setShowToast(true)
                setToastText(intl.formatMessage(
                    {
                        id: 'toast.saveSuccess',
                        defaultMessage: 'Survey Saved!',
                    }))
                setToastStatus("success")
            }
        }
    },[location.state])


    //TODO: Refactor button functions and that statuses are properly set
    const saveSurvey = (newSurvey, draft) => {
        const newSurveyData = {...surveyData}
        for (const lang in newSurveyData.config.name) {
            if (newSurveyData.config.name[lang].length === 0) {
                let otherLangName
                for (const otherLang in newSurveyData.config.name) {
                    if (newSurveyData.config.name[otherLang].length !== 0) {
                        otherLangName = newSurveyData.config.name[otherLang]
                        break
                    } else {
                        otherLangName = ""
                    }
                }
                newSurveyData.config.name[lang] = otherLangName
            }
        }
        newSurveyData.updated = updateTimeToServerFormat(new Date())
        newSurveyData.updatedby = "Annie Survey Manager"
        if (draft) {
            newSurveyData.status = "DRAFT"
        } else {
            if (newSurveyData.status === "DRAFT") {
                newSurveyData.status = "SCHEDULED"
            }
        }
        setSurveyData(newSurveyData)
        if (newSurvey) {
            newSurveyData.id = newID
            surveyPost.mutate(newSurveyData, {
                onError: () => {
                    setShowToast(true)
                    setToastText(intl.formatMessage(
                        {
                            id: 'toast.saveFailed',
                            defaultMessage: 'The save failed. Please try again.',
                        }))
                    setToastStatus("alert")
                },
                onSuccess: () => {
                    setOriginalSurveyData(_.cloneDeep(newSurveyData))
                    const newAnnieUserSurveyData = [...userSurveyData]
                    newAnnieUserSurveyData.forEach( annieuser => annieuser.survey = newID)
                    annieUserSurveyPost.mutate(newAnnieUserSurveyData, {
                        onError: () => {
                            setShowToast(true)
                            setToastText(intl.formatMessage(
                                {
                                    id: 'toast.saveFailed',
                                    defaultMessage: 'The save failed. Please try again.',
                                }))
                            setToastStatus("alert")
                        },
                        onSuccess: () => {
                            clearLocalStorage()
                            history.push(
                                {
                                    pathname: "/survey/"+newID,
                                    state: {newSavedSurvey: true}
                                }
                            )
                        }
                    })
                }
            })
        } else {
            surveyUpdate.mutate(newSurveyData, {
                onError: () => {
                    setShowToast(true)
                    setToastText(intl.formatMessage(
                        {
                            id: 'toast.saveFailed',
                            defaultMessage: 'The save failed. Please try again.',
                        }))
                    setToastStatus("alert")
                },
                onSuccess: () => {
                    setOriginalSurveyData(_.cloneDeep(newSurveyData))
                    annieUserSurveyPost.mutate(userSurveyData, {
                        onError: () => {
                            setShowToast(true)
                            setToastText(intl.formatMessage(
                                {
                                    id: 'toast.saveFailed',
                                    defaultMessage: 'The save failed. Please try again.',
                                }))
                            setToastStatus("alert")
                        },
                        onSuccess: () => {
                            setOriginalUserSurveyData(_.cloneDeep(userSurveyData))
                            clearLocalStorage()
                            setShowToast(true)
                            setToastText(intl.formatMessage(
                                {
                                    id: 'toast.saveSuccess',
                                    defaultMessage: 'Survey Saved!',
                                }))
                            setToastStatus("success")
                        }
                    })
                }
            })
        }
    }
    let draftText, saveText
    draftText = intl.formatMessage(
        {
            id: 'survey.save.save',
            defaultMessage: 'Save',
        })
    saveText = intl.formatMessage(
        {
            id: 'survey.save.publish',
            defaultMessage: 'Publish',
        })
    if (!surveyIsDraft) {
        draftText = intl.formatMessage(
            {
                id: 'survey.save.draft',
                defaultMessage: 'Change to draft',
            })
    }
    if (!surveyIsDraft && !createNewSurvey) {
        saveText = intl.formatMessage(
            {
                id: 'survey.save.save',
                defaultMessage: 'Save',
            })
    }

    return <>
        <div className={"save-toolbar"}>
            <button className={"cancel"} onClick={()=>{
                history.push("/surveys/")
                clearLocalStorage()
            }}>
                {intl.formatMessage(
                    {
                        id: 'survey.save.cancel',
                        defaultMessage: 'Cancel',
                    })}
            </button>
            {surveyUpdate.isLoading || surveyPost.isLoading ?
                <>
                    <button className={"draft"} disabled>
                        <LoaderIcon/>
                    </button>
                    <button className={"save"} disabled>
                        <LoaderIcon/>
                    </button>
                </> :
                <>
                    <button className={"draft"} onClick={() => {
                        saveSurvey(createNewSurvey, true)
                    }}>
                        {draftText}
                    </button>
                    <button className={"save"} onClick={() => {
                        // setShowPublishSummary(true)
                        saveSurvey(createNewSurvey)
                    }}>
                        {saveText}
                    </button>
                </>
            }
        </div>
        {showPublishSummary &&
        <Modal
            closeModal={()=>setShowPublishSummary(false)}
            header={"Survey Summary"}
            confirmAction={()=>saveSurvey(createNewSurvey)}
            confirmText={saveText}
        >
            <SurveySummary />
            </Modal>
        }
    </>
}

function SurveySummary() {
    const {surveyData} = useSurveyData()
    const {userSurveyData} = useUserSurveyData()
    const intl = useIntl()
    let surveyName, startTime, endTime
    switch (intl.locale) {
        case "en":
            surveyName = surveyData.config.name.en
            startTime = new Date(formatDate(surveyData.starttime)).toLocaleString("en-US")
            endTime = new Date(formatDate(surveyData.endtime)).toLocaleString("en-US")
            break
        case "fi":
            surveyName = surveyData.config.name.fi
            startTime = new Date(formatDate(surveyData.starttime)).toLocaleString("fi")
            endTime = new Date(formatDate(surveyData.endtime)).toLocaleString("fi")
            break
        default:
            surveyName = surveyData.config.name.en
            startTime = new Date(formatDate(surveyData.starttime)).toLocaleString("en-US")
            endTime = new Date(formatDate(surveyData.endtime)).toLocaleString("en-US")
    }

    return <div className={"survey-summary-container"}>
        <div>
            <p>
                {intl.formatMessage(
                    {
                        id: 'survey.information.name',
                        defaultMessage: 'Name',
                    })}
            </p>
            <p className={"fake-input"}>
                {surveyName}
            </p>
        </div>
        <div className={"dual"}>
            <div>
                <p>
                    {intl.formatMessage(
                    {
                        id: 'survey.information.startTime',
                        defaultMessage: 'Start Time',
                    })}
                </p>
                <p className={"fake-input"}>{startTime}</p>
            </div>
            <div>
                <p>
                    {intl.formatMessage(
                        {
                            id: 'survey.information.endTime',
                            defaultMessage: 'End Time',
                        })}
                </p>
                <p className={"fake-input"}>{endTime}</p>
            </div>
        </div>
        <div>
            <p>
                {intl.formatMessage({
                    id: 'survey.supportNeeds',
                    defaultMessage: 'Support Needs',
                })}
            </p>
            <div className={"support-needs-container"}>

            </div>
        </div>
    </div>
}