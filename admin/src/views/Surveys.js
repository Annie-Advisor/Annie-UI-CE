import {GetSurveys, PostSurveyWithId} from "../api/APISurvey"
import "../scss/Surveys.scss"
import {useIntl} from "react-intl"
import {formatDate, updateTimeToServerFormat} from "../Formats"
import {Popover, Skeleton, StatusText} from "../UIElements"
import { ReactComponent as Loader } from "../svg/loader.svg"
import { ReactComponent as PlusIcon } from "../svg/plus.svg"
import {ReactComponent as OptionsIcon} from "../svg/options.svg";
import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {ReactComponent as DuplicateIcon} from "../svg/duplicate.svg";
import {ReactComponent as SortOrderIcon} from "../svg/order.svg";
import {queryClient} from "../App";

export default function Surveys() {
    const { status, data, error, isFetching } = GetSurveys()
    const intl = useIntl()
    const [sortMethod, setSortMethod] = useState("updated")
    const [sortReverse, setSortReverse] = useState(false)
    const [searchText, setSearchText] = useState("")
    let searchData
    if (status === 'success') {
        searchData = data.filter(survey => survey.config.name[intl.locale].toLowerCase().includes(searchText.toLowerCase()))
        if (sortMethod === "alphabetical") {
            sortReverse ?
                searchData.sort((a, b) => b.config.name[intl.locale].localeCompare(a.config.name[intl.locale])) :
                searchData.sort((a, b) => a.config.name[intl.locale].localeCompare(b.config.name[intl.locale]))
        }
        if (sortMethod === "updated") {
            sortReverse ?
                searchData.sort((a, b) => b.updated.localeCompare(a.updated)) :
                searchData.sort((a, b) => a.updated.localeCompare(b.updated))
        }
        if (sortMethod === "starttime") {
            sortReverse ?
                searchData.sort((a, b) => b.starttime.localeCompare(a.starttime)) :
                searchData.sort((a, b) => a.starttime.localeCompare(b.starttime))
        }
        if (sortMethod === "endtime") {
            sortReverse ?
                searchData.sort((a, b) => b.endtime.localeCompare(a.endtime)) :
                searchData.sort((a, b) => a.endtime.localeCompare(b.endtime))
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
                <select value={sortMethod} onChange={e => setSortMethod(e.target.value)}>
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
                <div className={"sort-order"} onClick={()=>setSortReverse(!sortReverse)}>
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
            </div>
            <div className={"surveys"}>
                {
                    status === "loading" ? <LoadingSkeleton /> :
                    status === "error" ? <span>Error: {error.message}</span> :
                    <>
                        {searchData.length ? searchData.map((survey) => (
                            <Survey survey={survey} key={survey.id}/>
                        )): <p>
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

function Survey(props) {
    const config = props.survey.config
    let startTime = new Date(formatDate(props.survey.starttime))
    let endTime = new Date(formatDate(props.survey.endtime))
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
        <Link to={`/survey/${props.survey.id}`} className={props.survey.status === "DRAFT" ? "survey draft" : "survey"}>
            <OptionsPopUp survey={props.survey}/>
            <h3>
                {surveyName}
            </h3>
            <p>
                {startTime.getDate()}.{startTime.getMonth()+1}.{startTime.getFullYear()} {startTime.getHours()}.{startTime.getMinutes() < 10 ? '0' : ""}{startTime.getMinutes()} –<br/>
                {endTime.getDate()}.{endTime.getMonth()+1}.{endTime.getFullYear()} {endTime.getHours()}.{endTime.getMinutes() < 10 ? '0' : ""}{endTime.getMinutes()}
            </p>
            <StatusText survey={props.survey}/>
        </Link>
    </>
}

function OptionsPopUp({survey}) {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [newSurveyToAPI, setNewSurveyToAPI] = useState(null)
    const newID = JSON.stringify(new Date().getTime())
    const surveyPost = PostSurveyWithId(newID)
    const intl = useIntl()
    const copySurvey = () => {
        let newSurveyData = survey
        newSurveyData.updated = updateTimeToServerFormat(new Date())
        newSurveyData.updatedby = "Annie Survey Manager"
        newSurveyData.status = "DRAFT"
        setNewSurveyToAPI(newSurveyData)
    }
    useEffect(() => {
        if (newSurveyToAPI) {
            surveyPost.mutateAsync(newSurveyToAPI).then(()=>{
                queryClient.refetchQueries()
            })
        }
    }, [newSurveyToAPI])

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
                copySurvey()
                setPopoverOpen(false)
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
    return <>
        <div className={"survey skeleton-container"}>
            <Skeleton height={20}/>
            <Skeleton height={20} width={100}/>
            <br /><br /><br /><br />
            <Skeleton height={10}/>
            <Skeleton height={10} width={100}/>
            <br />
            <Skeleton height={10} width={10} circle={true}/> <Skeleton height={10} width={50} inline={true}/>
        </div>
        <div className={"survey skeleton-container"}>
            <Skeleton height={20}/>
            <Skeleton height={20} width={100}/>
            <br /><br /><br /><br />
            <Skeleton height={10}/>
            <Skeleton height={10} width={100}/>
            <br />
            <Skeleton height={10} width={10} circle={true}/> <Skeleton height={10} width={50} inline={true}/>
        </div>
        <div className={"survey skeleton-container"}>
            <Skeleton height={20}/>
            <Skeleton height={20} width={100}/>
            <br /><br /><br /><br />
            <Skeleton height={10}/>
            <Skeleton height={10} width={100}/>
            <br />
            <Skeleton height={10} width={10} circle={true}/> <Skeleton height={10} width={50} inline={true}/>
        </div>
    </>
}