import React from "react";
import '../scss/SurveyResults.scss';
import {useIntl} from "react-intl";
import {useSurveyData} from "./SurveyView";

export default function SurveyResults() {
    const intl = useIntl()
    const {surveyData} = useSurveyData()
    const canDownload = surveyData.status === "FINISHED" || surveyData.status === "IN PROGRESS" || surveyData.status === "ARCHIVED"

    function downloadResults() {
        const hostname = window.location.hostname === "localhost" ? 'dev.annieadvisor.com' : window.location.hostname
        const downloadURL = "https://"+hostname+"/api/survey-report.php?returntype=csvfile&survey="+surveyData.id
        window.open(downloadURL, '_blank')
    }

    return <div className={"survey-results"}>
        <h4>
            {intl.formatMessage(
                {
                    id: 'survey.navigation.results',
                    defaultMessage: 'Results',
                })}
        </h4>
        {canDownload ?
            <button className={"add-new-button"} onClick={downloadResults}>
                {intl.formatMessage(
                    {
                        id: 'survey.results.downloadReport',
                        defaultMessage: 'Download Report (CSV)',
                    })}
            </button> :
            <>
                <p className={"placeholder"}>
                    {intl.formatMessage(
                        {
                            id: 'survey.results.downloadPlaceholder',
                            defaultMessage: 'Survey results can be accessed when survey is finished or in progress.',
                        })}
                </p>
                <button className={"add-new-button"} disabled>
                    {intl.formatMessage(
                        {
                            id: 'survey.results.downloadReport',
                            defaultMessage: 'Download Report (CSV)',
                        })}
                </button>
            </>
        }
    </div>
}