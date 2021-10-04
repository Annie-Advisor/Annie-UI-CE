import {GetSurveys, GetUserBySurvey, PostSurveyWithId, PostUsersToAnnieUserSurvey} from "../api/APISurvey"
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
import {ReactComponent as Chevron} from "../svg/chevron.svg";
import {queryClient} from "../App";
import _ from "lodash"

export default function Surveys() {
    const { status, data, error, isFetching, refetch } = GetSurveys()
    const intl = useIntl()
    const sortMethodFromStorage = localStorage.getItem("sortMethod")
    const sortDirectionFromStorage = localStorage.getItem("sortDirection")
    const groupingSpanFromStorage = localStorage.getItem("groupingSpan")
    const [sortMethod, setSortMethod] = useState(sortMethodFromStorage ? sortMethodFromStorage : "updated")
    const [sortDirection, setSortDirection] = useState(sortDirectionFromStorage ? JSON.parse(sortDirectionFromStorage) : false)
    const [searchText, setSearchText] = useState("")
    const [groupingSpan, setGroupingSpan] = useState(groupingSpanFromStorage ? groupingSpanFromStorage : "month")
    let searchData
    let searchGroups
    if (status === 'success') {
        searchData = data.filter(survey => survey.config && survey.config.name[intl.locale].toLowerCase().includes(searchText.toLowerCase()))
        if (sortMethod === "alphabetical") {
            sortDirection ?
            searchData.sort((a, b) => b.config.name[intl.locale].localeCompare(a.config.name[intl.locale])) :
                searchData.sort((a, b) => a.config.name[intl.locale].localeCompare(b.config.name[intl.locale]))
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
            searchGroups = _.groupBy(searchData, e => e.updated.slice(0,10))
        }
        if (groupingSpan === "month" && sortMethod !== "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e.updated.slice(0,7))
        }
        if (groupingSpan === "year" && sortMethod !== "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e.updated.slice(0,4))
        }
        if (sortMethod === "alphabetical") {
            searchGroups = _.groupBy(searchData, e => e.config.name[intl.locale])
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
            <div className={"search-sort-surveys"}>
                <p>{intl.formatMessage(
                    {
                        id: 'main.surveys.sort',
                        defaultMessage: 'Sort by',
                    })}
                </p>
                <select value={sortMethod} onChange={e => {
                    setSortMethod(e.target.value)
                    localStorage.setItem("sortMethod", e.target.value)
                }}>
                    <option value={"updated"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.sort.updated',
                            defaultMessage: 'Updated',
                        }
                    )}</option>
                    <option value={"alphabetical"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.sort.alphabetical',
                            defaultMessage: 'Alphabetical',
                        }
                    )}</option>
                    <option value={"starttime"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.sort.starttime',
                            defaultMessage: 'Start Time',
                        }
                    )}</option>
                    <option value={"endtime"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.sort.endtime',
                            defaultMessage: 'End Time',
                        }
                    )}</option>
                </select>
                <div className={"sort-order"} onClick={()=> {
                    setSortDirection(!sortDirection)
                    localStorage.setItem("sortDirection", JSON.stringify(!sortDirection))
                }}>
                    <SortOrderIcon />
                </div>
                <input type={"text"} className={"search"} value={searchText}
                       onChange={e => {
                           setSearchText(e.target.value)
                       }}
                       placeholder={intl.formatMessage(
                    {
                        id: 'main.surveys.search.placeholder',
                        defaultMessage: 'Search for survey',
                    })}/>
                <p className={"margin-left"}>{intl.formatMessage(
                    {
                        id: 'main.surveys.group',
                        defaultMessage: 'Group by',
                    })}
                </p>
                <select disabled={sortMethod === "alphabetical"} value={groupingSpan} onChange={e => {
                    setGroupingSpan(e.target.value)
                    localStorage.setItem("groupingSpan", e.target.value)
                }}>
                    <option value={"day"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.group.day',
                            defaultMessage: 'Day',
                        }
                    )}</option>
                    <option value={"month"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.group.month',
                            defaultMessage: 'Month',
                        }
                    )}</option>
                    <option value={"year"}>{intl.formatMessage(
                        {
                            id: 'main.surveys.group.year',
                            defaultMessage: 'Year',
                        }
                    )}</option>
                </select>
            </div>
            <div className={sortMethod === "alphabetical" ? "surveys surveys-container" : "surveys"}>
                {
                    status === "loading" ? <LoadingSkeleton /> :
                    status === "error" ? <span>Error: {error.message}</span> :
                    <>
                        {searchGroups ?
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
    )
}

function SearchGroup({searchGroups, group, groupingSpan, refetch}) {
    const [groupVisibility, setGroupVisibility] = useState(true)
    const intl = useIntl()
    let date = new Date(formatDate(group))
    let dateDisplay
    switch (groupingSpan) {
        case "day":
            dateDisplay = date.getDate() + " " + date.toLocaleString(intl.locale, { month: 'long' }) + " " + date.getFullYear()
            break
        case "month":
            dateDisplay = date.toLocaleString(intl.locale, { month: 'long' }) + " " + date.getFullYear()
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
    const [showPopup, setShowPopup] = useState(false)
    let startTime = new Date(formatDate(survey.starttime))
    let endTime = new Date(formatDate(survey.endtime))
    let surveyName
    const intl = useIntl()
    switch (intl.locale) {
        case "en":
            surveyName = config.name.en
            break
        case "fi":
            surveyName = config.name.fi
            break
        default:
            surveyName = config.name.en
    }

    return <>
        <Link to={`/survey/${survey.id}`} className={survey.status === "DRAFT" ? "survey draft" : "survey"}>
            <OptionsPopUp survey={survey} setShowPopup={() => setShowPopup(true)}/>
            <h3>
                {surveyName}
            </h3>
            <p>
                {startTime.getDate()}.{startTime.getMonth()+1}.{startTime.getFullYear()} {startTime.getHours()}.{startTime.getMinutes() < 10 ? '0' : ""}{startTime.getMinutes()} –<br/>
                {endTime.getDate()}.{endTime.getMonth()+1}.{endTime.getFullYear()} {endTime.getHours()}.{endTime.getMinutes() < 10 ? '0' : ""}{endTime.getMinutes()}
            </p>
            <StatusText survey={survey}/>
        </Link>
        {showPopup &&
            <CopyPopup survey={survey} closePopup={()=>setShowPopup(false)} refetch={refetch}/>
        }
    </>
}

function CopyPopup({survey, closePopup, refetch}) {
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    const annieUserSurveyPost = PostUsersToAnnieUserSurvey()
    const [copyRecipients, setCopyRecipients] = useState(false)
    const [copySupportProviders, setCopySupportProviders] = useState(false)
    const supportProviders = GetUserBySurvey(survey.id)
    const intl = useIntl()

    const duplicateSurvey = () => {
        const newSurveyData = {...survey}
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
            newSurveyData.config.name[lang] = "Copy of "+newSurveyData.config.name[lang]
        }
        newSurveyData.updated = updateTimeToServerFormat(new Date())
        newSurveyData.updatedby = "Annie Survey Manager"
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
            <b> {survey.config.name[intl.locale]}</b>
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
                    defaultMessage: 'Monista',
                })}
            </button>
        </div>
    </Popup>
}

function OptionsPopUp({survey, setShowPopup}) {
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
            <div onClick={() => {
                setShowPopup()
            }}>
                <DuplicateIcon />
                {intl.formatMessage(
                    {
                        id: 'main.surveys.duplicate',
                        defaultMessage: 'Duplicate',
                    })}
            </div>
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