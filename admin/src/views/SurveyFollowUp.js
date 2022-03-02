import React, {useEffect, useState} from "react";
import {FormattedMessage, useIntl} from "react-intl";
import '../scss/SurveyFollowUp.scss';
import {GetSurveys, GetSurveyWithId, GetUserBySurvey} from "../api/APISurvey";
import {useSurveyData, useUserData, useUserSurveyData} from "./SurveyView";
import {formatDate} from "../Formats";
import {getNameWithAnnieUser} from "../DataFunctions";

export default function SurveyFollowUp() {
    const {surveyData, setSurveyData} = useSurveyData()
    const intl = useIntl()
    const { status, data } = GetSurveys()
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false)
    const removeFollowUp = () => {
        const newSurveyData = {...surveyData}
        newSurveyData.followup = null
        setSurveyData(newSurveyData)
        setShowEmptyConfirm(false)
    }

    return <div className={"survey-follow-up"}>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.followUp',
                    defaultMessage: 'Follow Up',
                })}
        </h4>
        <p>
            {<FormattedMessage
                id={"survey.followUp.description"}
                defaultMessage={"Select the follow up survey. It has to be scheduled to be selected.{br}The recipients for the follow up survey will be the students that have reported a support need. They will be automatically selected after this survey ends."}
                values={{br: <br/>}}/>
            }
        </p>
        {status === "success" &&
        <SelectSurvey data={data}/>
        }
        {status === "error" &&
        <p className={"red"}>
            {intl.formatMessage(
            {
                id: 'survey.followUp.error',
                defaultMessage: 'Error in fetching surveys. Please refresh.',
            })}
        </p>
        }
        {status === "loading" &&
        <SelectSurveyLoadingSkeleton />
        }
        <h4 className={"flex"}>
            <span>
                {intl.formatMessage(
                {
                    id: 'survey.selectedFollowUp',
                    defaultMessage: 'Follow Up Survey Information',
                })}
                </span>
            {surveyData.followup &&
            <span className={"empty-list"}>
                {!showEmptyConfirm ?
                    <button className={"text"} onClick={()=>setShowEmptyConfirm(true)}>
                        {intl.formatMessage(
                            {
                                id: 'survey.removeFollowUp',
                                defaultMessage: 'Remove Follow Up',
                            })}
                    </button> :
                    <span>
                        {intl.formatMessage(
                            {
                                id: 'areYouSure',
                                defaultMessage: 'Are you sure?',
                            })} <button className={"text red"} onClick={()=>removeFollowUp()}>
                    {intl.formatMessage(
                        {
                            id: 'yes',
                            defaultMessage: 'Yes',
                        })}
                </button> / <button className={"text"} onClick={()=>setShowEmptyConfirm(false)}>
                    {intl.formatMessage(
                        {
                            id: 'no',
                            defaultMessage: 'No',
                        })}
                </button>
                    </span>
                }
            </span>
            }
        </h4>
        {!surveyData.followup &&
        <p className={"placeholder"}>
            {intl.formatMessage(
                {
                    id: 'survey.noFollowUp',
                    defaultMessage: 'No selected follow up survey.',
                })}
        </p>
        }
        {surveyData.hasOwnProperty("followup") && surveyData.followup &&
        <FollowUpContainer followUpSurveyId={surveyData.followup} />
        }
    </div>
}

function FollowUpContainer({followUpSurveyId}) {
    const getSurveyData = GetSurveyWithId(followUpSurveyId)
    const intl = useIntl()
    if (getSurveyData.status === "error") {
        return <p className={"red"}>
            {intl.formatMessage(
                {
                    id: 'survey.followUp.error',
                    defaultMessage: 'Error in fetching surveys. Please refresh.',
                })}
        </p>
    }
    if (getSurveyData.status === "loading") {
        return <p className={"placeholder"}>
            {intl.formatMessage(
                {
                    id: 'survey.followUp.loading',
                    defaultMessage: 'Loading follow up survey...',
                })}
        </p>
    }
    if (getSurveyData.status === "success") {
        return <FollowUpInformation data={getSurveyData.data[0]} />
    }
}

