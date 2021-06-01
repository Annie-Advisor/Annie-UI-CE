import {useMutation, useQuery} from "react-query"
import axios from "axios"
const basicAuth = {username: '', password: ''}

export function GetSurveys() {
    return useQuery("surveys", async () => {
        const { data } = await axios.get(
            "/api/survey.php",
            {
                auth: basicAuth
            }
        )
        return data
    })
}

export function GetSurveyWithId(surveyId) {
    // TODO: Check caching. Currently not updated when editing
    return useQuery(['surveys', { id:  surveyId }], async () => {
        const { data } = await axios.get(
            "/api/survey.php/"+surveyId,
            {
                auth: basicAuth
            }
        )
        return data
    }, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 1000 * 60 * 60 * 24,
    })
}

export function UpdateSurveyWithId(surveyId) {
    return useMutation(['surveys', { id:  surveyId }],surveyData => {
        const data = axios.put(
            "/api/survey.php/" + surveyId,
            surveyData,
            {
                auth: basicAuth
            })
        return data
    })
}

export function PostSurveyWithId(surveyId) {
    return useMutation(['surveys', { id:  surveyId }],surveyData => {
        const data = axios.post(
            "/api/survey.php/" + surveyId,
            surveyData,
            {
                auth: basicAuth
            })
        return data
    })
}