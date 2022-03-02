import {
    archiveSurveyWithId,
    GetSurveys, GetUser,
    GetUserBySurvey,
    PostSurveyWithId,
    PostUsersToAnnieUserSurvey,
    UpdateSurveyWithId
} from "../api/APISurvey"
import "../scss/Surveys.scss"
import {useIntl} from "react-intl"
import {formatDate, updateTimeToServerFormat} from "../Formats"
import {Popover, Popup, Skeleton, StatusText} from "../UIElements"
import { ReactComponent as Loader } from "../svg/loader.svg"
import { ReactComponent as PlusIcon } from "../svg/plus.svg"
import {ReactComponent as OptionsIcon} from "../svg/options.svg";
import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {ReactComponent as DuplicateIcon} from "../svg/duplicate.svg";
import {ReactComponent as SortOrderIcon} from "../svg/order.svg";
import {ReactComponent as ArchiveIcon} from "../svg/archive.svg";
import {ReactComponent as DeleteIcon} from "../svg/delete-s.svg";
import {ReactComponent as Chevron} from "../svg/chevron.svg";
import {queryClient, useAuthData, useCurrentUserData} from "../App";
import _ from "lodash"

export default function Surveys() {
    const showStatusFromStorage = localStorage.getItem("showStatus")
    const [showStatus, setShowStatus] = useState(showStatusFromStorage ? showStatusFromStorage : "all")
    let showStatusForAPI
    switch (showStatus) {
        case "scheduled":
            showStatusForAPI = "SCHEDULED"
            break
        case "finished":
            showStatusForAPI = "FINISHED"
            break
        case "inProgress":
            showStatusForAPI = "IN PROGRESS"
            break
        case "archived":
            showStatusForAPI = "ARCHIVED"
            break
        case "draft":
            showStatusForAPI = "DRAFT"
            break
        default:
            showStatusForAPI = null
    }
    const { status, data, error, isFetching, refetch } = GetSurveys(showStatusForAPI)
    useEffect(()=>{
        refetch()
    },[showStatusForAPI])
    const intl = useIntl()
    const sortMethodFromStorage = localStorage.getItem("sortMethod")
    const sortDirectionFromStorage = localStorage.getItem("sortDirection")
    const groupingSpanFromStorage = localStorage.getItem("groupingSpan")
    const [sortMethod, setSortMethod] = useState(sortMethodFromStorage ? sortMethodFromStorage : "updated")
    const [sortDirection, setSortDirection] = useState(sortDirectionFromStorage ? JSON.parse(sortDirectionFromStorage) : false)
    const [searchText, setSearchText] = useState("")
    const [groupingSpan, setGroupingSpan] = useState(groupingSpanFromStorage ? groupingSpanFromStorage : "month")
    let searchData, searchGroups
    if (status === 'success') {
        searchData = data.filter(survey => survey.config && survey.config.hasOwnProperty("title") && survey.config.title.toLowerCase().includes(searchText.toLowerCase()))
        if (sortMethod === "alphabetical") {
            sortDirection ?
            searchData.sort((a, b) => b.config.title.localeCompare(a.config.title)) :
                searchData.sort((a, b) => a.config.title.localeCompare(b.config.title))
        }
        if (sortMethod === "updated") {
            sortDirection ?
                searchData.sort((a, b) => b.updated.localeCompare(a.updated)) :
                searchData.sort((a, b) => a.updated.localeCompare(b.updated))
        }
        if (sortMethod === "starttime") {
            sortDirection ?
                searchData.sort((a, b) => b.starttime.localeCompare(a.starttime)) :
                searchData.sort((a, b) => a.starttime.localeCompare(b.starttime))
        }
        if (sortMethod === "endtime") {
            sortDirection ?
                searchData.sort((a, b) => b.endtime.localeCompare(a.endtime)) :
                searchData.sort((a, b) => a.endtime.localeCompare(b.endtime))
        }
        if (groupingSpan === "day" && sortMethod !== "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e[sortMethod].slice(0,10))
        }
        if (groupingSpan === "month" && sortMethod !== "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e[sortMethod].slice(0,7))
        }
        if (groupingSpan === "year" && sortMethod !== "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e[sortMethod].slice(0,4))
        }
        if (sortMethod === "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e.config.title)
        }
    }

    return (
        <div className={"content"}>
            <h1>
                {intl.formatMessage(
                    {
                        id: 'main.surveys.surveys',
                        defaultMessage: 'Surveys',
                    }
                )}
            </h1>
            <Link to={`/survey/new`} className={"create-new button"}>
                <PlusIcon />
                {intl.formatMessage(
                    {
                        id: 'main.surveys.createNew',
                        defaultMessage: 'Create New Survey',
                    }
                )}
            </Link>
            <div className={"surveys-layout"}>
                <div className={"surveys-sidebar"}>
                    <div className={"survey-sidebar-container"}>
                        <div className={"search-sort-surveys"}>
                            <input type={"text"} className={"search"} value={searchText}
                                   onChange={e => {
                                       setSearchText(e.target.value)
                                   }}
                                   placeholder={intl.formatMessage(
                                       {
                                           id: 'main.surveys.search.placeholder',
                                           defaultMessage: 'Search for survey',
                                       })}/>
                        </div>
                        <form onChange={e => {
                            localStorage.setItem("showStatus", e.target.value)
                            setShowStatus(e.target.value)
                        }}>
                            <fieldset className={"radio-group"}>
                                <legend>
                                    {intl.formatMessage(
                                        {
                                            id: 'main.surveys.showByStatus',
                                            defaultMessage: 'Show by Status',
                                        })}
                                </legend>
                                <div>
                                    <input type="radio" id="all-surveys" name="show-by-status" value={"all"} defaultChecked={showStatus === "all"}/>
                                    <label htmlFor="all-surveys">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.status.all',
                                                defaultMessage: 'All',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="draft-surveys" name="show-by-status" value={"draft"} defaultChecked={showStatus === "draft"}/>
                                    <label htmlFor="draft-surveys">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.status.draft',
                                                defaultMessage: 'Draft',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="scheduled-surveys" name="show-by-status" value={"scheduled"} defaultChecked={showStatus === "scheduled"}/>
                                    <label htmlFor="scheduled-surveys">
                                        {intl.formatMessage(
                                        {
                                            id: 'main.surveys.status.scheduled',
                                            defaultMessage: 'Scheduled',
                                        })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="in-progress-surveys" name="show-by-status" value={"inProgress"} defaultChecked={showStatus === "inProgress"}/>
                                    <label htmlFor="in-progress-surveys">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.status.inProgress',
                                                defaultMessage: 'In Progress',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="finished-surveys" name="show-by-status" value={"finished"} defaultChecked={showStatus === "finished"}/>
                                    <label htmlFor="finished-surveys">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.status.finished',
                                                defaultMessage: 'Finished',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="archived-surveys" name="show-by-status" value={"archived"} defaultChecked={showStatus === "archived"}/>
                                    <label htmlFor="archived-surveys">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.status.archived',
                                                defaultMessage: 'Archived',
                                            })}
                                    </label>
                                </div>
                            </fieldset>
                        </form>
                        <form onChange={e => {
                            setSortMethod(e.target.value)
                            localStorage.setItem("sortMethod", e.target.value)
                        }}>
                            <fieldset className={"radio-group"}>
                                <legend className={"toggle-header"} onClick={()=> {
                                    setSortDirection(!sortDirection)
                                    localStorage.setItem("sortDirection", JSON.stringify(!sortDirection))
                                }} role="button" aria-pressed={sortDirection} aria-label={"Change Sort Direction"}>
                                    {intl.formatMessage(
                                        {
                                            id: 'main.surveys.sort',
                                            defaultMessage: 'Sort by',
                                        })}
                                    <span className={!sortDirection ? "asc sort-icon" : "desc sort-icon"}>
                                        <SortOrderIcon />
                                    </span>
                                </legend>
                                <div>
                                    <input type="radio" id="sort-by-updated" name="sort-by" value={"updated"} defaultChecked={sortMethod === "updated"}/>
                                    <label htmlFor="sort-by-updated">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.sort.updated',
                                                defaultMessage: 'Updated',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="sort-by-alphabetical" name="sort-by" value={"alphabetical"} defaultChecked={sortMethod === "alphabetical"}/>
                                    <label htmlFor="sort-by-alphabetical">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.sort.alphabetical',
                                                defaultMessage: 'Alphabetical',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="sort-by-starttime" name="sort-by" value={"starttime"} defaultChecked={sortMethod === "starttime"}/>
                                    <label htmlFor="sort-by-starttime">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.sort.starttime',
                                                defaultMessage: 'Start Time',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="sort-by-endtime" name="sort-by" value={"endtime"} defaultChecked={sortMethod === "endtime"}/>
                                    <label htmlFor="sort-by-endtime">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.sort.endtime',
                                                defaultMessage: 'End Time',
                                            })}
                                    </label>
                                </div>
                            </fieldset>
                        </form>
                        <form disabled={sortMethod === "alphabetical"} onChange={e => {
                            setGroupingSpan(e.target.value)
                            localStorage.setItem("groupingSpan", e.target.value)
                        }}>
                            <fieldset className={"radio-group"}>
                                <legend>{intl.formatMessage(
                                    {
                                        id: 'main.surveys.group',
                                        defaultMessage: 'Group by',
                                    })}
                                </legend>
                                <div>
                                    <input type="radio" id="span-day" name="grouping-span" value={"day"} defaultChecked={groupingSpan === "day"}/>
                                    <label htmlFor="span-day">
                                        {intl.formatMessage(
                                        {
                                            id: 'main.surveys.group.day',
                                            defaultMessage: 'Day',
                                        })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="span-month" name="grouping-span" value={"month"} defaultChecked={groupingSpan === "month"}/>
                                    <label htmlFor="span-month">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.group.month',
                                                defaultMessage: 'Month',
                                            })}
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="span-year" name="grouping-span" value={"year"} defaultChecked={groupingSpan === "year"}/>
                                    <label htmlFor="span-year">
                                        {intl.formatMessage(
                                            {
                                                id: 'main.surveys.group.year',
                                                defaultMessage: 'Year',
                                            })}
                                    </label>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
                <div className={"surveys-main"}>
                    <div className={sortMethod === "alphabetical" ? "surveys surveys-container" : "surveys"}>
                        {
                            status === "loading" ? <LoadingSkeleton /> :
                                status === "error" ? <span>Error: {error.message}</span> :
                                    <>
                                        {!_.isEmpty(searchGroups) ?
                                            sortMethod === "alphabetical" ?
                                                searchData.map((survey) => (
                                                    <Survey survey={survey} key={survey.id} refetch={()=>refetch()}/>
                                                )) :
                                                Object.keys(searchGroups).map((group, i) => (
                                                    <SearchGroup searchGroups={searchGroups} group={group} groupingSpan={groupingSpan} key={i} refetch={()=>refetch()}/>
                                                ))
                                            :
                                            <p>
                                                {intl.formatMessage(
                                                    {
                                                        id: 'main.surveys.noSurveys',
                                                        defaultMessage: 'No surveys to display.',
                                                    })}
                                            </p>}
                                        {isFetching ? <div className={"loader-container"}><Loader /></div> : ""}
                                    </>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

function SearchGroup({searchGroups, group, groupingSpan, refetch}) {
    const [groupVisibility, setGroupVisibility] = useState(true)
    const intl = useIntl()
    let date = new Date(formatDate(group))
    let dateDisplay
    let locale = (intl.locale === "es" || intl.locale === "it") ? "en" : intl.locale
    switch (groupingSpan) {
        case "day":
            dateDisplay = date.getDate() + " " + date.toLocaleString(locale, { month: 'long' }) + " " + date.getFullYear()
            break
        case "month":
            dateDisplay = date.toLocaleString(locale, { month: 'long' }) + " " + date.getFullYear()
            break
        case "year":
            dateDisplay = date.getFullYear()
            break
        default:
            dateDisplay = date.getMonth()
    }
    return <div className={"search-group"}>
        <div className={"group-divider"} onClick={()=>setGroupVisibility(!groupVisibility)}>
            <p>
                <span className={groupVisibility ? "chevron" : "chevron closed"}>
                    <Chevron />
                </span>
                {dateDisplay}
            </p>
        </div>
        {groupVisibility &&
        <div className={"surveys-container"}>
            {searchGroups[group].map((survey => (
                <Survey survey={survey} key={survey.id} refetch={refetch}/>
            )))}
        </div>
        }
    </div>
}

function Survey({survey, refetch}) {
    const config = survey.config
    const [showDuplicatePopup, setShowDuplicatePopup] = useState(false)
    const [showArchivePopup, setShowArchivePopup] = useState(false)
    const [showDeletePopup, setShowDeletePopup] = useState(false)
    let startTime = new Date(formatDate(survey.starttime))
    let endTime = new Date(formatDate(survey.endtime))
    const surveyName = config.title

    return <>
        <Link to={`/survey/${survey.id}`} className={survey.status === "DRAFT" ? "survey draft" : "survey"}>
            <OptionsPopover surveyData={survey}
                            setShowDuplicatePopup={() => setShowDuplicatePopup(true)}
                            setShowArchivePopup={() => setShowArchivePopup(true)}
                            setShowDeletePopup={() => setShowDeletePopup(true)}/>
            <h3>
                {surveyName}
            </h3>
            <p>
                {startTime.getDate()}.{startTime.getMonth()+1}.{startTime.getFullYear()} {startTime.getHours()}.{startTime.getMinutes() < 10 ? '0' : ""}{startTime.getMinutes()} –<br/>
                {endTime.getDate()}.{endTime.getMonth()+1}.{endTime.getFullYear()} {endTime.getHours()}.{endTime.getMinutes() < 10 ? '0' : ""}{endTime.getMinutes()}
            </p>
            <StatusText survey={survey}/>
        </Link>
        {showDuplicatePopup &&
            <CopyPopup survey={survey} closePopup={()=>setShowDuplicatePopup(false)} refetch={refetch}/>
        }
        {showArchivePopup &&
            <ArchivePopup survey={survey} closePopup={()=>setShowArchivePopup(false)} refetch={refetch}/>
        }
        {showDeletePopup &&
            <DeletePopup survey={survey} closePopup={()=>setShowDeletePopup(false)} refetch={refetch}/>
        }
    </>
}

function DeletePopup({survey, closePopup, refetch}) {
    const surveyUpdate = UpdateSurveyWithId(survey.id)
    const {authData} = useAuthData()
    const intl = useIntl()

    const deleteSurvey = () => {
        const newSurveyData = {...survey}
        newSurveyData.status = "DELETED"
        newSurveyData.updatedby = authData.uid
        newSurveyData.updated = updateTimeToServerFormat(new Date())
        surveyUpdate.mutate(newSurveyData, {
            // TODO: add toasts to describe what happened
            onError: () => {
                console.log("Setting Survey state to deleted failed")
            },
            onSuccess: () => {
                console.log("Survey Deleted Succesfully")
                closePopup()
                refetch()
            }
        })
    }

    return <Popup closePopup={() => closePopup()}>
        <h1>
            {intl.formatMessage({
                id: 'survey.delete.header',
                defaultMessage: 'Delete Survey',
            })}
            <b> {survey.config.title}</b>
        </h1>
        <p>
            {intl.formatMessage({
                id: 'survey.delete.text',
                defaultMessage: 'Are you sure you want to delete this survey?',
            })}
        </p>
        <div className={"modal-options"}>
            <button className={"cancel"} onClick={()=>closePopup()}>
                {intl.formatMessage({
                    id: 'modal.cancel',
                    defaultMessage: 'Cancel',
                })}
            </button>
            <button className={"confirm alert"} onClick={()=>deleteSurvey()}>
                {intl.formatMessage({
                    id: 'survey.delete',
                    defaultMessage: 'Delete',
                })}
            </button>
        </div>
    </Popup>
}

function ArchivePopup({survey, closePopup, refetch}) {
    const intl = useIntl()

    const archiveSurvey = () => {
        archiveSurveyWithId(survey.id).then( (response) => {
            console.log(response)
            console.log("Survey archived successfully")
            closePopup()
            refetch()
        }).catch((error)=>{
            console.log("Archiving survey failed.")
            console.error(error)
        })
    }

    return <Popup closePopup={() => closePopup()}>
        <h1>
            {intl.formatMessage({
                id: 'survey.archive.header',
                defaultMessage: 'Archive Survey',
            })}
            <b> {survey.config.title}</b>
        </h1>
        <p>
            {intl.formatMessage({
                id: 'survey.archive.text',
                defaultMessage: 'Are you sure you want to archive this survey?',
            })}
        </p>
        <div className={"modal-options"}>
            <button className={"cancel"} onClick={()=>closePopup()}>
                {intl.formatMessage({
                    id: 'modal.cancel',
                    defaultMessage: 'Cancel',
                })}
            </button>
            <button className={"confirm"} onClick={()=>archiveSurvey()}>
                {intl.formatMessage({
                    id: 'survey.archive',
                    defaultMessage: 'archive',
                })}
            </button>
        </div>
    </Popup>
}

function CopyPopup({survey, closePopup, refetch}) {
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    const annieUserSurveyPost = PostUsersToAnnieUserSurvey()
    const [copyRecipients, setCopyRecipients] = useState(false)
    const [copySupportProviders, setCopySupportProviders] = useState(false)
    const supportProviders = GetUserBySurvey(survey.id)
    const intl = useIntl()
    const {authData} = useAuthData()

    const duplicateSurvey = () => {
        const newSurveyData = {...survey}
        newSurveyData.config.title = "Copy of "+newSurveyData.config.title
        newSurveyData.updated = updateTimeToServerFormat(new Date())
        newSurveyData.updatedby = authData.uid
        newSurveyData.status = "DRAFT"
        newSurveyData.id = newID
        if (!copyRecipients) {
            newSurveyData.contacts = []
        }
        if (copySupportProviders) {
            if (supportProviders.isSuccess) {
                const newSupportProviders = [...supportProviders.data]
                for (let i = 0; i < newSupportProviders.length; i++) {
                    newSupportProviders[i].survey = newID
                }
                surveyPost.mutate(newSurveyData, {
                    onError: () => {
                        console.log("Duplicate error")
                    },
                    onSuccess: () => {
                        annieUserSurveyPost.mutate(newSupportProviders, {
                            onError: () => {
                                console.log("Annieusersurvey post error")
                            },
                            onSuccess: () => {
                                console.log("Duplicate success with annieusers")
                                closePopup()
                                refetch()
                            }
                        })
                    }
                })
            }
        } else {
            surveyPost.mutate(newSurveyData, {
                onError: () => {
                    console.log("Duplicate error")
                },
                onSuccess: () => {
                    console.log("Duplicate success")
                    closePopup()
                    refetch()
                }
            })
        }
    }

    return <Popup closePopup={() => closePopup()}>
        <h1>
            {intl.formatMessage({
                id: 'survey.duplicate.header',
                defaultMessage: 'Duplicate Survey',
            })}
            <b> {survey.config.title}</b>
        </h1>
        <p>
            {intl.formatMessage({
                id: 'survey.duplicate.options',
                defaultMessage: 'Also copy from survey:',
            })}
        </p>
        <div className={"options-container"}>
            <div>
                <input id={"check-contacts"} type={"checkbox"} checked={copyRecipients} onChange={()=>setCopyRecipients(!copyRecipients)}/>
                <label htmlFor={"check-contacts"}>
                    {intl.formatMessage({
                        id: 'survey.navigation.recipients',
                        defaultMessage: 'Recipients',
                    })}
                </label>
            </div>
            <div>
                <input id={"check-providers"} type={"checkbox"} checked={copySupportProviders} onChange={()=>setCopySupportProviders(!copySupportProviders)}/>
                <label htmlFor={"check-providers"}>
                    {intl.formatMessage({
                        id: 'survey.duplicate.supportProviders',
                        defaultMessage: 'Support Providers & Coordinators',
                    })}
                </label>
            </div>
        </div>
        <div className={"modal-options"}>
            <button className={"cancel"} onClick={()=>closePopup()}>
                {intl.formatMessage({
                    id: 'modal.cancel',
                    defaultMessage: 'Cancel',
                })}
            </button>
            <button className={"confirm"} onClick={()=>duplicateSurvey()}>
                {intl.formatMessage({
                    id: 'survey.duplicate',
                    defaultMessage: 'Duplicate',
                })}
            </button>
        </div>
    </Popup>
}

function OptionsPopover({setShowDuplicatePopup, setShowArchivePopup, setShowDeletePopup, surveyData}) {
    const surveyIsFinished = surveyData.hasOwnProperty("status") && surveyData.status === "FINISHED"
    const surveyIsDraft = surveyData.hasOwnProperty("status") && surveyData.status === "DRAFT"
    const {currentUserData} = useCurrentUserData()
    const isSuperUser = currentUserData.hasOwnProperty("superuser") && currentUserData.superuser
    const [popoverOpen, setPopoverOpen] = useState(false)
    const intl = useIntl()

    return <div className={"options-popover popover-container"} onClick={(e)=> {
        e.preventDefault()
        e.stopPropagation()
    }}>
        <div className={"popover-toggle"} onClick={(e)=> {
            setPopoverOpen(true)
        }}>
            <OptionsIcon />
        </div>
        {popoverOpen &&
        <Popover closePopover={() => setPopoverOpen(false)}>
            <p onClick={() => {
                setShowDuplicatePopup()
            }}>
                <DuplicateIcon />
                {intl.formatMessage(
                    {
                        id: 'main.surveys.duplicate',
                        defaultMessage: 'Duplicate Survey',
                    })}
            </p>
            {surveyIsDraft &&
            <p className={"red"} onClick={()=>setShowDeletePopup()}>
                <DeleteIcon />
                {intl.formatMessage(
                    {
                        id: 'survey.delete.draft',
                        defaultMessage: 'Delete Draft',
                    })}
            </p>
            }
            {isSuperUser &&
                surveyIsFinished ?
            <p onClick={() => {
                setShowArchivePopup()
            }}>
                <ArchiveIcon/>
                {intl.formatMessage(
                    {
                        id: 'survey.archive.header',
                        defaultMessage: 'Archive',
                    })}
            </p> :
                <p className={"disabled"} title={intl.formatMessage(
                    {
                        id: 'survey.archive.disabledTitle',
                        defaultMessage: 'Only finished surveys can be archived',
                    })}>
                    <ArchiveIcon/>
                    {intl.formatMessage(
                        {
                            id: 'survey.archive.header',
                            defaultMessage: 'Archive',
                        })}
                </p>
            }
        </Popover>
        }
    </div>
}

function LoadingSkeleton() {
    const intl = useIntl()
    return <>
        <div className={"group-divider"}>
            <p>
                <span className={"chevron"}>
                    <Chevron />
                </span>
                {intl.formatMessage(
                    {
                        id: 'loading',
                        defaultMessage: 'Loading..',
                    })}
            </p>
        </div>
        <div className={"surveys-container"}>
            {
                [...Array(9)].map( (e, i) => {
                    return <div key={i} className={"survey skeleton-container"}>
                        <Skeleton height={20}/>
                        <Skeleton height={20} width={100}/>
                        <br /><br /><br /><br />
                        <Skeleton height={10}/>
                        <Skeleton height={10} width={100}/>
                        <br />
                        <Skeleton height={10} width={10} circle={true}/> <Skeleton height={10} width={50} inline={true}/>
                    </div>
                })
            }
        </div>
    </>
}