function FollowUpInformation({data}) {
    const intl = useIntl()
    let startTime, endTime
    switch (intl.locale) {
        case "en":
            startTime = new Date(formatDate(data.starttime)).toLocaleString("en-US")
            endTime = new Date(formatDate(data.endtime)).toLocaleString("en-US")
            break
        case "fi":
            startTime = new Date(formatDate(data.starttime)).toLocaleString("fi")
            endTime = new Date(formatDate(data.endtime)).toLocaleString("fi")
            break
        default:
            startTime = new Date(formatDate(data.starttime)).toLocaleString("en-US")
            endTime = new Date(formatDate(data.endtime)).toLocaleString("en-US")
    }

    return <table>
        <tbody>
        <tr>
            <th>
                {intl.formatMessage(
                    {
                        id: 'survey.information.name',
                        defaultMessage: 'Name',
                    })}
            </th>
            <td>
                {data.config.title}
            </td>
        </tr>
        <tr>
            <th>
                {intl.formatMessage(
                    {
                        id: 'survey.information.startTime',
                        defaultMessage: 'Start Time',
                    })}
            </th>
            <td>
                {startTime}
            </td>
        </tr>
        <tr>
            <th>
                {intl.formatMessage(
                {
                    id: 'survey.information.endTime',
                    defaultMessage: 'End Time',
                })}
            </th>
            <td>
                {endTime}
            </td>
        </tr>
        <tr>
            <th>
                {intl.formatMessage(
                    {
                        id: 'survey.supportNeeds.coordinators',
                        defaultMessage: 'Survey Coordinators',
                    })}
            </th>
            <td>
                <FollowUpCoordinators data={data}/>
            </td>
        </tr>
        </tbody>
    </table>
}

function FollowUpCoordinators({data}) {
    const getUserSurveyData = GetUserBySurvey(data.id)
    const intl = useIntl()
    const {userData} = useUserData()
    if (getUserSurveyData.status === "loading") {
        return <>
            {intl.formatMessage(
            {
                id: 'loading',
                defaultMessage: 'Loading...',
            })}
        </>
    }
    if (getUserSurveyData.status === "error") {
        return <>
            {intl.formatMessage(
            {
                id: 'coordinators.error',
                defaultMessage: 'Error in loading coordinators',
            })}
        </>
    }
    if (getUserSurveyData.status === "success") {
        const surveyCoordinators = getUserSurveyData.data.filter(user => user.meta.coordinator)
        if (surveyCoordinators.length > 0 ) {
            return surveyCoordinators.map((coordinator, i) => {
                return <div key={i}>
                    {getNameWithAnnieUser(userData, coordinator.annieuser)} – <i>{coordinator.annieuser}</i>
                </div>
            })
        }
        return <>
            {intl.formatMessage(
                {
                    id: 'survey.noCoordinators',
                    defaultMessage: 'Survey doesn\'t have a coordinator.',
                })}
        </>
    }
}

function SelectSurvey({data}) {
    const scheduledSurveys = data.filter(e => e.hasOwnProperty("status") && e.status === "SCHEDULED")
    const intl = useIntl()
    const [filterText, setFilterText] = useState("")
    const [searchData, setSearchData] = useState(scheduledSurveys)
    useEffect(()=>{
        setSearchData(scheduledSurveys.filter(survey => survey.config && survey.config.hasOwnProperty("title") && survey.config.title.toLowerCase().includes(filterText.toLowerCase())))
    }, [filterText])
    return <div>
        <input type={"text"} className={"search"} value={filterText}
               onChange={e => {
                   setFilterText(e.target.value)
               }}
               placeholder={intl.formatMessage(
                {
                    id: 'main.surveys.search.placeholder',
                    defaultMessage: 'Search for survey',
                })}/>
        <div className={"surveys-container"}>
            {searchData.sort((a, b) => b.updated.localeCompare(a.updated)).map(survey => (
                <Survey survey={survey} key={survey.id} />
            ))}
            {searchData.length < 1 &&
                <p className={"placeholder"}>
                    {intl.formatMessage(
                        {
                            id: 'main.surveys.noSurveys',
                            defaultMessage: 'No surveys to display.',
                        })}
                </p>
            }
        </div>
    </div>
}

function Survey({survey}) {
    const {surveyData, setSurveyData} = useSurveyData()
    const surveyTitle = survey.config && survey.config.hasOwnProperty("title") && survey.config.title
    const isActiveFollowUp = survey.id === surveyData.followup
    const setSurveyAsFollowUp = () => {
        const newSurveyData = {...surveyData}
        newSurveyData.followup = survey.id
        setSurveyData(newSurveyData)
    }
    return <div className={isActiveFollowUp ? "survey-title active" : "survey-title"} onClick={setSurveyAsFollowUp}>
        {surveyTitle}
    </div>
}

function SelectSurveyLoadingSkeleton() {
    const intl = useIntl()
    return <div>
        <input type={"text"} className={"search"} disabled
               placeholder={intl.formatMessage(
                   {
                       id: 'loading',
                       defaultMessage: 'Loading...',
                   })}/>
        <div className={"surveys-container"}>
            <p className={"placeholder"}>
                {intl.formatMessage(
                    {
                        id: 'loading',
                        defaultMessage: 'Loading...',
                    })}
            </p>
        </div>
    </div>
}